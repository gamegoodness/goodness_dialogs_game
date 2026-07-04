/**
 * portrait.js — the featured character standing on the stage.
 *
 * Each moment has a `char` key (see scenarios.js) naming the person the scene is
 * about, and every story beat can name a speaker. The portrait rises in from
 * behind the dialog box when the moment begins, gently floats while on screen,
 * and pops slightly each time a character starts speaking (`speak(key)`), so
 * the player's eye goes to whoever is talking.
 *
 * While PLACEHOLDERS.character is set in config.js, every speaker renders with
 * the same common placeholder art; drop real art in later and it swaps per key.
 */

import { el } from '../engine/dom.js';
import { charImage } from '../data/config.js';
import { CHARACTER_NAMES } from '../data/scenarios.js';

export function createPortrait(charKey) {
  const img = el('img.portrait-img', {
    src: charImage(charKey) || '', alt: CHARACTER_NAMES[charKey] || '', draggable: false,
  });
  const root = el('div.portrait.portrait-in', {}, [img]);

  function setChar(key) {
    const src = charImage(key);
    if (src && img.src !== src) img.src = src;
    img.alt = CHARACTER_NAMES[key] || '';
  }

  return {
    el: root,
    /** Swap to a new character and replay the full entrance (new moment). */
    show(newKey) {
      setChar(newKey);
      root.classList.remove('portrait-in', 'portrait-pop');
      void root.offsetWidth;
      root.classList.add('portrait-in');
    },
    /** A character starts talking: swap art if needed + quick attention pop. */
    speak(key) {
      setChar(key);
      root.classList.remove('portrait-in', 'portrait-pop');
      void root.offsetWidth;
      root.classList.add('portrait-pop');
    },
  };
}
