/**
 * analytics.js — best-effort student + interaction logging to Supabase.
 *
 * Two tables (created by supabase/schema.sql):
 *   students     one row per child who fills the form (id generated here,
 *                in the browser, so nothing ever needs to be read back).
 *   game_events  one row per interaction: game_start, choice_1, choice_2,
 *                story_skipped, try_differently, reflection,
 *                reflection_skipped, episode_complete.
 *
 * Design rules:
 *   - NEVER block or break gameplay: every network call is fire-and-forget
 *     and failures only warn in the console.
 *   - If the keys in src/data/supabase.js are empty, everything is a no-op.
 *   - Events queue behind the student insert (one serial promise chain) so
 *     rows arrive in order and the student row always exists first.
 *   - The child's profile + id are kept in localStorage: a returning child
 *     gets their form prefilled and keeps ONE students row across replays;
 *     a different name/age on a shared device creates a fresh student.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../data/supabase.js';
import { G } from './state.js';

const STORE_KEY = 'goodness_student';

function configured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const session = { id: uuid(), studentId: null };

// All inserts chain onto this promise so they hit the database in order.
let queue = Promise.resolve();

async function insertRow(table, row, prefer) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Prefer: prefer || 'return=minimal',
    },
    body: JSON.stringify(row),
  });
  if (!res.ok) throw new Error(`Supabase insert into ${table} failed (${res.status})`);
}

function readStored() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)); } catch { return null; }
}

/** Last saved profile, for prefilling the form. */
export function savedProfile() {
  const s = readStored();
  return (s && s.profile) || {};
}

/** A new playthrough begins: give its events a fresh session id. */
export function startSession() {
  session.id = uuid();
}

/**
 * Save the form answers. Same child (identical answers) keeps their stored
 * id; the insert uses ignore-duplicates so replays never create copies.
 */
export function saveStudent(profile) {
  const stored = readStored();
  const sameKid = stored && stored.id && stored.profile &&
    ['name', 'age', 'city', 'country'].every(
      (k) => (stored.profile[k] ?? null) === (profile[k] ?? null),
    );
  const id = sameKid ? stored.id : uuid();
  session.studentId = id;
  try { localStorage.setItem(STORE_KEY, JSON.stringify({ id, profile })); } catch { /* private mode */ }

  if (!configured()) return;
  queue = queue
    .then(() => insertRow('students', { id, ...profile },
      'resolution=ignore-duplicates,return=minimal'))
    .catch((e) => console.warn('[analytics] student not saved:', e.message));
}

/** Log one interaction. `data` is any small JSON-able object. */
export function logEvent(eventType, data = {}) {
  if (!configured()) return;
  const row = {
    session_id: session.id,
    student_id: session.studentId,
    episode: (G.episode && G.episode.id) || null,
    event_type: eventType,
    data,
  };
  queue = queue
    .then(() => insertRow('game_events', row))
    .catch((e) => console.warn('[analytics] event not saved:', eventType, e.message));
}
