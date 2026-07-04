/**
 * angel.js — the Good Angel narrator.
 *
 * Renders the angel image + a speech line. The angel:
 *  - floats/fades IN each time it speaks (angel-enter animation),
 *  - has a gentle continuous idle float (angel-idle loop),
 *  - shows a small mood face badge that reflects G.am,
 *  - types its line with the typewriter engine.
 *
 * Returns { el, speak(text) } so a scene can update the line without
 * re-mounting the whole angel (keeps the idle motion uninterrupted).
 */

import { el } from '../engine/dom.js';
import { typewrite } from '../engine/typewriter.js';
import { ANGEL_FACES } from '../data/scenarios.js';
import { ASSETS } from '../data/config.js';

export function createAngel(mood, line) {
  const face = el('span.angel-face', {}, [ANGEL_FACES[mood] || '😌']);
  const img = el('img.angel-img', {
    src: ASSETS.angel, alt: 'The Good Angel', draggable: false,
  });
  const avatar = el('div.angel-avatar', {}, [img, face]);
  const text = el('div.angel-line');

  const root = el('div.angel.angel-enter', {}, [avatar, text]);

  let tw = null;
  function speak(newLine, newMood) {
    if (newMood) face.textContent = ANGEL_FACES[newMood] || '😌';
    if (tw) tw.cancel();
    // replay the enter animation for emphasis when the angel changes mood
    root.classList.remove('angel-enter');
    void root.offsetWidth;
    root.classList.add('angel-enter');
    tw = typewrite(text, newLine);
  }

  // initial line
  tw = typewrite(text, line);

  return { el: root, speak, setMood: (m) => { face.textContent = ANGEL_FACES[m] || '😌'; } };
}
