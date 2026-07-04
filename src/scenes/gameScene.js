/**
 * gameScene.js — the interactive heart of the game (visual-novel style).
 *
 * The screen is a full-screen STAGE:
 *   - a HUD across the top (progress dots + virtue tag + goodness score),
 *   - the featured CHARACTER portrait standing on the scenario background,
 *   - the Good Angel floating as a guide,
 *   - a DIALOG BOX at the bottom that tells the story and presents choices.
 *
 * The dialog box holds a swappable CONTENT AREA that crossfades between the
 * three phases of every moment:
 *      c1  ->  first choice
 *      c2  ->  second choice ("what happens next")
 *      outcome -> result banner + reflection + Next/Try-differently
 *
 * The stage (HUD, angel, portrait) stays persistent so the angel keeps floating
 * and the dots/score animate in place, rather than the whole screen snapping.
 * Advancing to the next moment crossfades the background, swaps the portrait,
 * and animates the progress dots.
 *
 * Every navigation action is wrapped in `guard.run` (global transition lock),
 * and the choices container self-locks on first click, so rapid-clicking during
 * an animation can never trigger a double transition or a broken state.
 */

import { el } from '../engine/dom.js';
import { typewrite } from '../engine/typewriter.js';
import { swapScene, guard } from '../engine/transitions.js';
import { sfx } from '../engine/audio.js';
import { createAngel } from '../components/angel.js';
import { createPortrait } from '../components/portrait.js';
import { createProgressDots } from '../components/progressDots.js';
import { createScorePill } from '../components/scoreBadge.js';
import { createChoiceButton } from '../components/choiceButton.js';
import { bgImage } from '../data/config.js';
import { CHARACTER_NAMES } from '../data/scenarios.js';
import {
  G, moment, branch, outcome, total, isLastMoment,
  pick, pick2, goNext, replayThis, skipReflect,
} from '../engine/state.js';

export function createGameScene(app) {
  const typers = [];
  const track = (tw) => { typers.push(tw); return tw; };

  // ── HUD (top bar) ────────────────────────────────────────────────────────
  const momentLabel = el('div.ep');
  const dots = createProgressDots(total(), G.idx);
  const tagChip = el('div.hud-chip');
  const pill = createScorePill(G.score);

  const hud = el('div.hud', {}, [
    el('div.hud-group', {}, [
      el('div.hud-panel', {}, [momentLabel, dots.el]),
    ]),
    el('div.hud-group', {}, [
      tagChip,
      el('div.hud-panel', {}, [pill.el]),
    ]),
  ]);

  // ── Stage (characters) ───────────────────────────────────────────────────
  const angel = createAngel(G.am, G.al);
  const portrait = createPortrait(moment().char);
  const stage = el('div.stage', {}, [angel.el, portrait.el]);

  // ── Dialog box ───────────────────────────────────────────────────────────
  const nameplate = el('div.nameplate');
  const contentArea = el('div.content-area');
  const dialog = el('div.dialog', {}, [
    nameplate,
    el('div.dialog-inner', {}, [contentArea]),
  ]);

  const layer = el('div.scene.vn', {}, [hud, stage, dialog]);

  // Set per-moment chrome: label, virtue tag chip, and theme colour (--tc drives
  // the nameplate, tag chip and portrait glow).
  function applyMomentChrome() {
    const s = moment();
    momentLabel.textContent = `Moment ${s.id} of ${total()}`;
    tagChip.textContent = s.tag;
    layer.style.setProperty('--tc', s.tc);
  }
  applyMomentChrome();

  function setNameplate(emoji, text) {
    nameplate.replaceChildren(
      el('span.np-emoji', {}, [emoji]),
      document.createTextNode(text),
    );
  }

  // ── Phase content builders ───────────────────────────────────────────────

  function choicesRow(buttons) {
    const row = el('div.choices', {}, buttons);
    // Self-lock on first click so sibling buttons can't also fire.
    row.addEventListener('click', () => row.classList.add('locked'), { capture: true, once: true });
    return row;
  }

  function buildC1() {
    const s = moment();
    setNameplate('💬', CHARACTER_NAMES[s.char] || 'The story');
    const body = el('div.ctext');
    const note = s.ambig
      ? el('div.anote', {}, ['⚠️ ' + (s.ambigNote || 'Both choices have real costs.')])
      : null;
    const children = [body];
    if (note) children.push(note);
    children.push(choicesRow([
      createChoiceButton({ letter: 'A', text: s.A.text, color: s.tc, index: 0, onSelect: chooseC1 }),
      createChoiceButton({ letter: 'B', text: s.B.text, color: s.tc, index: 1, onSelect: chooseC1 }),
    ]));
    const content = el('div.phase', {}, children);
    queueType(body, s.sit);
    return content;
  }

  function buildC2() {
    const s = moment();
    const br = branch();
    setNameplate('💬', CHARACTER_NAMES[s.char] || 'The story');
    const body = el('div.ctext');
    const content = el('div.phase', {}, [
      el('div.eyebrow', {}, ['What happens next']),
      body,
      choicesRow([
        createChoiceButton({ letter: 'A', text: br.A2.text, color: s.tc, index: 0, onSelect: chooseC2 }),
        createChoiceButton({ letter: 'B', text: br.B2.text, color: s.tc, index: 1, onSelect: chooseC2 }),
      ]),
    ]);
    queueType(body, br.sit);
    return content;
  }

  function buildOutcome() {
    const s = moment();
    const oc = outcome().oc;
    setNameplate('✨', 'What happened');

    const ocCard = el('div.ocard.ocard-reveal', { style: { background: oc.bg } }, [
      el('div.oicon', {}, [oc.icon]),
      el('div.otitle', { style: { color: oc.col } }, [oc.title]),
      el('div.otxt', { style: { color: oc.col } }),
      el('span.vtag.vtag-pop', { style: { background: oc.col + '22', color: oc.col } }, [oc.virt]),
    ]);
    const otxt = ocCard.querySelector('.otxt');

    const children = [ocCard];

    // Reflection box (kid-facing).
    let reflectBox = null;
    if (!G.reflectDone) {
      const textarea = el('textarea.rinput', {
        rows: 2, placeholder: 'Type your thoughts, or just think it through...',
      });
      const skip = el('span.rskip', {}, ["Skip, I've thought about it"]);
      skip.addEventListener('click', () => {
        skipReflect();
        reflectBox.classList.add('rbox-collapse');
        setTimeout(() => reflectBox.remove(), 320);
      });
      reflectBox = el('div.rbox.rbox-enter', {}, [
        el('div.rq', {}, ['💬 Think about it']),
        el('div.rsub', {}, [s.reflect]),
        textarea,
        skip,
      ]);
      children.push(reflectBox);
    }

    // Action row: Try differently / Next.
    const nextLabel = isLastMoment() ? 'See my score →' : 'Next moment →';
    const tryBtn = el('button.gbtn', { type: 'button' }, ['↩ Try differently']);
    const nextBtn = el('button.nbtn', { type: 'button', style: { color: oc.col } }, [nextLabel]);
    tryBtn.addEventListener('click', onTryDifferently);
    nextBtn.addEventListener('click', onNext);
    children.push(el('div.rowbtns', {}, [tryBtn, nextBtn]));

    const content = el('div.phase', {}, children);

    // Reveal outcome text with typewriter after the card animates in.
    queueType(otxt, oc.txt, 260);
    // Sound cue matching the score of this outcome.
    (outcome().s > 0 ? sfx.positive : outcome().s < 0 ? sfx.negative : sfx.advance)();
    return content;
  }

  // Defer typing until the element is actually in the DOM + settled.
  const pendingTypes = [];
  function queueType(elNode, text, delay = 0) {
    pendingTypes.push({ elNode, text, delay });
  }
  function flushTypes() {
    pendingTypes.splice(0).forEach(({ elNode, text, delay }) => {
      setTimeout(() => track(typewrite(elNode, text)), delay);
    });
  }

  // ── Phase rendering ──────────────────────────────────────────────────────

  function build(phase) {
    if (phase === 'c1') return buildC1();
    if (phase === 'c2') return buildC2();
    return buildOutcome();
  }

  async function renderPhase(direction) {
    const content = build(G.phase);
    await swapScene(contentArea, content, direction);
    flushTypes();
  }

  // ── Handlers (all guarded) ───────────────────────────────────────────────

  function chooseC1(letter) {
    guard.run(async () => {
      pick(letter);
      angel.speak(G.al, G.am);
      await renderPhase('forward');
    });
  }

  function chooseC2(letter) {
    guard.run(async () => {
      pick2(letter === 'A' ? 'A2' : 'B2');
      pill.update(G.score);
      dots.setCurrent(G.idx);
      angel.speak(G.al, G.am);
      await renderPhase('forward');
    });
  }

  function onTryDifferently() {
    guard.run(async () => {
      replayThis();
      pill.update(G.score);
      angel.speak(G.al, G.am);
      await renderPhase('back');
    });
  }

  function onNext() {
    guard.run(async () => {
      sfx.advance();
      const wasLast = isLastMoment();
      goNext();
      if (wasLast) { await app.toFinal(); return; }
      // New moment: crossfade background, swap portrait, retitle, animate dots.
      app.background.crossfadeTo({ gradient: moment().bg, image: bgImage(moment().image) });
      applyMomentChrome();
      portrait.show(moment().char);
      dots.setCurrent(G.idx);
      angel.speak(G.al, G.am);
      await renderPhase('forward');
    });
  }

  // ── Scene lifecycle ──────────────────────────────────────────────────────
  return {
    el: layer,
    get bg() { return { gradient: moment().bg, image: bgImage(moment().image) }; },
    enter() {
      // First phase content slides in and starts typing.
      const content = build(G.phase);
      content.classList.add('scene-in-fade');
      contentArea.appendChild(content);
      void content.offsetWidth;
      flushTypes();
    },
    destroy() {
      typers.forEach((t) => t && t.cancel && t.cancel());
    },
  };
}
