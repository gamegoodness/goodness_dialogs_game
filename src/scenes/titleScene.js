/**
 * titleScene.js — the opening screen.
 *
 * The angel logo drifts in, the title types on, and the Start button pulses
 * gently to invite the first tap.
 */

import { el } from '../engine/dom.js';
import { typewrite } from '../engine/typewriter.js';
import { ASSETS } from '../data/config.js';
import { ACTIVE_EPISODE } from '../data/episodes.js';
import { sfx } from '../engine/audio.js';
import { guard } from '../engine/transitions.js';

export function createTitleScene(app) {
  const ep = ACTIVE_EPISODE;

  const logo = el('img.title-logo', { src: ASSETS.logo, alt: '', draggable: false });
  const epLabel = el('div.tgame', {}, [`Goodness Curriculum · Episode ${ep.id}`]);
  const epName = el('div.tepi');
  const sub = el('div.tsub', { html: ep.subtitle });
  const startBtn = el('button.sbtn', { type: 'button' }, [`Start Milo's day →`]);
  const note = el('div.tnote', {}, [ep.meta]);

  startBtn.addEventListener('click', () => {
    guard.run(async () => {
      sfx.advance();
      await app.toGame();
    });
  });

  const scene = el('div.scene.title-screen', {}, [
    el('div.title-inner', {}, [
      el('div.title-logo-wrap', {}, [logo]),
      epLabel, epName, sub,
      el('div.title-cta', {}, [startBtn]),
      note,
    ]),
  ]);

  let tw;
  return {
    el: scene,
    bg: { gradient: 'linear-gradient(135deg,#2D4A3E,#1A2E26)', image: ASSETS.backgrounds.title },
    enter() {
      tw = typewrite(epName, ep.name, { charMs: 55 });
    },
    destroy() { if (tw) tw.cancel(); },
  };
}
