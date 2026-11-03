// Local-first persistence: progress lives in the learner's browser (localStorage),
// with an in-memory fallback when storage is unavailable. Export/import for backup.
const KEY = 'mathprep.v1';

const DEFAULTS = () => ({
  version: 1,
  attempts: [], // {qid, chapter, correct, time (ms), ts, mode, difficulty}
  bookmarks: [], // qid[]
  notes: {}, // qid → string
  srs: {}, // cardId → {ef, interval, reps, due (YYYY-MM-DD), lapses}
  mocks: [], // {ts, title, score, max, correct, wrong, skipped, duration, perChapter, items}
  settings: { theme: 'system', dailyGoal: 20, exam: 'all', name: '', newCardsPerDay: 10 },
  srsNewToday: { date: '', count: 0 },
});

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS();
    const parsed = JSON.parse(raw);
    const d = DEFAULTS();
    return { ...d, ...parsed, settings: { ...d.settings, ...(parsed.settings || {}) } };
  } catch {
    return DEFAULTS();
  }
}

function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage full or blocked */ }
  listeners.forEach((fn) => fn(state));
}

export const store = {
  get: () => state,
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  update(fn) { fn(state); save(); },
  reset() { state = DEFAULTS(); save(); },
  exportJSON: () => JSON.stringify(state, null, 2),
  importJSON(text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.attempts)) throw new Error('Not a valid progress file');
    const d = DEFAULTS();
    state = { ...d, ...parsed, settings: { ...d.settings, ...(parsed.settings || {}) } };
    save();
  },
};

// ───────── Dates
export const today = (d = new Date()) => {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};
export const addDays = (iso, n) => {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return today(d);
};

// ───────── Attempts
export function recordAttempt({ qid, chapter, correct, time, mode, difficulty }) {
  store.update((s) => {
    s.attempts.push({ qid, chapter, correct: !!correct, time: Math.round(time || 0), ts: Date.now(), mode, difficulty });
    if (s.attempts.length > 20000) s.attempts.splice(0, s.attempts.length - 20000);
  });
}

export function toggleBookmark(qid) {
  let on = false;
  store.update((s) => {
    const i = s.bookmarks.indexOf(qid);
    if (i >= 0) s.bookmarks.splice(i, 1);
    else { s.bookmarks.push(qid); on = true; }
  });
  return on;
}
export const isBookmarked = (qid) => state.bookmarks.includes(qid);

// ───────── Derived stats
export function chapterStats(chapterId) {
  const list = state.attempts.filter((a) => a.chapter === chapterId);
  const recent = list.slice(-20);
  const correct = list.filter((a) => a.correct).length;
  const recentAcc = recent.length ? recent.filter((a) => a.correct).length / recent.length : 0;
  // Mastery: recent accuracy, scaled by confidence from volume (full credit at 15+ attempts).
  const mastery = recent.length ? recentAcc * Math.min(1, recent.length / 15) : 0;
  return {
    attempts: list.length,
    correct,
    accuracy: list.length ? correct / list.length : 0,
    recentAcc,
    mastery,
    avgTime: list.length ? list.reduce((s, a) => s + a.time, 0) / list.length : 0,
  };
}

export function dayCounts() {
  const m = {};
  for (const a of state.attempts) {
    const d = today(new Date(a.ts));
    m[d] = (m[d] || 0) + 1;
  }
  return m;
}

export function streak() {
  const counts = dayCounts();
  let d = today();
  if (!counts[d]) d = addDays(d, -1); // today not done yet doesn't break the streak
  let n = 0;
  while (counts[d]) { n++; d = addDays(d, -1); }
  return n;
}

export function todayCount() {
  return dayCounts()[today()] || 0;
}

// Latest attempt per question → set of qids whose most recent attempt was wrong.
export function mistakeIds() {
  const last = new Map();
  for (const a of state.attempts) last.set(a.qid, a.correct);
  return [...last.entries()].filter(([, ok]) => !ok).map(([id]) => id);
}

// ───────── Spaced repetition (SM-2 variant)
// grade: 0 Again, 1 Hard, 2 Good, 3 Easy
export function reviewCard(cardId, grade) {
  store.update((s) => {
    const t = today();
    const c = s.srs[cardId] || { ef: 2.5, interval: 0, reps: 0, due: t, lapses: 0 };
    const isNew = !s.srs[cardId];
    if (grade === 0) {
      c.reps = 0; c.interval = 0; c.lapses++; c.ef = Math.max(1.3, c.ef - 0.2);
      c.due = t; // see again today
    } else {
      const q = [0, 3, 4, 5][grade];
      c.ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
      if (c.reps === 0) c.interval = grade === 3 ? 3 : 1;
      else if (c.reps === 1) c.interval = grade === 1 ? 3 : 6;
      else c.interval = Math.round(c.interval * (grade === 1 ? 1.2 : grade === 3 ? c.ef * 1.3 : c.ef));
      c.reps++;
      c.due = addDays(t, c.interval);
    }
    s.srs[cardId] = c;
    if (isNew) {
      if (s.srsNewToday.date !== t) s.srsNewToday = { date: t, count: 0 };
      s.srsNewToday.count++;
    }
  });
}

export function dueCards(allCards, { includeNew = true } = {}) {
  const t = today();
  const due = allCards.filter((c) => state.srs[c.id] && state.srs[c.id].due <= t);
  if (!includeNew) return due;
  const usedNew = state.srsNewToday.date === t ? state.srsNewToday.count : 0;
  const room = Math.max(0, state.settings.newCardsPerDay - usedNew);
  const fresh = allCards.filter((c) => !state.srs[c.id]).slice(0, room);
  return [...due, ...fresh];
}

export function nextIntervalLabel(cardId, grade) {
  const c = state.srs[cardId] || { ef: 2.5, interval: 0, reps: 0 };
  if (grade === 0) return '<1d';
  let iv;
  if (c.reps === 0) iv = grade === 3 ? 3 : 1;
  else if (c.reps === 1) iv = grade === 1 ? 3 : 6;
  else {
    const q = [0, 3, 4, 5][grade];
    const ef = Math.max(1.3, c.ef + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
    iv = Math.round(c.interval * (grade === 1 ? 1.2 : grade === 3 ? ef * 1.3 : ef));
  }
  return iv >= 30 ? `${Math.round(iv / 30)}mo` : `${iv}d`;
}
