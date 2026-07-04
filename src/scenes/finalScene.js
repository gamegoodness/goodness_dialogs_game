/**
 * finalScene.js — the results / reflection screen.
 *
 * The score ring counts up from zero, the earned-virtue chips pop in one at a
 * time, and the "for teachers and parents" discussion box + replay button are
 * preserved from the prototype. Tier (title/colour/message) is chosen by score,
 * exactly as in the original.
 */

import { el } from '../engine/dom.js';
import { typewrite } from '../engine/typewriter.js';
import { countTo } from '../components/scoreBadge.js';
import { createVirtueRow } from '../components/virtueChip.js';
import { ASSETS } from '../data/config.js';
import { sfx } from '../engine/audio.js';
import { guard } from '../engine/transitions.js';
import { G, uniqueVirtues } from '../engine/state.js';

function tier(score) {
  if (score >= 8) return { title: 'Goodness Champion', rc: '#1D9E75', rb: '#E1F5EE', txt: "Milo showed deep empathy today, through kindness, honesty, forgiveness, courage and perseverance. These aren't small things." };
  if (score >= 4) return { title: 'Growing in Goodness', rc: '#185FA5', rb: '#E6F1FB', txt: "Milo made some strong choices and had a few difficult moments. That's how empathy grows, through noticing how our choices shape the world around us." };
  return { title: 'Every choice is a chance', rc: '#BA7517', rb: '#FAEEDA', txt: "Some of today's moments were hard. That's real. The Good Angel is still proud of Milo for trying." };
}

export function createFinalScene(app) {
  const ep = G.episode;
  const score = G.score;
  const t = tier(score);
  const virtues = uniqueVirtues();

  const fnum = el('div.fnum', {}, ['+0']);
  const ring = el('div.fring.fring-in', { style: { background: t.rb, color: t.rc } }, [
    fnum, el('div.flbl', {}, ['Goodness']),
  ]);

  const ftitle = el('div.ftitle');
  const ftxt = el('div.ftxt', {}, [t.txt]);
  const virtueRow = createVirtueRow();

  const discussion = el('div.dbox', {}, [
    el('div.dtitle', {}, ['💬 For teachers and parents']),
    ...ep.discussion.map((q) => el('div.dq', {}, [q])),
  ]);

  const replayBtn = el('button.rbtn', {
    type: 'button', style: { background: t.rc, color: 'white' },
  }, ['Play again, try every path']);
  replayBtn.addEventListener('click', () => {
    guard.run(async () => { sfx.advance(); await app.toTitle(); });
  });

  const fcard = el('div.fcard', {}, [
    ring, ftitle, ftxt,
    virtues.length ? virtueRow.el : null,
    discussion,
    replayBtn,
    el('div.fnote', {}, [ep.curriculum]),
  ].filter(Boolean));

  const scene = el('div.scene.final-screen', {}, [
    el('div.final-inner', {}, [
      el('div.final-head', {}, [el('div.ep', {}, [`Episode ${ep.id} complete`])]),
      fcard,
    ]),
  ]);

  let tw;
  return {
    el: scene,
    bg: { gradient: 'linear-gradient(135deg,#2D4A3E,#1A2E26)', image: ASSETS.backgrounds.final },
    enter() {
      tw = typewrite(ftitle, t.title, { charMs: 45 });
      countTo(fnum, score, () => sfx.pop());
      virtueRow.reveal(virtues, 700);
    },
    destroy() { if (tw) tw.cancel(); },
  };
}
