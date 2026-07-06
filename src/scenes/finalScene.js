/**
 * finalScene.js - the results / reflection screen.
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
import { createBrandFooter } from '../components/brandFooter.js';
import { G, uniqueVirtues } from '../engine/state.js';
import { savedProfile } from '../engine/analytics.js';

function tier(score) {
  if (score >= 8) return { title: 'Goodness Champion', rc: '#1D9E75', rb: '#E1F5EE', txt: "Milo showed deep empathy today, through kindness, honesty, forgiveness, courage and perseverance. These aren't small things." };
  if (score >= 4) return { title: 'Growing in Goodness', rc: '#185FA5', rb: '#E6F1FB', txt: "Milo made some strong choices and had a few difficult moments. That's how empathy grows, through noticing how our choices shape the world around us." };
  return { title: 'Every choice is a chance', rc: '#BA7517', rb: '#FAEEDA', txt: "Some of today's moments were hard. That's real. The Good Angel is still proud of Milo for trying." };
}

/** Build a printable HTML report of the child's playthrough and download it,
 * so a teacher can save it and show it to parents. */
function downloadReport(childName, ep, score, journal, virtues) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]
  ));
  const when = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const rows = journal.map((j) => `
    <div class="m">
      <h3>Moment ${esc(j.id)} · ${esc(j.title)} <span class="tag">${esc(j.tag)}</span></h3>
      <p><b>What ${esc(childName)} chose:</b> ${esc(j.choice1)} → ${esc(j.choice2)}</p>
      <p><b>What happened:</b> ${esc(j.outcome)} · <i>${esc(j.virtue)}</i></p>
      <p><b>${esc(childName)}'s thoughts:</b> ${j.thought ? esc(j.thought) : '<span class="none">(no note written)</span>'}</p>
    </div>`).join('');
  const html = `<!doctype html><html><head><meta charset="utf-8">
    <title>${esc(childName)} — Goodness report</title>
    <style>
      body{font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;color:#1A2E26;line-height:1.6}
      h1{color:#1D9E75;margin-bottom:4px} .sub{color:#6b7d76;margin-top:0}
      .m{border:1px solid #cdeadd;border-radius:12px;padding:14px 18px;margin:14px 0;background:#F7FDFA}
      .m h3{margin:0 0 8px;font-size:16px} .m p{margin:4px 0;font-size:14px}
      .tag{background:#E1F5EE;color:#0F6E56;font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600;vertical-align:middle}
      .none{color:#aaa} .virtues{color:#185FA5} @media print{body{margin:0}}
    </style></head><body>
    <h1>${esc(childName)}'s Goodness Journey</h1>
    <p class="sub">${esc(ep.name)} · Score: ${esc(score)} · ${esc(when)}</p>
    <p class="virtues"><b>Virtues practised:</b> ${virtues.length ? esc(virtues.join(', ')) : '—'}</p>
    ${rows}
    </body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${childName.replace(/[^\w-]+/g, '_') || 'student'}_goodness_report.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function createFinalScene(app) {
  const ep = G.episode;
  const score = G.score;
  const t = tier(score);
  const virtues = uniqueVirtues();
  const journal = G.journal || [];
  const childName = (savedProfile().name || '').trim() || 'This student';

  const fnum = el('div.fnum', {}, ['+0']);
  const ring = el('div.fring.fring-in', { style: { background: t.rb, color: t.rc } }, [
    fnum, el('div.flbl', {}, ['Goodness']),
  ]);

  const ftitle = el('div.ftitle');
  const ftxt = el('div.ftxt', {}, [t.txt]);
  const virtueRow = createVirtueRow();

  // The kid's own record: every moment, what they chose, and their thoughts.
  const journalBox = journal.length ? el('div.jbox', {}, [
    el('div.dtitle', {}, [`📔 ${childName}'s choices & thoughts`]),
    ...journal.map((j) => el('div.jentry', {}, [
      el('div.jhead', {}, [`Moment ${j.id} · ${j.title}`]),
      el('div.jchoice', {}, [`✔ Chose: ${j.choice1} → ${j.choice2}`]),
      el('div.jvirt', {}, [`✨ ${j.outcome} · ${j.virtue}`]),
      el('div.jthought', {}, [
        el('b', {}, ['Thoughts: ']),
        j.thought || '(no note written)',
      ]),
    ])),
  ]) : null;

  const downloadBtn = journal.length ? el('button.dlbtn', { type: 'button' }, [
    '⬇ Download report (for parents)',
  ]) : null;
  if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
      sfx.pop();
      downloadReport(childName, ep, score, journal, virtues);
    });
  }

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
    journalBox,
    downloadBtn,
    discussion,
    replayBtn,
    el('div.fnote', {}, [ep.curriculum]),
  ].filter(Boolean));

  const scene = el('div.scene.final-screen', {}, [
    el('div.final-inner', {}, [
      el('div.final-head', {}, [el('div.ep', {}, [`Episode ${ep.id} complete`])]),
      fcard,
      createBrandFooter(),
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
