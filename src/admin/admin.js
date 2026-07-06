/**
 * admin.js - the admin panel (admin.html).
 *
 * Signs in with the admin's Supabase Auth email + password, then reads the
 * `students` and `game_events` tables and renders: overview stats, a student
 * list (click one for their full playthrough timeline), per-moment choice
 * breakdowns, and all reflections.
 *
 * Reading only works for the admin account: the RLS policies in
 * supabase/schema.sql allow SELECT solely for that signed-in email. The game
 * itself never loads this file.
 */

import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../data/supabase.js';

const $ = (id) => document.getElementById(id);
const TOKEN_KEY = 'gg_admin_token';
let token = sessionStorage.getItem(TOKEN_KEY) || null;

/** Escape user-entered text before it goes into innerHTML. */
function esc(v) {
  return String(v == null ? '' : v)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

// ── Supabase calls ─────────────────────────────────────────────────────────

async function signIn(email, password) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  if (!res.ok) {
    throw new Error(body.error_description || body.msg || 'Sign-in failed');
  }
  token = body.access_token;
  sessionStorage.setItem(TOKEN_KEY, token);
}

/** Fetch every row of a REST query, paging past the 1000-row limit. */
async function fetchAll(query) {
  const out = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${query}`, {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
        Range: `${from}-${from + page - 1}`,
      },
    });
    if (res.status === 401) { throw new Error('expired'); }
    if (!res.ok) throw new Error(`Query failed (${res.status})`);
    const rows = await res.json();
    out.push(...rows);
    if (rows.length < page) return out;
  }
}

// ── Rendering ──────────────────────────────────────────────────────────────

let students = [];
let events = [];
const byId = new Map();      // student_id -> student
const byStudent = new Map(); // student_id -> events[]

function scorePill(n) {
  const v = Number(n);
  return `<span class="pill${v < 0 ? ' neg' : ''}">${v > 0 ? '+' : ''}${v}</span>`;
}

function renderStats() {
  const completes = events.filter((e) => e.event_type === 'episode_complete');
  const written = events.filter((e) => e.event_type === 'reflection' || e.event_type === 'thought');
  const avg = completes.length
    ? (completes.reduce((s, e) => s + Number(e.data.score || 0), 0) / completes.length).toFixed(1)
    : '-';
  const card = (num, lbl) =>
    `<div class="card"><div class="num">${num}</div><div class="lbl">${lbl}</div></div>`;
  $('stats').innerHTML =
    card(students.length, 'Students') +
    card(new Set(events.map((e) => e.session_id)).size, 'Playthroughs') +
    card(completes.length, 'Completed') +
    card(avg, 'Avg final score') +
    card(written.length, 'Written notes');
}

function renderStudents() {
  if (!students.length) {
    $('students').innerHTML = '<div class="quiet">No students yet - they appear as soon as someone fills the form.</div>';
    return;
  }
  const rows = students.map((s) => {
    const evs = byStudent.get(s.id) || [];
    const plays = new Set(evs.map((e) => e.session_id)).size;
    const done = evs.filter((e) => e.event_type === 'episode_complete');
    const last = done.length ? scorePill(done[done.length - 1].data.score) : '<span class="muted">-</span>';
    return `<tr class="click" data-id="${esc(s.id)}">
      <td>${esc(s.name)}</td><td>${esc(s.age ?? '-')}</td>
      <td>${esc(s.city || '-')}</td><td>${esc(s.country || '-')}</td>
      <td>${plays}</td><td>${last}</td>
      <td class="muted">${new Date(s.created_at).toLocaleDateString()}</td>
    </tr>`;
  }).join('');
  $('students').innerHTML = `<table>
    <thead><tr><th>Name</th><th>Age</th><th>Town</th><th>Country</th>
    <th>Plays</th><th>Last score</th><th>First seen</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
  $('students').querySelectorAll('tr.click').forEach((tr) => {
    tr.addEventListener('click', () => renderTimeline(tr.dataset.id));
  });
}

function describe(e) {
  const d = e.data || {};
  const m = d.moment != null ? `Moment ${esc(d.moment)}` : '';
  switch (e.event_type) {
    case 'game_start': return '▶️ Started playing';
    case 'thought': return `💭 ${m} - thought before choosing: “${esc(d.text)}”`;
    case 'choice_1': return `🅰️ ${m} “${esc(d.title)}” - first choice <b>${esc(d.choice)}</b>: ${esc(d.text)}`;
    case 'choice_2': return `🅱️ ${m} - second choice <b>${esc(d.choice)}</b>: ${esc(d.text)} → ${scorePill(d.score)} ${esc(d.virtue || '')}`;
    case 'story_skipped': return `⏭️ ${m} - skipped the story`;
    case 'try_differently': return `↩️ ${m} - pressed “Try differently”`;
    case 'reflection': return `💬 ${m} - wrote: “${esc(d.text)}”`;
    case 'reflection_skipped': return `🤔 ${m} - skipped the reflection`;
    case 'episode_complete': return `🏁 Finished with ${scorePill(d.score)} · ${esc((d.virtues || []).join(', '))}`;
    default: return esc(e.event_type);
  }
}

function renderTimeline(studentId) {
  const s = byId.get(studentId);
  const evs = (byStudent.get(studentId) || [])
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  $('detail-title').textContent =
    `Playthrough of ${s ? s.name : 'unknown'}` + (s && s.age ? `, ${s.age}` : '');
  if (!evs.length) {
    $('timeline').innerHTML = '<div class="quiet">No events for this student yet.</div>';
  } else {
    // Group by session (one playthrough each).
    const sessions = new Map();
    evs.forEach((e) => {
      if (!sessions.has(e.session_id)) sessions.set(e.session_id, []);
      sessions.get(e.session_id).push(e);
    });
    let n = 0;
    $('timeline').innerHTML = [...sessions.values()].map((list) => {
      n += 1;
      const day = new Date(list[0].created_at).toLocaleString();
      const items = list.map((e) =>
        `<div class="ev"><time>${new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time><div>${describe(e)}</div></div>`,
      ).join('');
      return `<div class="session"><div class="session-h">Playthrough ${n} · ${day}</div>${items}</div>`;
    }).join('');
  }
  $('detail').hidden = false;
  $('detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderChoices() {
  const perMoment = new Map(); // moment -> { title, c1: {A,B}, c2: {A,B}, scores: [] }
  events.forEach((e) => {
    const d = e.data || {};
    if (d.moment == null) return;
    if (!perMoment.has(d.moment)) {
      perMoment.set(d.moment, { title: d.title || '', c1: { A: 0, B: 0 }, c2: { A: 0, B: 0 }, scores: [], retries: 0 });
    }
    const row = perMoment.get(d.moment);
    if (d.title) row.title = d.title;
    if (e.event_type === 'choice_1' && row.c1[d.choice] != null) row.c1[d.choice] += 1;
    if (e.event_type === 'choice_2') {
      if (row.c2[d.choice] != null) row.c2[d.choice] += 1;
      row.scores.push(Number(d.score || 0));
    }
    if (e.event_type === 'try_differently') row.retries += 1;
  });
  if (!perMoment.size) {
    $('choices').innerHTML = '<div class="quiet">No choices made yet.</div>';
    return;
  }
  const rows = [...perMoment.entries()].sort((a, b) => a[0] - b[0]).map(([id, r]) => {
    const avg = r.scores.length ? (r.scores.reduce((s, v) => s + v, 0) / r.scores.length).toFixed(1) : '-';
    return `<tr><td>${esc(id)}</td><td>${esc(r.title)}</td>
      <td>${r.c1.A} / ${r.c1.B}</td><td>${r.c2.A} / ${r.c2.B}</td>
      <td>${avg}</td><td>${r.retries}</td></tr>`;
  }).join('');
  $('choices').innerHTML = `<table>
    <thead><tr><th>#</th><th>Moment</th><th>1st choice A / B</th>
    <th>2nd choice A / B</th><th>Avg score</th><th>Retries</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

function renderReflections() {
  const written = events.filter((e) => e.event_type === 'thought' || e.event_type === 'reflection');
  if (!written.length) {
    $('reflections').innerHTML = '<div class="quiet">No written thoughts or reflections yet.</div>';
    return;
  }
  // One row per student; their writing stays hidden until the name is hovered,
  // then shows grouped by story. (The CSV export keeps the full flat list.)
  const byStu = new Map(); // student_id -> written events
  written.forEach((e) => {
    const key = e.student_id || 'unknown';
    if (!byStu.has(key)) byStu.set(key, []);
    byStu.get(key).push(e);
  });
  const rows = [...byStu.entries()].map(([sid, list]) => {
    const s = byId.get(sid);
    // Group each student's writing by story number, newest device order.
    const byMoment = new Map();
    list.forEach((e) => {
      const m = e.data.moment != null ? Number(e.data.moment) : 0;
      if (!byMoment.has(m)) byMoment.set(m, []);
      byMoment.get(m).push(e.data.text);
    });
    const pop = [...byMoment.entries()].sort((a, b) => a[0] - b[0]).map(([m, texts]) =>
      `<div class="rf-item"><span class="rf-m">${m ? `Story ${esc(m)}` : 'Story —'}</span>
        <div class="rf-txts">${texts.map((t) => `<div>“${esc(t)}”</div>`).join('')}</div></div>`,
    ).join('');
    return `<tr><td><span class="rf-name" tabindex="0">${esc(s ? s.name : 'Unknown')}<div class="rf-pop">${pop}</div></span></td></tr>`;
  }).join('');
  $('reflections').innerHTML = `<table>
    <thead><tr><th>Student — hover a name to see their thoughts per story</th></tr></thead>
    <tbody>${rows}</tbody></table>`;
}

// ── CSV export (download the whole data sheet) ─────────────────────────────

function csvCell(v) {
  const s = String(v == null ? '' : v);
  return /[",\n\r]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
}

function downloadCsv(filename, headers, rows) {
  const lines = [headers.join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => csvCell(r[h])).join(',')));
  // Leading BOM so Excel reads UTF-8 (accents, emoji) correctly.
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** One flat sheet: every event, with the student's details on each row. */
function exportCsv() {
  const headers = [
    'student_name', 'age', 'city', 'country', 'session_id', 'time',
    'event_type', 'episode', 'moment', 'title', 'choice', 'choice_text',
    'score', 'virtue', 'written_text',
  ];
  const isChoice = (t) => t === 'choice_1' || t === 'choice_2';
  const isWritten = (t) => t === 'thought' || t === 'reflection';
  const rows = events
    .slice()
    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    .map((e) => {
      const s = byId.get(e.student_id) || {};
      const d = e.data || {};
      return {
        student_name: s.name ?? '',
        age: s.age ?? '',
        city: s.city ?? '',
        country: s.country ?? '',
        session_id: e.session_id,
        time: e.created_at,
        event_type: e.event_type,
        episode: e.episode ?? '',
        moment: d.moment ?? '',
        title: d.title ?? '',
        choice: d.choice ?? '',
        choice_text: isChoice(e.event_type) ? (d.text ?? '') : '',
        score: d.score ?? '',
        virtue: d.virtue ?? '',
        written_text: isWritten(e.event_type) ? (d.text ?? '') : '',
      };
    });
  const date = new Date().toISOString().slice(0, 10);
  downloadCsv(`goodness-data-${date}.csv`, headers, rows);
}

// ── Load + auth flow ───────────────────────────────────────────────────────

async function loadDashboard() {
  [students, events] = await Promise.all([
    fetchAll('students?select=*&order=created_at.desc'),
    fetchAll('game_events?select=*&order=created_at.asc'),
  ]);
  byId.clear();
  byStudent.clear();
  students.forEach((s) => byId.set(s.id, s));
  events.forEach((e) => {
    if (!e.student_id) return;
    if (!byStudent.has(e.student_id)) byStudent.set(e.student_id, []);
    byStudent.get(e.student_id).push(e);
  });
  renderStats();
  renderStudents();
  renderChoices();
  renderReflections();
  $('detail').hidden = true;
  $('loaded-at').textContent = `Data loaded ${new Date().toLocaleTimeString()}`;
}

function showLogin(msg) {
  token = null;
  sessionStorage.removeItem(TOKEN_KEY);
  $('dash').hidden = true;
  $('login').hidden = false;
  $('login-err').textContent = msg || '';
}

async function showDashboard() {
  $('login').hidden = true;
  $('dash').hidden = false;
  try {
    await loadDashboard();
  } catch (e) {
    showLogin(e.message === 'expired' ? 'Session expired - please sign in again.' : e.message);
  }
}

$('login-btn').addEventListener('click', async () => {
  $('login-err').textContent = '';
  $('login-btn').disabled = true;
  try {
    await signIn($('email').value.trim(), $('password').value);
    await showDashboard();
  } catch (e) {
    $('login-err').textContent = e.message;
  } finally {
    $('login-btn').disabled = false;
  }
});
$('password').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('login-btn').click(); });
$('refresh-btn').addEventListener('click', () => loadDashboard().catch((e) => showLogin(e.message)));
$('logout-btn').addEventListener('click', () => showLogin());
$('download-btn').addEventListener('click', () => {
  if (!events.length) { alert('No data to download yet.'); return; }
  exportCsv();
});

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  showLogin('Supabase keys are missing in src/data/supabase.js');
} else if (token) {
  showDashboard(); // token from this browser session - try it, fall back to login
}
