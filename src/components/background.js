/**
 * background.js — animated background with two crossfading layers.
 *
 * Each layer carries BOTH a CSS gradient (fast, smooth) and the scenario's
 * placeholder image (drop-in swappable). Calling crossfadeTo() fades the
 * incoming layer over the current one instead of snapping — this is the
 * "background transitions" feature. Includes a slow parallax drift for life.
 */

import { el } from '../engine/dom.js';
import { TIMING } from '../data/config.js';

export function createBackground(host) {
  const layerA = el('div.bg-layer.is-visible');
  const layerB = el('div.bg-layer');
  host.append(layerA, layerB);
  let front = layerA;
  let back = layerB;

  function paint(layer, { gradient, image }) {
    // The gradient is the base colour theme. The placeholder image is layered
    // on top via a ::before overlay (see main.css .bg-layer.has-image::before)
    // at reduced opacity so both art and theme read well.
    layer.style.background = gradient || '#1A2E26';
    if (image) {
      layer.style.setProperty('--bg-image', `url("${image}")`);
      layer.classList.add('has-image');
    } else {
      layer.style.removeProperty('--bg-image');
      layer.classList.remove('has-image');
    }
  }

  return {
    /** Immediately set the background (used on first paint). */
    set(spec) {
      paint(front, spec);
    },
    /** Crossfade to a new background spec. */
    crossfadeTo(spec) {
      paint(back, spec);
      back.style.transition = `opacity ${TIMING.bgCrossfadeMs}ms ease`;
      // next frame → fade in
      requestAnimationFrame(() => {
        back.classList.add('is-visible');
        front.classList.remove('is-visible');
      });
      setTimeout(() => {
        // swap roles
        const tmp = front; front = back; back = tmp;
      }, TIMING.bgCrossfadeMs);
    },
  };
}
