/**
 * musicWidget.js - the persistent music button (top-right, every screen).
 * Click toggles a small panel with a mute button and a volume slider. Mounted
 * once in main.js as a direct child of #app (outside #bg / #scene-root), with
 * a very high z-index, so it always sits above every background, dim/blur
 * layer, and scene - regardless of which screen or state the game is in.
 */

import { el } from '../engine/dom.js';
import { music } from '../engine/music.js';

export function createMusicWidget() {
  const icon = el('span.music-icon', {}, [music.muted ? '🔇' : '🎵']);
  const btn = el('button.music-btn', { type: 'button', 'aria-label': 'Music settings' }, [icon]);

  const muteBtn = el('button.music-mute', { type: 'button' }, [music.muted ? 'Unmute' : 'Mute']);
  const slider = el('input.music-slider', {
    type: 'range', min: '0', max: '100', value: String(Math.round(music.volume * 100)),
  });

  function syncMuteUI(muted) {
    muteBtn.textContent = muted ? 'Unmute' : 'Mute';
    icon.textContent = muted ? '🔇' : '🎵';
  }

  muteBtn.addEventListener('click', () => syncMuteUI(music.toggleMute()));

  slider.addEventListener('input', () => {
    music.setVolume(Number(slider.value) / 100);
    // Raising the volume while muted should audibly take effect right away.
    if (music.muted && Number(slider.value) > 0) {
      music.setMuted(false);
      syncMuteUI(false);
    }
  });

  const infoBtn = el('button.music-info-btn', { type: 'button', 'aria-label': 'Audio credits' }, ['i']);
  const creditsPanel = el('div.music-credits', {}, [
    el('div.music-credits-title', {}, ['Audio credits']),
    el('div.music-credits-line', {}, ['Tyufyakin Konstantin']),
    el('div.music-credits-line', {}, ['Oh My Darling, Clementine']),
  ]);

  const panel = el('div.music-panel', {}, [
    el('div.music-title-row', {}, [
      el('div.music-title', {}, ['🎵 Music']),
      infoBtn,
    ]),
    muteBtn,
    el('div.music-row', {}, [
      el('span.music-lbl', {}, ['Volume']),
      slider,
    ]),
    creditsPanel,
  ]);

  function setOpen(open) {
    panel.classList.toggle('open', open);
    btn.classList.toggle('active', open);
    if (!open) creditsPanel.classList.remove('open');
  }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!panel.classList.contains('open'));
  });
  infoBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    creditsPanel.classList.toggle('open');
  });
  document.addEventListener('pointerdown', (e) => {
    if (panel.classList.contains('open') && !panel.contains(e.target) && e.target !== btn) {
      setOpen(false);
    }
  });

  return { el: el('div.music-widget', {}, [btn, panel]) };
}
