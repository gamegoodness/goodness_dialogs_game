/**
 * formScene.js - the small "about you" form shown between the title screen
 * and the game (Start → this form → play).
 *
 * Four friendly questions: name (required), age, town/city, country. Answers
 * are saved to Supabase as a `students` row (see engine/analytics.js) and
 * remembered in localStorage so a returning child finds the form prefilled.
 * If Supabase isn't configured the form still works and the game still plays.
 */

import { el } from '../engine/dom.js';
import { ASSETS } from '../data/config.js';
import { sfx } from '../engine/audio.js';
import { guard } from '../engine/transitions.js';
import { saveStudent, savedProfile } from '../engine/analytics.js';

const COUNTRIES = [
  'Australia', 'Bangladesh', 'Brazil', 'Canada', 'China', 'Egypt', 'France',
  'Germany', 'India', 'Indonesia', 'Ireland', 'Italy', 'Japan', 'Kenya',
  'Malaysia', 'Maldives', 'Mexico', 'Nepal', 'Netherlands', 'New Zealand',
  'Nigeria', 'Pakistan', 'Philippines', 'Qatar', 'Saudi Arabia', 'Singapore',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Thailand', 'Turkey',
  'United Arab Emirates', 'United Kingdom', 'United States', 'Vietnam',
  'Other',
];

export function createFormScene(app) {
  const prev = savedProfile();

  const nameIn = el('input.finput', {
    type: 'text', maxLength: 60, placeholder: 'Your name',
    autocomplete: 'off', value: prev.name || '',
  });
  const ageIn = el('input.finput', {
    type: 'number', min: 3, max: 99, placeholder: 'How old are you?',
    value: prev.age != null ? prev.age : '',
  });
  const cityIn = el('input.finput', {
    type: 'text', maxLength: 60, placeholder: 'Your town or city',
    autocomplete: 'off', value: prev.city || '',
  });
  const countrySel = el('select.finput', {}, [
    el('option', { value: '' }, ['Choose your country…']),
    ...COUNTRIES.map((c) => el('option', { value: c, selected: prev.country === c }, [c])),
  ]);

  const field = (label, input) => el('label.fld', {}, [
    el('span.fld-label', {}, [label]), input,
  ]);

  const err = el('div.form-err');
  const goBtn = el('button.sbtn', { type: 'button' }, ['Start playing →']);

  goBtn.addEventListener('click', () => {
    const name = nameIn.value.trim();
    if (!name) {
      err.textContent = 'Please tell us your name 😊';
      nameIn.focus();
      return;
    }
    guard.run(async () => {
      sfx.advance();
      const age = parseInt(ageIn.value, 10);
      saveStudent({
        name,
        age: Number.isFinite(age) ? age : null,
        city: cityIn.value.trim() || null,
        country: countrySel.value || null,
      });
      await app.toGame();
    });
  });

  const scene = el('div.scene.form-screen', {}, [
    el('div.form-card', {}, [
      el('div.form-title', {}, ['Before we start… 👋']),
      el('div.form-sub', {}, ['Tell the Good Angel a little about you.']),
      field('Your name', nameIn),
      field('Your age', ageIn),
      field('Where are you from?', cityIn),
      field('Which country?', countrySel),
      err,
      goBtn,
      el('div.form-note', {}, ['Your answers help your teacher see how you played.']),
    ]),
  ]);

  return {
    el: scene,
    bg: { gradient: 'linear-gradient(135deg,#2D4A3E,#1A2E26)', image: ASSETS.backgrounds.title },
  };
}
