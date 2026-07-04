/**
 * typewriter.js — character-by-character text reveal with click/tap to skip.
 *
 * Usage:
 *   const tw = typewrite(el, "Some narration...", { onDone });
 *   tw.skip();   // instantly finish (also happens on click/tap anywhere)
 *   tw.cancel(); // stop and leave as-is (used when a scene tears down)
 *
 * Design notes for the "feel":
 *  - Punctuation gets an extra pause so sentences breathe.
 *  - A soft blinking caret trails the text while typing.
 *  - Respects prefers-reduced-motion (renders instantly).
 *  - Honours the global skip signal so ONE tap anywhere skips the active line.
 */

import { TIMING } from '../data/config.js';

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// A single shared "skip requested" listener so a tap anywhere finishes the
// currently-typing line without every scene wiring up its own handler.
let activeInstance = null;
function globalSkip() { if (activeInstance) activeInstance.skip(); }
window.addEventListener('pointerdown', globalSkip);
window.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.key === 'Enter') globalSkip();
});

/**
 * Type `text` into `el`. Returns a controller { skip, cancel, done }.
 * `text` may contain simple inline markup already present in the content
 * (e.g. quotes) — it is treated as plain text and inserted safely.
 */
export function typewrite(el, text, opts = {}) {
  const { onDone, charMs = TIMING.typeCharMs, startDelay = TIMING.typeStartDelay } = opts;

  let i = 0;
  let finished = false;
  let timer = null;
  const chars = Array.from(text); // handles emoji/surrogate pairs correctly

  // Build a text node + trailing caret so we never re-parse HTML each tick.
  el.textContent = '';
  el.classList.add('tw');
  const textNode = document.createTextNode('');
  const caret = document.createElement('span');
  caret.className = 'tw-caret';
  el.appendChild(textNode);
  el.appendChild(caret);

  function finish() {
    if (finished) return;
    finished = true;
    textNode.nodeValue = text;
    if (caret.parentNode) caret.remove();
    el.classList.remove('tw');
    if (activeInstance === controller) activeInstance = null;
    if (onDone) onDone();
  }

  function step() {
    if (finished) return;
    if (i >= chars.length) { finish(); return; }
    const ch = chars[i++];
    textNode.nodeValue += ch;
    // Extra pause after sentence/clause punctuation for a natural cadence.
    const extra = '.!?—,:;'.includes(ch) ? TIMING.typePunctMs : 0;
    timer = setTimeout(step, charMs + extra);
  }

  const controller = {
    skip() { if (!finished) { clearTimeout(timer); finish(); } },
    cancel() {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      if (caret.parentNode) caret.remove();
      if (activeInstance === controller) activeInstance = null;
    },
    get done() { return finished; },
  };

  if (REDUCED) {
    // No animation preference: show immediately but still async so onDone fires
    // after the element is in the DOM.
    setTimeout(finish, 0);
    return controller;
  }

  activeInstance = controller;
  timer = setTimeout(step, startDelay);
  return controller;
}

/**
 * Type several lines in sequence, resolving when all are done.
 * `segments` = [{ el, text, opts }]. Returns a controller whose skip()
 * fast-forwards the whole sequence.
 */
export function typeSequence(segments) {
  let idx = 0;
  let current = null;
  let cancelled = false;
  let onAllDone = null;

  function next() {
    if (cancelled) return;
    if (idx >= segments.length) { if (onAllDone) onAllDone(); return; }
    const seg = segments[idx++];
    current = typewrite(seg.el, seg.text, { ...seg.opts, onDone: next });
  }

  next();

  return {
    skip() {
      // Finish current line; subsequent lines will chain and be skipped by the
      // shared global-skip mechanism as they each become active.
      if (current) current.skip();
    },
    cancel() { cancelled = true; if (current) current.cancel(); },
    onDone(cb) { onAllDone = cb; return this; },
  };
}
