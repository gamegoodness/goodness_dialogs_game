/**
 * transitions.js — scene swapping + a global input guard.
 *
 * swapScene() animates the outgoing scene out and the incoming scene in, so
 * every screen change (title → moment → outcome → next → final) is a smooth
 * crossfade/slide instead of an instant DOM swap.
 *
 * The GUARD prevents broken states from rapid-clicking during an animation:
 * navigation actions run through `guard.run()`, which ignores calls while a
 * transition is in flight.
 */

import { TIMING } from '../data/config.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Resolve after `ms`, or immediately under reduced-motion. */
function wait(ms) {
  return new Promise((res) => setTimeout(res, REDUCED ? 0 : ms));
}

/**
 * Swap the single child of `container` for `newEl` with out/in animations.
 * direction: 'forward' | 'back' | 'fade' — controls slide direction.
 */
export async function swapScene(container, newEl, direction = 'forward') {
  const old = container.firstElementChild;

  if (old) {
    old.classList.remove('scene-in-forward', 'scene-in-back', 'scene-in-fade');
    old.classList.add(direction === 'back' ? 'scene-out-back'
      : direction === 'fade' ? 'scene-out-fade' : 'scene-out-forward');
    await wait(TIMING.sceneOutMs);
    old.remove();
  }

  newEl.classList.add(direction === 'back' ? 'scene-in-back'
    : direction === 'fade' ? 'scene-in-fade' : 'scene-in-forward');
  container.appendChild(newEl);
  // Force reflow so the entrance animation always plays.
  void newEl.offsetWidth;
  await wait(TIMING.sceneInMs);
  return newEl;
}

/**
 * A simple re-entrancy guard. `guard.run(async fn)` executes fn only if no
 * other guarded action is currently running, and blocks new ones until it
 * finishes. This is what stops double-triggers from rapid clicks.
 */
export const guard = {
  _busy: false,
  get busy() { return this._busy; },
  async run(fn) {
    if (this._busy) return false;
    this._busy = true;
    try { await fn(); }
    finally { this._busy = false; }
    return true;
  },
};
