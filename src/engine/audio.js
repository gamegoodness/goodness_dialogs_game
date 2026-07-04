/**
 * audio.js — optional, tiny WebAudio sound layer (no asset files required).
 *
 * Real sound files are optional (see /assets/sounds/README). To keep the game
 * fully demoable with zero binary audio assets, this module synthesises soft
 * UI blips with the WebAudio API. It is muted until the first user gesture
 * (browsers block audio before interaction) and can be toggled off entirely.
 *
 * To use real sound files instead: replace the play() bodies with
 * `new Audio(ASSETS.sounds.xxx).play()` and add files under /assets/sounds.
 */

let ctx = null;
let enabled = true;

function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  return ctx;
}

/** Play a short sine/triangle blip. */
function blip(freq, dur = 0.09, type = 'sine', gain = 0.05) {
  if (!enabled) return;
  const a = ac();
  if (!a) return;
  if (a.state === 'suspended') a.resume();
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.setValueAtTime(gain, a.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
  osc.connect(g).connect(a.destination);
  osc.start();
  osc.stop(a.currentTime + dur);
}

export const sfx = {
  hover() { blip(660, 0.05, 'sine', 0.02); },
  select() { blip(520, 0.08, 'triangle', 0.05); blip(780, 0.09, 'sine', 0.03); },
  advance() { blip(440, 0.1, 'sine', 0.04); },
  positive() { blip(587, 0.1, 'sine', 0.05); setTimeout(() => blip(880, 0.12, 'sine', 0.045), 90); },
  negative() { blip(300, 0.18, 'sine', 0.05); },
  pop() { blip(720, 0.06, 'triangle', 0.04); },
  setEnabled(v) { enabled = v; },
  get enabled() { return enabled; },
};
