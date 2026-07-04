/**
 * gameScene.js — the interactive heart of the game (visual-novel style).
 *
 * Every moment plays as an illustrated STORY, not a single message:
 *
 *   1. A scenario TITLE CARD introduces the scene ("Moment 1 · The lunchbox").
 *   2. The story plays beat by beat (moment.intro / branch.story) over the
 *      moment's background art. Beats that carry an `img` bring the matching
 *      story illustration onto the stage (crossfading like a picture book).
 *      Narrator beats type into the story box at the bottom. Character beats
 *      put the game in FOCUS MODE: the backdrop blurs + darkens and the line
 *      is spoken from a SPEECH BUBBLE with the speaker's name on it, so the
 *      dialog reads as that person talking. An OK button advances from beat
 *      to beat; a Skip button jumps straight to the choices.
 *   3. After the last beat the choices appear as the game menu.
 *
 * Phases per moment:  c1 (story + first choice)  ->  c2 (story + second
 * choice)  ->  outcome (result banner + reflection + Next / Try differently).
 *
 * The stage (HUD, angel, illustration, dim layer, bubble) is persistent; only
 * the dialog content area swaps between phases. Every navigation action is
 * wrapped in `guard.run` (global transition lock) and the choices container
 * self-locks on first click, so rapid clicking can never double-fire.
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
import { TIMING, bgImage } from '../data/config.js';
import { CHARACTER_NAMES } from '../data/scenarios.js';
import {
  G, moment, branch, outcome, total, isLastMoment,
  pick, pick2, goNext, replayThis, skipReflect,
} from '../engine/state.js';

export function createGameScene(app) {
  const typers = [];
  const track = (tw) => { typers.push(tw); return tw; };
  let alive = true;

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

  // ── Stage: angel, focus dim layer, story illustration, speech bubble ────
  // DOM order matters: the dim layer paints ABOVE the angel (and blurs the
  // whole backdrop behind it) but BELOW the illustration and the speech
  // bubble, so when a character talks, everything blurs and darkens except
  // the scene art and the words coming out of it.
  const angel = createAngel(G.am, G.al);
  const focusDim = el('div.focus-dim');
  const portrait = createPortrait(null);

  // The speech bubble: character lines type HERE, next to the illustration,
  // with a tail pointing at it — not in the narrator box at the bottom.
  const speechName = el('div.speech-name');
  const speechText = el('div.speech-text');
  const speech = el('div.speech', {}, [speechName, speechText]);

  const skipBtn = el('button.skip-btn', { type: 'button' }, ['Skip story ▸▸']);
  const stage = el('div.stage', {}, [angel.el, focusDim, portrait.el, speech, skipBtn]);

  // ── Dialog box (narrator + choices) ──────────────────────────────────────
  const nameplate = el('div.nameplate');
  const contentArea = el('div.content-area');

  // The OK button MOVES between containers: it sits inside the speech bubble
  // while a character talks, and inside the dialog box during narration.
  const okBtn = el('button.ok-btn', { type: 'button' }, [
    'OK ', el('span.arr', {}, ['▸']),
  ]);
  const dialog = el('div.dialog', {}, [
    nameplate,
    el('div.dialog-inner', {}, [contentArea]),
    okBtn,
  ]);

  const layer = el('div.scene.vn', {}, [hud, stage, dialog]);

  // Set per-moment chrome: label, virtue tag chip, and theme colour (--tc drives
  // the nameplate, tag chip, OK button and bubble border).
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

  /** Focus mode on/off for one story beat (null beat = back to narrator).
   * Character: dim + blur everything, show the speech bubble with the
   * speaker's name (the bottom dialog box recedes), OK moves into the bubble.
   * Narrator: bubble hides, dialog box returns, OK moves back to the dialog. */
  function setFocus(beat) {
    const who = beat && beat.who;
    if (beat && beat.img) portrait.show(beat.img);
    if (who) {
      layer.classList.add('focused', 'charline');
      portrait.speak(beat.img);
      speechName.textContent = CHARACTER_NAMES[who] || who;
      speech.classList.remove('speech-pop');
      void speech.offsetWidth;
      speech.classList.add('speech-pop');
      speech.appendChild(okBtn);
    } else {
      layer.classList.remove('focused', 'charline');
      setNameplate('📖', 'Story');
      dialog.appendChild(okBtn);
    }
  }

  // ── Story sequencer ──────────────────────────────────────────────────────
  // Plays an array of beats into the stage + `body`, one at a time. Character
  // beats type slowly into their speech bubble in focus mode; the OK button
  // advances between beats. Skip cancels the sequence and shows the one-line
  // summary (plus the last illustration) instead. Returns after the last beat
  // (or after skip) — the caller then reveals the choices.

  let activeRun = null;

  function showOk() { okBtn.classList.add('show'); }
  function hideOk() { okBtn.classList.remove('show'); }

  skipBtn.addEventListener('click', () => { if (activeRun) activeRun.skip(); });

  async function playStory({ beats, body, summary }) {
    const run = { cancelled: false, tw: null, resolve: null, okH: null };
    run.skip = () => {
      run.cancelled = true;
      if (run.tw) run.tw.cancel();
      if (run.okH) okBtn.removeEventListener('click', run.okH);
      if (run.resolve) run.resolve();
    };
    activeRun = run;
    layer.classList.add('storying');

    for (let i = 0; i < beats.length && !run.cancelled && alive; i++) {
      const beat = beats[i];
      setFocus(beat);

      // Character lines type into THEIR speech bubble (slowly); narration
      // types into the bottom story box.
      const target = beat.who ? speechText : body;
      await new Promise((res) => {
        run.resolve = res;
        run.tw = track(typewrite(target, beat.text, {
          charMs: beat.who ? TIMING.dialogueCharMs : TIMING.typeCharMs,
          onDone: res,
        }));
      });
      if (run.cancelled || !alive) break;
      // Wait for OK between beats (not after the last: choices take over).
      if (i < beats.length - 1) {
        await new Promise((res) => {
          run.resolve = res;
          run.okH = () => { sfx.advance(); res(); };
          okBtn.addEventListener('click', run.okH, { once: true });
          showOk();
        });
        hideOk();
      }
    }

    hideOk();
    layer.classList.remove('storying');
    activeRun = null;
    if (!alive) return;
    setFocus(null);
    if (run.cancelled) {
      // Skipped: show the scene summary + final illustration so the player
      // still has the context the story would have given them.
      typers.forEach((t) => t && t.cancel && t.cancel());
      body.textContent = summary;
      const lastArt = [...beats].reverse().find((b) => b.img);
      if (lastArt) portrait.show(lastArt.img);
    }
  }

  // ── Scenario title card ──────────────────────────────────────────────────
  function showSceneCard() {
    return new Promise((resolve) => {
      const s = moment();
      const card = el('div.scene-card', {}, [
        el('div.sc-kicker', {}, [`Moment ${s.id} of ${total()}`]),
        el('div.sc-title', {}, [s.title]),
        el('div.sc-tag', { style: { background: s.tc } }, [s.tag]),
        el('div.sc-hint', {}, ['Tap to begin']),
      ]);
      layer.appendChild(card);
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        card.classList.add('sc-out');
        setTimeout(() => { card.remove(); resolve(); }, 380);
      };
      card.addEventListener('click', finish);
      setTimeout(finish, TIMING.sceneCardMs);
    });
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
    const body = el('div.ctext');
    const content = el('div.phase', {}, [body]);
    content._start = async () => {
      await playStory({
        beats: (s.intro && s.intro.length) ? s.intro : [{ who: null, text: s.sit }],
        body, summary: s.sit,
      });
      if (!alive) return;
      setNameplate('✦', 'Your choice');
      if (s.ambig) {
        content.appendChild(el('div.anote', {}, ['⚠️ ' + (s.ambigNote || 'Both choices have real costs.')]));
      }
      content.appendChild(el('div.eyebrow.choose', {}, ['What should Milo do?']));
      content.appendChild(choicesRow([
        createChoiceButton({ letter: 'A', text: s.A.text, color: s.tc, index: 0, onSelect: chooseC1 }),
        createChoiceButton({ letter: 'B', text: s.B.text, color: s.tc, index: 1, onSelect: chooseC1 }),
      ]));
    };
    return content;
  }

  function buildC2() {
    const s = moment();
    const br = branch();
    const body = el('div.ctext');
    const content = el('div.phase', {}, [body]);
    content._start = async () => {
      await playStory({
        beats: (br.story && br.story.length) ? br.story : [{ who: null, text: br.sit }],
        body, summary: br.sit,
      });
      if (!alive) return;
      setNameplate('✦', 'Your choice');
      content.appendChild(el('div.eyebrow.choose', {}, ['What happens next?']));
      content.appendChild(choicesRow([
        createChoiceButton({ letter: 'A', text: br.A2.text, color: s.tc, index: 0, onSelect: chooseC2 }),
        createChoiceButton({ letter: 'B', text: br.B2.text, color: s.tc, index: 1, onSelect: chooseC2 }),
      ]));
    };
    return content;
  }

  function buildOutcome() {
    const s = moment();
    const oc = outcome().oc;
    setNameplate('✨', 'What happened');
    if (oc.img) portrait.show(oc.img);

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
    content._start = () => {
      // Reveal outcome text with typewriter after the card animates in.
      setTimeout(() => { if (alive) track(typewrite(otxt, oc.txt)); }, 260);
    };
    // Sound cue matching the score of this outcome.
    (outcome().s > 0 ? sfx.positive : outcome().s < 0 ? sfx.negative : sfx.advance)();
    return content;
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
    if (content._start) content._start();
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
      portrait.show(null); // the intro story repaints its own illustrations
      await renderPhase('back');
    });
  }

  function onNext() {
    guard.run(async () => {
      sfx.advance();
      const wasLast = isLastMoment();
      goNext();
      if (wasLast) { await app.toFinal(); return; }
      // New moment: crossfade background, clear the stage art, retitle,
      // animate dots, then introduce the scenario with its title card before
      // the story plays.
      app.background.crossfadeTo({ gradient: moment().bg, image: bgImage(moment().image) });
      applyMomentChrome();
      portrait.show(null);
      dots.setCurrent(G.idx);
      angel.speak(G.al, G.am);
      await showSceneCard();
      await renderPhase('forward');
    });
  }

  // ── Scene lifecycle ──────────────────────────────────────────────────────
  return {
    el: layer,
    get bg() { return { gradient: moment().bg, image: bgImage(moment().image) }; },
    enter() {
      const content = build(G.phase);
      content.classList.add('scene-in-fade');
      contentArea.appendChild(content);
      void content.offsetWidth;
      (async () => {
        await showSceneCard();
        if (alive && content._start) content._start();
      })();
    },
    destroy() {
      alive = false;
      if (activeRun) activeRun.skip();
      typers.forEach((t) => t && t.cancel && t.cancel());
    },
  };
}
