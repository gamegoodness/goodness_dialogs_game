/**
 * progressDots.js - the "moment X of N" indicator.
 *
 * Dots animate between states: upcoming → current (scale + glow pulse) →
 * done (fills with a soft tick of colour). The active dot gently pulses so
 * the player always knows where they are.
 */

import { el } from '../engine/dom.js';

export function createProgressDots(total, currentIdx) {
  const dots = [];
  const row = el('div.dots');
  for (let i = 0; i < total; i++) {
    const cls = i < currentIdx ? 'dot done' : i === currentIdx ? 'dot on' : 'dot';
    const d = el('div.' + cls.replace(' ', '.'));
    dots.push(d);
    row.appendChild(d);
  }
  return {
    el: row,
    /** Animate the indicator to a new current index. */
    setCurrent(idx) {
      dots.forEach((d, i) => {
        const target = i < idx ? 'done' : i === idx ? 'on' : '';
        if (!d.classList.contains(target) && target) {
          d.classList.add('dot-flip');
          setTimeout(() => d.classList.remove('dot-flip'), 450);
        }
        d.className = 'dot' + (target ? ' ' + target : '');
      });
    },
  };
}
