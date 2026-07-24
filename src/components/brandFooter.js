/**
 * brandFooter.js - the "Game Goodness" branding lockup shown on the opening
 * title screen and again at the end of the game.
 *
 * The horizontal logo sits above a single credit line:
 *   "An Initiative by Foundation of Goodness."
 */

import { el } from '../engine/dom.js';
import { ASSETS } from '../data/config.js';

/**
 * Build the brand footer element.
 * @param {object} [opts]
 * @param {boolean} [opts.fixed] pin it to the bottom of the screen (title use).
 */
export function createBrandFooter({ fixed = false } = {}) {
  return el('div.brand-footer' + (fixed ? '.brand-footer-fixed' : ''), {}, [
    el('img.brand-logo', {
      src: ASSETS.brand, alt: 'Game Goodness', draggable: false,
    }),
    el('div.brand-note', {}, [
      'Game Goodness™ is a trademark of the Foundation of Goodness. ' +
      '© 2026 Foundation of Goodness. All rights reserved.',
    ]),
  ]);
}
