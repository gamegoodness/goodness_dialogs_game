/**
 * choiceButton.js - a tactile choice button.
 *
 * Feel details:
 *  - staggered entrance (each button floats up slightly after the previous),
 *  - hover lift + soft glow,
 *  - press scale-down,
 *  - a ripple that blooms from the click point on selection,
 *  - a brief "chosen" highlight before the scene advances.
 *
 * onSelect is wrapped so it only fires once (double-click safe at the
 * component level, in addition to the global transition guard).
 */

import { el } from '../engine/dom.js';
import { TIMING } from '../data/config.js';
import { sfx } from '../engine/audio.js';

/**
 * @param {object} o
 * @param {string} o.letter   'A' | 'B'
 * @param {string} o.text     button label
 * @param {string} o.color    theme colour (hex)
 * @param {number} o.index    for entrance stagger
 * @param {Function} o.onSelect  called once when chosen
 */
export function createChoiceButton({ letter, text, color, index = 0, onSelect }) {
  const ltr = el('div.ltr', { style: { background: color + '33', color } }, [letter]);
  const label = el('span.btn-label', {}, [text]);
  const btn = el('button.btn', {
    type: 'button',
    style: { '--accent': color, animationDelay: index * TIMING.choiceStaggerMs + 'ms' },
  }, [ltr, label]);
  btn.classList.add('btn-enter');

  let used = false;

  btn.addEventListener('pointerenter', () => { if (!used) sfx.hover(); });

  btn.addEventListener('click', (e) => {
    if (used) return;
    used = true;

    // Ripple from click point.
    const rect = btn.getBoundingClientRect();
    const ripple = el('span.ripple');
    const size = Math.max(rect.width, rect.height) * 2.2;
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
    ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
    ripple.style.background = color + '55';
    btn.appendChild(ripple);

    btn.classList.add('btn-chosen');
    sfx.select();

    // Let the ripple + highlight play briefly, then hand off.
    setTimeout(() => onSelect(letter), 230);
  });

  return btn;
}
