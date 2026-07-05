/**
 * music.js - one persistent, looping background-music track for the whole
 * app. A single <audio> element lives for the entire session (created once,
 * never rebuilt per scene), so music keeps playing seamlessly across every
 * screen change. Volume/mute preference is remembered in localStorage.
 *
 * Browsers block audio until a user gesture: play() is attempted immediately,
 * and if blocked, we retry on the first tap/keypress anywhere on the page.
 */

import { ASSETS } from '../data/config.js';

const STORE_KEY = 'goodness_music';

function readStored() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
}
function writeStored(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

const stored = readStored() || {};
const audio = new Audio(ASSETS.sounds.bg);
audio.loop = true;
audio.volume = stored.volume != null ? stored.volume : 0.35;
audio.muted = stored.muted || false;

function attemptPlay() {
  const p = audio.play();
  if (p && p.catch) {
    p.catch(() => {
      const retry = () => attemptPlay();
      window.addEventListener('pointerdown', retry, { once: true });
      window.addEventListener('keydown', retry, { once: true });
    });
  }
}
attemptPlay();

export const music = {
  get volume() { return audio.volume; },
  get muted() { return audio.muted; },
  setVolume(v) {
    audio.volume = Math.min(1, Math.max(0, v));
    writeStored({ volume: audio.volume, muted: audio.muted });
  },
  setMuted(v) {
    audio.muted = v;
    writeStored({ volume: audio.volume, muted: audio.muted });
  },
  toggleMute() {
    audio.muted = !audio.muted;
    writeStored({ volume: audio.volume, muted: audio.muted });
    return audio.muted;
  },
};
