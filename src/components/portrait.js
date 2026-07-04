/**
 * portrait.js — the story illustration standing on the stage.
 *
 * The art in /assets/images/<moment>/ is a set of transparent cutout
 * illustrations, one per story beat (e.g. "2/mom_hug_milo.png"). Story beats
 * and outcome cards name the illustration they want via their `img` field
 * (see scenarios.js); the scene calls show(img) and this component crossfades
 * from the previous illustration to the new one, like turning the page of a
 * picture book. speak() gives a small attention pop when a character talks.
 */

import { el } from '../engine/dom.js';
import { storyImage } from '../data/config.js';

export function createPortrait(initialImg) {
  const img = el('img.portrait-img', { alt: '', draggable: false });
  const root = el('div.portrait', {}, [img]);

  let current = null;

  function setImage(file) {
    if (!file) {
      current = null;
      root.classList.add('portrait-empty');
      return;
    }
    root.classList.remove('portrait-empty');
    if (file === current) return;
    current = file;
    img.src = storyImage(file);
    // Replay the entrance so a new illustration steps onto the stage.
    root.classList.remove('portrait-in', 'portrait-pop');
    void root.offsetWidth;
    root.classList.add('portrait-in');
  }

  setImage(initialImg || null);

  return {
    el: root,
    /** Show a story illustration (null hides the stage art). */
    show(file) { setImage(file); },
    /** A character starts talking: swap art if needed + quick attention pop. */
    speak(file) {
      if (file && file !== current) { setImage(file); return; }
      if (!current) return;
      root.classList.remove('portrait-in', 'portrait-pop');
      void root.offsetWidth;
      root.classList.add('portrait-pop');
    },
  };
}
