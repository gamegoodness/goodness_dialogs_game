/**
 * config.js — asset paths + animation tuning.
 *
 * ── Swap placeholder art ──────────────────────────────────────────────
 * Every image the game loads is listed under ASSETS. Drop a real PNG with
 * the same filename into /assets/images and it appears automatically. To
 * point at a different filename, edit the path here — nothing else changes.
 *
 * ── Adjust animation timing/style ─────────────────────────────────────
 * TIMING is the single source of truth for animation speed/feel. These
 * values are also exported to CSS as custom properties (see applyTimingVars
 * in main.js), so both JS-driven and CSS-driven animations stay in sync.
 */

const IMG = './assets/images/';

export const ASSETS = {
  angel: IMG + 'angel.png',
  logo: IMG + 'logo.png',
  characters: {
    milo: IMG + 'milo.png',
    priya: IMG + 'priya.png',
    jai: IMG + 'jai.png',
    sam: IMG + 'sam.png',
  },
  backgrounds: {
    title: IMG + 'bg-title.png',
    final: IMG + 'bg-final.png',
    // scenario backgrounds are referenced per-moment via moment.image
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

/**
 * PLACEHOLDERS — temporary common art while the real per-scenario art is made.
 *
 * While `background` is set, EVERY scenario uses that one background image.
 * While `character` is set, EVERY speaker uses that one portrait image.
 * Set either to null to switch back to the real per-scenario / per-character
 * art (moment.image and ASSETS.characters) with no other code changes.
 */
export const PLACEHOLDERS = {
  background: 'bg-scenario-1.png',
  character: 'milo.png',
};

/** Resolve a scenario background image path (falls back to CSS gradient only). */
export function bgImage(fileName) {
  const file = PLACEHOLDERS.background || fileName;
  return file ? IMG + file : null;
}

/** Resolve a character portrait path by its key (see ASSETS.characters). */
export function charImage(key) {
  if (PLACEHOLDERS.character) return IMG + PLACEHOLDERS.character;
  return ASSETS.characters[key] || null;
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
