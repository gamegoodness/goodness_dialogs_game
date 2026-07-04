/**
 * portrait.js — the featured character standing on the stage.
 *
 * Each moment has a `char` key (see scenarios.js) naming the person the scene is
 * about. Their portrait rises in from behind the dialog box when the moment
 * begins, gives the scene a face, and gently floats while it's on screen. When
 * the next moment starts, `show(key)` swaps the art and replays the entrance.
 */

import { el } from '../engine/dom.js';
import { charImage } from '../data/config.js';
import { CHARACTER_NAMES } from '../data/scenarios.js';

export function createPortrait(charKey) {
  const img = el('img.portrait-img', {
    src: charImage(charKey) || '', alt: CHARACTER_NAMES[charKey] || '', draggable: false,
  });
  const root = el('div.portrait.portrait-in', {}, [img]);

  return {
    el: root,
    /** Swap to a new character and replay the entrance. */
    show(newKey) {
      if (newKey) img.src = charImage(newKey) || '';
      img.alt = CHARACTER_NAMES[newKey] || '';
      root.classList.remove('portrait-in');
      void root.offsetWidth;
      root.classList.add('portrait-in');
    },
  };
}
