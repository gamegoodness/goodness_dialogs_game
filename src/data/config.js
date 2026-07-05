/**
 * config.js - asset paths + animation tuning.
 *
 * ── Swap placeholder art ──────────────────────────────────────────────
 * Every image the game loads is listed under ASSETS. Drop a real PNG with
 * the same filename into /assets/images and it appears automatically. To
 * point at a different filename, edit the path here - nothing else changes.
 *
 * ── Adjust animation timing/style ─────────────────────────────────────
 * TIMING is the single source of truth for animation speed/feel. These
 * values are also exported to CSS as custom properties (see applyTimingVars
 * in main.js), so both JS-driven and CSS-driven animations stay in sync.
 */

const IMG = './assets/images/';

export const ASSETS = {
  angel: IMG + 'good angel/angel good (1).svg',
  logo: IMG + 'good angel/angel good (1).svg',
  // "Game Goodness" brand lockup, shown in the title + final footer.
  brand: IMG + 'game goodness logo.png',
  backgrounds: {
    // Scenario backgrounds 1-6 map to moments 1-6 (see each moment's `image`
    // in scenarios.js). backgrounds/7.png is reserved for the upcoming
    // episode - not used yet. Title/final reuse scenario art meanwhile.
    title: IMG + 'backgrounds/1.png',
    final: IMG + 'backgrounds/6.png',
  },
  icons: {
    heart: IMG + 'icon-heart.png',
    star: IMG + 'icon-star.png',
    honesty: IMG + 'icon-honesty.png',
    courage: IMG + 'icon-courage.png',
    respect: IMG + 'icon-respect.png',
    reflection: IMG + 'icon-reflection.png',
  },
};

/** Resolve a scenario background image path (falls back to CSS gradient only). */
export function bgImage(fileName) {
  return fileName ? IMG + fileName : null;
}

/** Resolve a story illustration path (moment/beat art under assets/images). */
export function storyImage(fileName) {
  return fileName ? IMG + fileName : null;
}

export const TIMING = {
  // Typewriter
  typeCharMs: 22,        // ms per character for narration
  dialogueCharMs: 36,    // ms per character when a CHARACTER is speaking (slower, more weight)
  typePunctMs: 180,      // extra pause after punctuation (adds weight)
  typeStartDelay: 120,   // ms before typing begins after a scene settles

  // Scenario title card (shown at the start of every moment)
  sceneCardMs: 2400,     // auto-dismiss delay (a tap dismisses it sooner)

  // Scene transitions (must match CSS var --scene-transition)
  sceneOutMs: 320,       // old scene fades/slides out
  sceneInMs: 420,        // new scene fades/slides in
  bgCrossfadeMs: 800,    // background gradient/image crossfade

  // Angel
  angelEnterMs: 620,     // float-in when the angel speaks
  angelIdleMs: 4200,     // gentle idle float loop period

  // Choices
  choiceStaggerMs: 90,   // delay between each choice button appearing
  choiceRevealMs: 380,   // each button's entrance duration

  // Score & virtues (final screen)
  scoreCountMs: 1100,    // duration of the score count-up
  virtueStaggerMs: 220,  // delay between virtue chips popping in
  virtuePopMs: 520,      // each chip's pop/bounce duration

  // Progress dots
  dotChangeMs: 450,      // dot on/done state transition
};
