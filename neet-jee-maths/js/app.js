import { $, $$, esc, mathHTML, typeset, toast, ring, ICONS, pct, diffDots } from './ui.js';
import { store, chapterStats, streak, todayCount, mistakeIds, dueCards, today } from './store.js';
import { UNITS, CHAPTERS, chapterById, unitById, EXAMS, FLASHCARDS } from './data/syllabus.js';
import { QUESTIONS } from './data/questions.js';
import { examChapters, curatedFor, getQuestion, generatorsForChapter, dailyChallenge, ALL_GENERATORS } from './bank.js';
import { renderPractice, stripTex } from './practice.js';
import { renderMockSetup, renderMockRun, renderMockResult } from './mock.js';
import { renderCards, cardsForExam } from './cards.js';
import { renderAnalytics } from './analytics.js';

const view = $('#view');
let cleanup = null;

const NAV = [
  { id: 'home', href: '#/', label: 'Dashboard', short: 'Home', icon: ICONS.home },
  { id: 'syllabus', href: '#/syllabus', label: 'Syllabus', short: 'Learn', icon: ICONS.book },
  { id: 'practice', href: '#/practice/smart', label: 'Smart Practice', short: 'Practice', icon: ICONS.zap },
  { id: 'mock', href: '#/mock', label: 'Mock Tests', short: 'Mocks', icon: ICONS.clock },
  { id: 'cards', href: '#/cards', label: 'Flashcards', short: 'Cards', icon: ICONS.cards, badge: () => dueCards(cardsForExam()).length },
  { id: 'notebook', href: '#/notebook', label: 'Notebook', short: 'Notes', icon: ICONS.notebook, mobile: false },
  { id: 'analytics', href: '#/analytics', label: 'Analytics', short: 'Stats', icon: ICONS.chart },
];

function drawNav(active) {
  $('#nav').innerHTML = NAV.map((n) => {
    const b = n.badge ? n.badge() : 0;
    return `<a class="nav-link ${n.id === active ? 'active' : ''}" href="${n.href}">${n.icon}${n.label}${b ? `<span class="nav-badge">${b}</span>` : ''}</a>`;
  }).join('');
  $('.sidebar [data-route="settings"]').classList.toggle('active', active === 'settings');
  $('#tabbar').innerHTML = NAV.filter((n) => n.mobile !== false).map((n) => `<a class="${n.id === active ? 'active' : ''}" href="${n.href}">${n.icon}<span>${n.short}</span></a>`).join('');
}

function navigate(hash) {
  if (location.hash === hash) route();
  else location.hash = hash;
}

const ROUTES = [
  [/^\/?$/, 'home', () => renderDashboard()],
  [/^\/syllabus$/, 'syllabus', () => renderSyllabus()],
  [/^\/chapter\/([\w-]+)(?:\/(\w+))?$/, 'syllabus', (m) => renderChapter(m[1], m[2] || 'learn')],
  [/^\/practice\/(\w+)(?:\/(.+))?$/, 'practice', (m) => renderPractice(view, m[1], m[2])],
  [/^\/mock$/, 'mock', () => renderMockSetup(view, navigate)],
  [/^\/mock\/run$/, 'mock', () => renderMockRun(view, navigate)],
  [/^\/mock\/result\/(\d+)$/, 'mock', (m) => renderMockResult(view, m[1])],
  [/^\/cards(?:\/([\w-]+))?$/, 'cards', (m) => renderCards(view, m[1])],
  [/^\/analytics$/, 'analytics', () => renderAnalytics(view)],
  [/^\/notebook$/, 'notebook', () => renderNotebook()],
  [/^\/settings$/, 'settings', () => renderSettings()],
];

function route() {
  if (typeof cleanup === 'function') { try { cleanup(); } catch { /* ignore */ } }
  cleanup = null;
  const path = decodeURI(location.hash.replace(/^#/, '')) || '/';
  for (const [re, nav, fn] of ROUTES) {
    const m = path.match(re);
    if (m) {
      drawNav(nav);
      cleanup = fn(m) || null;
      window.scrollTo(0, 0);
      return;
    }
  }
  drawNav('');
  view.innerHTML = `<div class="empty"><div class="big">🧭</div><h2>Page not found</h2><p style="margin-top:12px"><a class="btn" href="#/">Go to dashboard</a></p></div>`;
}

// ───────── Dashboard
function greeting() {
  const h = new Date().getHours();
  return h < 5 ? 'Burning the midnight oil' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function renderDashboard() {
  const s = store.get();
  const goal = s.settings.dailyGoal;
  const done = todayCount();
  const st = streak();
  const due = dueCards(cardsForExam()).length;
  const mistakes = mistakeIds().length;
  const chapters = examChapters();
  const stats = chapters.map((c) => ({ c, st: chapterStats(c.id) }));
  const started = stats.filter((x) => x.st.attempts > 0);
  const overall = stats.length ? stats.reduce((a, x) => a + x.st.mastery, 0) / stats.length : 0;
  const weakest = [...started].filter((x) => x.st.attempts >= 3).sort((a, b) => a.st.mastery - b.st.mastery).slice(0, 3);
  const fresh = stats.filter((x) => x.st.attempts === 0).slice(0, 3 - weakest.length);
  const recos = [...weakest, ...fresh];
  const dailyDone = new Set(s.attempts.filter((a) => a.mode === 'daily' && today(new Date(a.ts)) === today()).map((a) => a.qid)).size;
  const dailyTotal = dailyChallenge(today()).length;
  const name = s.settings.name ? `, ${esc(s.settings.name)}` : '';

  view.innerHTML = `
    <section class="hero">
      <div>
        <div class="eyebrow" style="color:rgba(255,255,255,.7)">${esc(EXAMS[s.settings.exam])} · ${new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
        <h1>${greeting()}${name}.</h1>
        <p>${done >= goal ? `Goal smashed — ${done} questions today. Keep the streak alive with a mock or a few flashcards.` : `${goal - done} more question${goal - done === 1 ? '' : 's'} to hit today’s goal. Smart Practice picks them from where you’ll gain the most.`}</p>
        <div class="row" style="margin-top:18px">
          <a class="btn btn-lg" href="#/practice/smart">${ICONS.zap} Smart Practice</a>
          <a class="btn btn-lg btn-outline" href="#/mock">${ICONS.clock} Mock test</a>
        </div>
      </div>
      ${ring(done / goal, { size: 132, stroke: 11, label: `${done}/${goal}`, sub: 'today' })}
    </section>

    <div class="grid grid-4 section" style="margin-top:20px">
      <div class="card stat"><span class="k">Streak</span><span class="v">${st} day${st === 1 ? '' : 's'}</span><span class="s">${st ? 'Don’t break the chain' : 'Solve one question to start'}</span></div>
      <div class="card stat"><span class="k">Syllabus mastery</span><span class="v">${pct(overall)}</span><span class="s">${started.length}/${chapters.length} chapters started</span></div>
      <a class="card stat action-card" style="display:flex" href="#/cards"><span class="k">Cards due</span><span class="v">${due}</span><span class="s">Formula flashcards</span></a>
      <a class="card stat action-card" style="display:flex" href="#/practice/mistakes"><span class="k">Mistakes to fix</span><span class="v">${mistakes}</span><span class="s">${mistakes ? 'Retry them now' : 'Nothing pending'}</span></a>
    </div>

    <div class="grid grid-2 section">
      <a class="card action-card" href="#/practice/daily">
        <span class="action-icon">${ICONS.flame}</span>
        <span style="flex:1"><h3>Daily Challenge</h3><span class="muted small">5 questions across the syllabus — new set every day.</span>
          <div class="progress" style="margin-top:10px"><span style="width:${dailyTotal ? Math.min(100, (dailyDone / dailyTotal) * 100) : 0}%"></span></div>
          <span class="tiny faint">${dailyDone}/${dailyTotal} done today</span></span>
      </a>
      <a class="card action-card" href="#/syllabus">
        <span class="action-icon">${ICONS.infinity}</span>
        <span><h3>Unlimited drills</h3><span class="muted small">${ALL_GENERATORS.length} question generators produce fresh problems with full solutions — you never run out.</span></span>
      </a>
    </div>

    <div class="section">
      <div class="section-head"><h2>Recommended for you</h2><a class="small" href="#/analytics">Full analytics →</a></div>
      <div class="grid grid-3">${recos.map(({ c, st }) => chapterCard(c, st, true)).join('') || '<p class="muted">Pick any chapter to begin.</p>'}</div>
    </div>`;
  typeset(view);
}

function chapterCard(c, st, compact = false) {
  const nQ = curatedFor(c.id).length;
  const nG = generatorsForChapter(c.id).length;
  return `<a class="card chapter-card" href="#/chapter/${c.id}">
    <div class="row-between"><h3>${esc(c.name)}</h3>${st.attempts ? `<span class="chip ${st.mastery >= 0.7 ? 'chip-good' : st.mastery >= 0.4 ? 'chip-warn' : ''}">${pct(st.mastery)}</span>` : '<span class="chip">New</span>'}</div>
    ${compact ? `<span class="small muted">${esc(unitById[c.unit].name)}</span>` : ''}
    <div class="progress"><span style="width:${st.mastery * 100}%"></span></div>
    <div class="meta">
      ${c.exams.map((e) => `<span class="chip tiny">${e === 'main' ? 'Main' : e === 'adv' ? 'Adv' : 'NEET'}</span>`).join('')}
      <span class="chip tiny">${nQ} Qs${nG ? ` + ∞` : ''}</span>
      <span class="chip tiny">${c.formulas.length} formulas</span>
    </div>
  </a>`;
}

// ───────── Syllabus
function renderSyllabus() {
  const s = store.get();
  let exam = s.settings.exam;
  let query = '';
  function draw() {
    const chapters = (exam === 'all' ? CHAPTERS : CHAPTERS.filter((c) => c.exams.includes(exam)))
      .filter((c) => !query || c.name.toLowerCase().includes(query) || c.notes.join(' ').toLowerCase().includes(query) || c.formulas.some((f) => f.name.toLowerCase().includes(query)));
    const list = $('#unitlist', view);
    list.innerHTML = UNITS.map((u) => {
      const cs = chapters.filter((c) => c.unit === u.id);
      if (!cs.length) return '';
      return `<div class="unit-block"><div class="unit-title"><span class="unit-icon">${u.icon}</span><h2>${esc(u.name)}</h2><span class="faint small">${cs.length} chapter${cs.length === 1 ? '' : 's'}</span></div>
        <div class="grid grid-3">${cs.map((c) => chapterCard(c, chapterStats(c.id))).join('')}</div></div>`;
    }).join('') || '<div class="empty"><p>No chapters match.</p></div>';
  }
  view.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">${CHAPTERS.length} chapters · ${QUESTIONS.length} curated questions · ${FLASHCARDS.length} formulas</div><h1>Syllabus</h1>
      <p class="muted">Concept notes, formula sheets, practice and flashcards for every chapter.</p></div></div>
    <div class="row-between" style="flex-wrap:wrap;gap:12px">
      <div class="seg" id="examseg">${Object.entries(EXAMS).map(([k, v]) => `<button data-e="${k}" class="${k === exam ? 'on' : ''}">${esc(v)}</button>`).join('')}</div>
      <input type="search" id="q" placeholder="Search chapters, topics, formulas…" style="max-width:320px" aria-label="Search syllabus">
    </div>
    <div id="unitlist"></div>`;
  $$('#examseg button', view).forEach((b) => b.addEventListener('click', () => {
    exam = b.dataset.e;
    store.update((st) => { st.settings.exam = exam; });
    $$('#examseg button', view).forEach((x) => x.classList.toggle('on', x === b));
    draw();
  }));
  $('#q', view).addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); draw(); });
  draw();
}

// ───────── Chapter
function renderChapter(id, tab) {
  const c = chapterById[id];
  if (!c) { view.innerHTML = '<div class="empty"><p>Chapter not found.</p></div>'; return; }
  const st = chapterStats(id);
  const qs = curatedFor(id);
  const gens = generatorsForChapter(id);
  const tabs = [['learn', 'Concepts & formulas'], ['practice', 'Practice'], ['questions', `Question bank (${qs.length})`]];
  const attempts = store.get().attempts;
  const lastBy = new Map();
  for (const a of attempts) lastBy.set(a.qid, a.correct);

  let body = '';
  if (tab === 'learn') {
    body = `
      <div class="grid" style="grid-template-columns:minmax(0,1fr)">
        <div class="card"><div class="row-between" style="margin-bottom:14px"><h2>Key ideas</h2>
          <button class="btn btn-sm no-print" onclick="window.print()">${ICONS.printer} Print sheet</button></div>
          <ul class="note-list">${c.notes.map((n) => `<li>${mathHTML(n)}</li>`).join('')}</ul></div>
      </div>
      <div class="section-head section"><h2>Formula sheet</h2><a class="btn btn-sm no-print" href="#/cards/${id}">${ICONS.cards} Drill as flashcards</a></div>
      <div class="grid grid-2">${c.formulas.map((f) => `<div class="formula"><span class="name">${esc(f.name)}</span><div class="tex">${mathHTML('$$' + f.tex + '$$')}</div></div>`).join('')}</div>
      <div class="row section no-print"><a class="btn btn-primary btn-lg" href="#/practice/chapter/${id}">Practise this chapter ${ICONS.next}</a></div>`;
  } else if (tab === 'practice') {
    body = `
      <div class="grid grid-2">
        <a class="card action-card" href="#/practice/chapter/${id}"><span class="action-icon">${ICONS.target}</span>
          <span><h3>Chapter practice</h3><span class="muted small">Unseen questions first, then ones you missed${gens.length ? ', mixed with freshly generated problems' : ''}.</span></span></a>
        <a class="card action-card" href="#/cards/${id}"><span class="action-icon">${ICONS.cards}</span>
          <span><h3>Formula cards</h3><span class="muted small">${c.formulas.length} cards — recall every formula in this chapter.</span></span></a>
      </div>
      ${gens.length ? `<div class="section"><div class="section-head"><h2>Unlimited drills</h2><span class="faint small">Fresh numbers every time, full solutions</span></div>
        <div class="stack" style="gap:8px">${gens.map((g) => `<a class="gen-item" href="#/practice/gen/${g.id}"><span>${ICONS.infinity.replace('<svg', '<svg width="16" height="16" style="vertical-align:-3px;margin-right:6px"')}<b>${esc(g.name)}</b></span><span class="row">${diffDots(g.difficulty)}${ICONS.next.replace('<svg', '<svg width="18" height="18"')}</span></a>`).join('')}</div></div>` : ''}`;
  } else {
    body = `<div class="stack">${qs.map((q, i) => {
      const s = lastBy.has(q.id) ? (lastBy.get(q.id) ? 'good' : 'bad') : 'skip';
      return `<a class="review-item" style="display:flex;align-items:center;gap:12px;padding:14px 16px;color:var(--text)" href="#/practice/q/${q.id}">
        <span class="badge-dot ${s}">${s === 'good' ? '✓' : s === 'bad' ? '✗' : i + 1}</span>
        <span class="review-q">${mathHTML(stripTex(q.q))}</span>${diffDots(q.difficulty)}</a>`;
    }).join('')}</div>`;
  }

  view.innerHTML = `
    <div class="page-head">
      <div><div class="eyebrow"><a href="#/syllabus">Syllabus</a> / ${esc(unitById[c.unit].name)}</div><h1>${esc(c.name)}</h1>
        <div class="row" style="margin-top:10px">${c.exams.map((e) => `<span class="chip">${esc(EXAMS[e])}</span>`).join('')}<span class="chip">Weightage: ${esc(c.weight)}</span></div></div>
      <div class="row">${ring(st.mastery, { size: 84, stroke: 8, label: pct(st.mastery), sub: 'mastery' })}
        <div class="small muted">${st.attempts} attempts<br>${st.attempts ? pct(st.accuracy) + ' accuracy' : 'Not started'}</div></div>
    </div>
    <nav class="tabs">${tabs.map(([k, v]) => `<a class="${k === tab ? 'active' : ''}" href="#/chapter/${id}/${k}">${esc(v)}</a>`).join('')}</nav>
    ${body}`;
  typeset(view);
}

// ───────── Notebook (bookmarks + mistakes)
function renderNotebook() {
  const s = store.get();
  const mistakes = mistakeIds().map(getQuestion).filter(Boolean);
  const bms = s.bookmarks.map(getQuestion).filter(Boolean);
  const list = (qs, empty) => qs.length
    ? `<div class="stack" style="gap:8px">${qs.map((q) => `<details class="review-item"><summary>
        <span class="review-q">${mathHTML(stripTex(q.q))}</span><span class="chip">${esc(chapterById[q.chapter]?.name || '')}</span></summary>
        <div class="body"><div class="q-text">${mathHTML(q.q)}</div>
        ${q.type === 'mcq' ? `<ol type="A" style="margin:10px 0">${q.options.map((o, i) => `<li style="${i === q.answer ? 'color:var(--good);font-weight:600' : ''}">${mathHTML(o)}</li>`).join('')}</ol>` : ''}
        <div class="feedback"><div class="feedback-title">Solution</div><div class="solution">${mathHTML(q.solution)}</div></div>
        <div class="row" style="margin-top:10px"><a class="btn btn-sm" href="#/practice/q/${encodeURIComponent(q.id)}">Try again</a></div></div></details>`).join('')}</div>`
    : `<div class="card empty"><p>${empty}</p></div>`;
  view.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Your revision notebook</div><h1>Notebook</h1>
      <p class="muted">Every question you get wrong lands here until you get it right. Bookmark anything worth revisiting.</p></div></div>
    <div class="section-head"><h2>Mistakes (${mistakes.length})</h2>${mistakes.length ? '<a class="btn btn-sm btn-primary" href="#/practice/mistakes">Retry all</a>' : ''}</div>
    ${list(mistakes, 'No pending mistakes. 🎯')}
    <div class="section-head section"><h2>Bookmarks (${bms.length})</h2>${bms.length ? '<a class="btn btn-sm" href="#/practice/bookmarks">Practise all</a>' : ''}</div>
    ${list(bms, 'Tap the bookmark icon on any question to save it here.')}`;
  typeset(view);
}

// ───────── Settings
function applyTheme() {
  const t = store.get().settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t;
  else delete document.documentElement.dataset.theme;
}

function renderSettings() {
  const s = store.get().settings;
  view.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Preferences</div><h1>Settings</h1></div></div>
    <div class="stack" style="max-width:720px;gap:16px">
      <div class="card stack">
        <h3>Profile & goals</h3>
        <label class="field">Your name (optional)<input type="text" id="sname" value="${esc(s.name)}" maxlength="40" placeholder="Shown on the dashboard"></label>
        <label class="field">Target exam
          <select id="sexam">${Object.entries(EXAMS).map(([k, v]) => `<option value="${k}" ${k === s.exam ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></label>
        <div class="grid grid-2">
          <label class="field">Daily question goal<input type="number" id="sgoal" min="1" max="500" value="${s.dailyGoal}"></label>
          <label class="field">New flashcards per day<input type="number" id="snew" min="0" max="100" value="${s.newCardsPerDay}"></label>
        </div>
      </div>
      <div class="card stack">
        <h3>Appearance</h3>
        <div class="seg" id="stheme">${['system', 'light', 'dark'].map((t) => `<button data-t="${t}" class="${t === s.theme ? 'on' : ''}">${t[0].toUpperCase() + t.slice(1)}</button>`).join('')}</div>
      </div>
      <div class="card stack">
        <h3>Your data</h3>
        <p class="small muted">Progress is stored only in this browser. Export a backup to move it to another device.</p>
        <div class="row">
          <button class="btn" id="sexport">Export progress</button>
          <label class="btn" style="cursor:pointer">Import progress<input type="file" id="simport" accept="application/json,.json" hidden></label>
          <button class="btn btn-danger" id="sreset">Reset everything</button>
        </div>
      </div>
      <p class="faint small">${QUESTIONS.length} curated questions · ${ALL_GENERATORS.length} generators · ${FLASHCARDS.length} formula cards · ${CHAPTERS.length} chapters</p>
    </div>`;
  const save = (fn, msg = 'Saved') => { store.update((st) => fn(st.settings)); toast(msg); };
  $('#sname').addEventListener('change', (e) => save((x) => { x.name = e.target.value.trim(); }));
  $('#sexam').addEventListener('change', (e) => save((x) => { x.exam = e.target.value; }));
  $('#sgoal').addEventListener('change', (e) => save((x) => { x.dailyGoal = Math.max(1, Math.min(500, Number(e.target.value) || 20)); }));
  $('#snew').addEventListener('change', (e) => save((x) => { x.newCardsPerDay = Math.max(0, Math.min(100, Number(e.target.value) || 0)); }));
  $$('#stheme button').forEach((b) => b.addEventListener('click', () => {
    save((x) => { x.theme = b.dataset.t; }, 'Theme updated');
    $$('#stheme button').forEach((y) => y.classList.toggle('on', y === b));
    applyTheme();
  }));
  $('#sexport').addEventListener('click', () => {
    const blob = new Blob([store.exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `ganit-progress-${today()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('#simport').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try { store.importJSON(await f.text()); applyTheme(); toast('Progress imported'); renderSettings(); }
    catch (err) { toast(`Import failed: ${err.message}`); }
  });
  $('#sreset').addEventListener('click', () => {
    if (confirm('Delete all progress, bookmarks, flashcard history and mock results? This cannot be undone.')) {
      store.reset(); applyTheme(); toast('All progress cleared'); renderSettings();
    }
  });
}

// ───────── Boot
applyTheme();
window.addEventListener('hashchange', route);
route();
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
