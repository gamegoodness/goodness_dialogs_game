/**
 * virtueChip.js - a virtue badge that pops in on the final screen.
 *
 * revealVirtues() appends chips one at a time with a bouncy pop, staggered by
 * TIMING.virtueStaggerMs, instead of showing them all at once.
 */

import { el } from '../engine/dom.js';
import { TIMING } from '../data/config.js';
import { sfx } from '../engine/audio.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function createVirtueRow() {
  const row = el('div.chips');
  return {
    el: row,
    /** Pop each virtue in, one after another. */
    reveal(virtues, startDelay = 0) {
      virtues.forEach((v, i) => {
        const chip = el('span.chip', {}, [v]);
        if (!REDUCED) chip.classList.add('chip-hidden');
        row.appendChild(chip);
        if (REDUCED) return;
        setTimeout(() => {
          chip.classList.remove('chip-hidden');
          chip.classList.add('chip-pop');
          sfx.pop();
        }, startDelay + i * TIMING.virtueStaggerMs);
      });
    },
  };
}
