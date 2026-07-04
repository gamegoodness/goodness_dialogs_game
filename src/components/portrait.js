/**
 * portrait.js - the story illustration standing on the stage.
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
      // The entrance animation classes must go too: their fill-mode opacity
      // outranks .portrait-empty, which is how a finished story's character
      // used to linger into the next one.
      root.classList.remove('portrait-in', 'portrait-pop');
      root.classList.add('portrait-empty');
      // After the fade-out, drop the old art entirely so the next story can
      // never flash the previous story's character while its image loads.
      setTimeout(() => { if (!current) img.removeAttribute('src'); }, 500);
      return;
    }
    if (file === current) {
      root.classList.remove('portrait-empty');
      return;
    }
    current = file;
    // Stay hidden until the new illustration has loaded, then replay the
    // entrance - otherwise the previous image shows during the swap.
    root.classList.remove('portrait-in', 'portrait-pop');
    root.classList.add('portrait-empty');
    img.onload = () => {
      if (current !== file) return;
      root.classList.remove('portrait-empty');
      void root.offsetWidth;
      root.classList.add('portrait-in');
    };
    img.src = storyImage(file);
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
