/**
 * main.js — bootstrap + top-level scene router.
 *
 * Owns the three top-level screen swaps (title → game → final → title) and the
 * shared background. In-moment interaction is handled inside gameScene; main
 * only gets involved when the whole screen changes.
 *
 * The `app` context passed to every scene exposes the background controller and
 * the three navigation helpers (toGame / toFinal / toTitle).
 */

import { TIMING } from './data/config.js';
import { swapScene } from './engine/transitions.js';
import { createBackground } from './components/background.js';
import { createTitleScene } from './scenes/titleScene.js';
import { createFormScene } from './scenes/formScene.js';
import { createGameScene } from './scenes/gameScene.js';
import { createFinalScene } from './scenes/finalScene.js';
import { startGame, replayGame, G } from './engine/state.js';
import { startSession, logEvent } from './engine/analytics.js';

// Expose animation timings to CSS so JS + CSS stay in sync (see config.js).
function applyTimingVars() {
  const r = document.documentElement.style;
  r.setProperty('--scene-out', TIMING.sceneOutMs + 'ms');
  r.setProperty('--scene-in', TIMING.sceneInMs + 'ms');
  r.setProperty('--bg-crossfade', TIMING.bgCrossfadeMs + 'ms');
  r.setProperty('--angel-enter', TIMING.angelEnterMs + 'ms');
  r.setProperty('--angel-idle', TIMING.angelIdleMs + 'ms');
  r.setProperty('--choice-reveal', TIMING.choiceRevealMs + 'ms');
  r.setProperty('--dot-change', TIMING.dotChangeMs + 'ms');
  r.setProperty('--virtue-pop', TIMING.virtuePopMs + 'ms');
}

function boot() {
  applyTimingVars();

  const bgHost = document.getElementById('bg');
  const sceneRoot = document.getElementById('scene-root');
  const background = createBackground(bgHost);

  let current = null;

  async function mount(scene, direction) {
    if (current && current.destroy) current.destroy();
    current = scene;
    // Begin the background crossfade as the new scene enters.
    background.crossfadeTo(scene.bg);
    await swapScene(sceneRoot, scene.el, direction);
    if (scene.enter) scene.enter();
  }

  const app = {
    background,
    async toForm() { await mount(createFormScene(app), 'forward'); },
    async toGame() {
      startGame();
      startSession();
      logEvent('game_start', {});
      await mount(createGameScene(app), 'forward');
    },
    async toFinal() { G.screen = 'final'; await mount(createFinalScene(app), 'forward'); },
    async toTitle() { replayGame(); await mount(createTitleScene(app), 'back'); },
  };

  // First paint — set the title background instantly (no crossfade from blank).
  const title = createTitleScene(app);
  background.set(title.bg);
  current = title;
  sceneRoot.appendChild(title.el);
  title.el.classList.add('scene-in-fade');
  title.enter();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
