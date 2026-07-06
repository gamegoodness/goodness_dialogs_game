/**
 * state.js - the game state machine.
 *
 * A faithful port of the original prototype's `G` object and its transition
 * functions (startGame / pick / pick2 / skipReflect / replayThis / goNext /
 * replayGame). Logic and scoring are unchanged; it's just modularised and the
 * active moment now comes from the loaded episode instead of a global array.
 *
 * The functions here ONLY mutate state. Rendering + animation live in the
 * scenes; the router in main.js decides what to draw after each mutation.
 */

import { ACTIVE_EPISODE } from '../data/episodes.js';

/** Live game state. Kept as a single object, like the prototype's `G`. */
export const G = {
  episode: ACTIVE_EPISODE,
  screen: 'title',   // 'title' | 'game' | 'final'
  idx: 0,            // moment index
  phase: 'c1',       // 'c1' (first choice) | 'c2' (second choice) | 'outcome'
  path: null,        // 'A' | 'B'  - first choice
  path2: null,       // 'A2' | 'B2' - second choice
  score: 0,
  virtues: [],
  journal: [],       // one entry per completed moment (choices + the kid's thought)
  am: 'neutral',     // angel mood key
  al: "I'm watching over Milo today.", // angel line
  reflectDone: false,
};

/** The active list of moments for the current episode. */
export function moments() { return G.episode.moments; }

/** The current moment. */
export function moment() { return moments()[G.idx]; }

/** Total moments in the episode. */
export function total() { return moments().length; }

/** The active second-level branch object (L2) for the chosen path. */
export function branch() {
  const s = moment();
  return G.path === 'A' ? s.A.L2 : s.B.L2;
}

/** The chosen outcome object (after both choices are made). */
export function outcome() {
  const br = branch();
  return G.path2 === 'A2' ? br.A2 : br.B2;
}

export function isLastMoment() { return G.idx >= total() - 1; }

// ── Transitions ────────────────────────────────────────────────────────────

export function startGame() {
  const first = moments()[0];
  Object.assign(G, {
    screen: 'game', idx: 0, phase: 'c1', path: null, path2: null,
    score: 0, virtues: [], journal: [], am: first.am, al: first.al, reflectDone: false,
  });
}

/** First-level choice. p = 'A' | 'B'. */
export function pick(p) {
  const s = moment();
  const br = p === 'A' ? s.A.L2 : s.B.L2;
  G.path = p;
  G.phase = 'c2';
  G.am = br.am;
  G.al = br.al;
}

/** Second-level choice. p2 = 'A2' | 'B2'. Applies score + virtue + angel mood. */
export function pick2(p2) {
  const br = branch();
  const choice = p2 === 'A2' ? br.A2 : br.B2;
  G.path2 = p2;
  G.score += choice.s;
  if (choice.s > 0) G.virtues.push(choice.oc.virt);

  const s = choice.s;
  if (s >= 2) { G.am = 'proud';  G.al = 'That was wonderful to watch.'; }
  else if (s >= 1) { G.am = 'happy'; G.al = 'A good choice, even if it took a moment.'; }
  else if (s === 0) { G.am = 'neutral'; G.al = 'Every experience teaches something.'; }
  else { G.am = 'sad'; G.al = 'I hope Milo will remember how this felt.'; }

  G.phase = 'outcome';
}

export function skipReflect() { G.reflectDone = true; }

/** "Try differently" - rewind the current moment, undoing its score/virtue. */
export function replayThis() {
  const choice = outcome();
  G.score -= choice.s;
  if (choice.s > 0) {
    const i = G.virtues.lastIndexOf(choice.oc.virt);
    if (i > -1) G.virtues.splice(i, 1);
  }
  const s = moment();
  G.phase = 'c1'; G.path = null; G.path2 = null; G.reflectDone = false;
  G.am = s.am; G.al = s.al;
}

/** Advance to the next moment, or to the final screen. */
export function goNext() {
  if (!isLastMoment()) {
    G.idx++;
    G.phase = 'c1'; G.path = null; G.path2 = null; G.reflectDone = false;
    const s = moment();
    G.am = s.am; G.al = s.al;
  } else {
    G.screen = 'final';
  }
}

/** Back to the title screen, full reset. */
export function replayGame() {
  Object.assign(G, {
    screen: 'title', idx: 0, phase: 'c1', path: null, path2: null,
    score: 0, virtues: [], journal: [], am: 'neutral',
    al: "I'm watching over Milo today.", reflectDone: false,
  });
}

/**
 * Record the just-finished moment for the end-of-episode report: what the kid
 * chose (both choices + the outcome/virtue) and the thought they wrote. Called
 * from onNext, before goNext advances. `thought` is the reflection text.
 */
export function recordJournalEntry(thought) {
  const s = moment();
  const c1 = G.path === 'A' ? s.A : s.B;
  const o = outcome();
  G.journal.push({
    id: s.id,
    title: s.title,
    tag: s.tag,
    choice1: c1.text,
    choice2: o.text,
    outcome: o.oc.title,
    virtue: o.oc.virt,
    positive: o.s > 0,
    thought: (thought || '').trim(),
  });
}

/** Unique virtues earned, in first-seen order (for the final screen chips). */
export function uniqueVirtues() {
  const seen = [];
  G.virtues.forEach((v) => { if (seen.indexOf(v) < 0) seen.push(v); });
  return seen;
}
