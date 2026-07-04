/**
 * scoreBadge.js — the goodness score pill + animated count-up.
 *
 * The in-game pill bumps when the score changes. The final-screen ring uses
 * countTo() to roll the number up from 0 for a satisfying reveal.
 */

import { el } from '../engine/dom.js';
import { TIMING } from '../data/config.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function fmt(n) { return (n >= 0 ? '+' : '') + n; }

/** Small top-bar pill. */
export function createScorePill(score) {
  const val = el('span.pill-val', {}, [fmt(score)]);
  const pill = el('div.pill', {}, [el('span.gem', {}, ['💛']), val]);
  return {
    el: pill,
    /** Bump the pill and update its value. */
    update(newScore) {
      val.textContent = fmt(newScore);
      pill.classList.remove('pill-bump');
      void pill.offsetWidth;
      pill.classList.add('pill-bump');
    },
  };
}

/**
 * Animate `elNode` text from 0 → target over TIMING.scoreCountMs.
 * Used by the final ring.
 */
export function countTo(elNode, target, onDone) {
  if (REDUCED) { elNode.textContent = fmt(target); if (onDone) onDone(); return; }
  const start = performance.now();
  const dur = TIMING.scoreCountMs;
  function frame(now) {
    const t = Math.min(1, (now - start) / dur);
    // easeOutCubic
    const eased = 1 - Math.pow(1 - t, 3);
    const current = Math.round(target * eased);
    elNode.textContent = fmt(current);
    if (t < 1) requestAnimationFrame(frame);
    else { elNode.textContent = fmt(target); if (onDone) onDone(); }
  }
  requestAnimationFrame(frame);
}
