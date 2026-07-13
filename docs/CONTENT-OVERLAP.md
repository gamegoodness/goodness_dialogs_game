# Content overlapping "in the middle" between stories

> If you are here because two scenarios' text/art are bleeding into each other
> in the middle of the screen — read this before touching the CSS again. This
> has been mis-fixed several times as a CSS layering problem. It is not.

## Symptom

You play a moment, reach the outcome, type a reflection, click **Next** — and the
new story starts while a piece of the previous story is still on screen: an old
speech-bubble line, a lingering character illustration, the old "What happened"
nameplate, or half-faded outcome text sitting behind/over the new scenario.
It looks like content is "overloading into one place."

## Root cause (the important part)

`createGameScene()` in [src/scenes/gameScene.js](../src/scenes/gameScene.js) is
built **once** and reused for **every** moment in the episode. It is NOT rebuilt
per moment. That means all 7 stories share the exact same surfaces:

- one `.stage` (the middle) with **one** speech bubble (`speechText` /
  `speechName`) and **one** illustration (`portrait`),
- one `.content-area` (bottom dialog) that every phase swaps through,
- shared state classes on `.scene.vn` (`focused`, `charline`, `storying`).

So a "new story" is really the same DOM typing over the previous story's
surfaces. **Anything the previous moment left behind shows through the next
one.** There is no separate container per story to isolate them — they are the
same container.

## Why the earlier fixes didn't hold

Each leftover was patched individually as it was noticed — the portrait linger
(see [portrait.js](../src/components/portrait.js) `setImage(null)`), the
speech-text linger, the nameplate linger, the two-phases-side-by-side squash in
CSS (`.content-area > .phase`). That is whack-a-mole: every new moment-scoped
surface added later becomes a new way to leak, and the guarantee rots.

## The permanent fix

There is **one** authority that clears the stage at a moment boundary:
`resetMomentStage()` in [gameScene.js](../src/scenes/gameScene.js). It is called
from `onNext()` the instant we move to a new moment, and it wipes **every**
shared surface in one place:

1. stops anything still animating (`activeRun.skip()`, cancels all typewriters),
2. empties `contentArea` outright (`replaceChildren()`) so no half-faded phase
   from the last moment can coexist with the new story's phase,
3. clears the speech bubble text/speaker, its pop animation and JS-set position,
4. drops every focus/story state class and hides the OK button,
5. resets to narrator chrome + blank illustration.

### Rule for future changes

If you add anything that is **scoped to a single moment** and lives on a
**shared** surface (the stage, the bubble, the dialog, a state class on
`.scene.vn`), you MUST also clear it inside `resetMomentStage()`. Do not sprinkle
one-off clears through `onNext` again — that is exactly what stopped working
before. One story = one clean slate, guaranteed from one function.

### CSS backstop

`.content-area > .phase:not(:last-child)` in
[main.css](../src/styles/main.css) pulls any non-current phase out of flow so
two phases can never sit side-by-side and squash together during an in-moment
swap (c1 → c2 → outcome). That is a backstop for *in-moment* phase swaps; the
*cross-moment* isolation is `resetMomentStage()`, not CSS.
