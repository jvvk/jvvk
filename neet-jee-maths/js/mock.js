import { $, $$, esc, mathHTML, typeset, toast, confetti, ring, ICONS, fmtTime, fmtSecs, pct } from './ui.js';
import { store, recordAttempt } from './store.js';
import { curatedFor, examChapters, chapterById, generatorsForChapter, randomSeed, CHAPTERS } from './bank.js';
import { generate, toMCQ } from './generators.js';
import { answerMatches, parseAnswer, shuffle, mulberry32, pick } from './lib/mathutil.js';
import { correctText, responseText, stripTex } from './practice.js';

const ACTIVE_KEY = 'mathprep.activeMock';

export const PRESETS = [
  { id: 'jee-main', title: 'JEE Main — Maths section', desc: '20 single-correct + 5 numerical · 60 min · +4 / −1', mcq: 20, num: 5, minutes: 60, exam: 'main', neg: 1, negNum: true },
  { id: 'quick', title: 'Quick 10', desc: '8 single-correct + 2 numerical · 20 min', mcq: 8, num: 2, minutes: 20, exam: null, neg: 1, negNum: true },
  { id: 'neet', title: 'NEET Physics maths drill', desc: '15 single-correct · 20 min · +4 / −1', mcq: 15, num: 0, minutes: 20, exam: 'neet', neg: 1, negNum: true },
  { id: 'adv', title: 'Advanced sprint', desc: '10 medium/hard numericals · 30 min · no negative marking', mcq: 0, num: 10, minutes: 30, exam: 'adv', neg: 0, negNum: false, minDifficulty: 2 },
];

const loadActive = () => { try { return JSON.parse(localStorage.getItem(ACTIVE_KEY) || 'null'); } catch { return null; } };
const saveActive = (m) => { try { m ? localStorage.setItem(ACTIVE_KEY, JSON.stringify(m)) : localStorage.removeItem(ACTIVE_KEY); } catch { /* ignore */ } };
let memoryActive = null; // fallback when storage is blocked
const getActive = () => loadActive() || memoryActive;
const setActive = (m) => { memoryActive = m; saveActive(m); };

// ───────── Paper construction
export function buildPaper(cfg, seed = randomSeed()) {
  const R = mulberry32(seed);
  const chapters = cfg.chapters?.length
    ? cfg.chapters.map((id) => chapterById[id]).filter(Boolean)
    : cfg.exam ? CHAPTERS.filter((c) => c.exams.includes(cfg.exam)) : examChapters();
  const used = new Set();
  const minD = cfg.minDifficulty || 1;
  const items = [];

  const pickFor = (ch, kind, salt) => {
    const curated = curatedFor(ch.id).filter((q) => !used.has(q.id) && q.difficulty >= minD && (kind === 'mcq' || q.type === 'num'));
    const gens = generatorsForChapter(ch.id).filter((g) => g.difficulty >= minD || minD === 1);
    const preferGen = gens.length && (R() < 0.45 || !curated.length);
    if (preferGen) {
      for (let t = 0; t < 6; t++) {
        const q = generate(pick(R, gens).id, (seed + salt * 2654435761 + t) >>> 0);
        if (used.has(q.id) || (kind === 'num' && q.type !== 'num')) continue;
        return q;
      }
    }
    if (curated.length) return pick(R, curated);
    return null;
  };

  const order = shuffle(R, chapters);
  let ci = 0, salt = 1;
  const fill = (kind, count) => {
    let guard = 0;
    let got = 0;
    while (got < count && guard++ < count * 40) {
      const ch = order[ci++ % order.length];
      const q = pickFor(ch, kind, salt++);
      if (!q) continue;
      used.add(q.id);
      items.push(kind === 'mcq' ? toMCQ(q, seed + salt) : q);
      got++;
    }
  };
  fill('mcq', cfg.mcq);
  fill('num', cfg.num);
  return items;
}

// ───────── Setup view
export function renderMockSetup(view, navigate) {
  const active = getActive();
  let sel = PRESETS[0].id;
  const custom = { mcq: 10, num: 5, minutes: 45, chapters: new Set(), neg: 1, negNum: true };
  const s = store.get();

  view.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Exam simulator</div><h1>Mock Tests</h1>
      <p class="muted">NTA-style interface: question palette, mark-for-review, countdown and a full analysis at the end.</p></div></div>
    ${active ? `<div class="card" style="border-color:var(--accent);margin-bottom:20px"><div class="row-between">
      <div><h3>Test in progress</h3><p class="muted small">${esc(active.cfg.title)} · ${fmtTime(Math.max(0, active.endsAt - Date.now()))} left</p></div>
      <div class="row"><button class="btn btn-ghost btn-danger" data-discard>Discard</button><a class="btn btn-primary" href="#/mock/run">Resume</a></div></div></div>` : ''}
    <div class="grid grid-2" id="presets">
      ${PRESETS.map((p) => `<button class="card preset ${p.id === sel ? 'on' : ''}" data-preset="${p.id}">
        <h3>${esc(p.title)}</h3><p class="muted small" style="margin-top:4px">${esc(p.desc)}</p></button>`).join('')}
      <button class="card preset" data-preset="custom"><h3>Custom test</h3><p class="muted small" style="margin-top:4px">Pick chapters, question mix and duration</p></button>
    </div>
    <div class="card section" id="customBox" hidden>
      <div class="grid grid-3">
        <label class="field">Single-correct questions<input type="number" min="0" max="60" value="${custom.mcq}" data-c="mcq"></label>
        <label class="field">Numerical questions<input type="number" min="0" max="30" value="${custom.num}" data-c="num"></label>
        <label class="field">Duration (minutes)<input type="number" min="5" max="180" value="${custom.minutes}" data-c="minutes"></label>
      </div>
      <label class="check" style="margin-top:12px"><input type="checkbox" checked data-c="negNum"> Negative marking (−1) applies to numerical questions too</label>
      <div class="row-between" style="margin-top:16px"><h3>Chapters</h3><div class="row"><button class="btn btn-sm" data-all>All</button><button class="btn btn-sm" data-none>None</button></div></div>
      <p class="faint small" style="margin:4px 0 8px">Leave all unticked to use every chapter for your exam filter.</p>
      <div class="chapter-picker">${CHAPTERS.map((c) => `<label class="check"><input type="checkbox" value="${c.id}"> ${esc(c.name)}</label>`).join('')}</div>
    </div>
    <div class="row section">
      <button class="btn btn-primary btn-lg" data-start>${ICONS.clock} Start test</button>
      <span class="faint small">Tip: the timer keeps running if you leave — you can resume from here.</span>
    </div>
    ${s.mocks.length ? `<div class="section"><div class="section-head"><h2>Past tests</h2></div><div class="card-flat table-scroll"><table class="data">
      <thead><tr><th>Date</th><th>Test</th><th class="n">Score</th><th class="n">Accuracy</th><th class="n">Time</th><th></th></tr></thead>
      <tbody>${s.mocks.map((m, i) => ({ m, i })).reverse().map(({ m, i }) => `<tr>
        <td>${new Date(m.ts).toLocaleDateString()}</td><td>${esc(m.title)}</td>
        <td class="n">${m.score} / ${m.max}</td><td class="n">${m.correct + m.wrong ? pct(m.correct / (m.correct + m.wrong)) : '—'}</td>
        <td class="n">${fmtTime(m.duration)}</td><td class="n"><a href="#/mock/result/${i}">Analysis</a></td></tr>`).join('')}</tbody></table></div></div>` : ''}`;

  $$('[data-preset]', view).forEach((b) => b.addEventListener('click', () => {
    sel = b.dataset.preset;
    $$('[data-preset]', view).forEach((x) => x.classList.toggle('on', x === b));
    $('#customBox', view).hidden = sel !== 'custom';
  }));
  $$('[data-c]', view).forEach((inp) => inp.addEventListener('input', () => {
    custom[inp.dataset.c] = inp.type === 'checkbox' ? inp.checked : Math.max(0, Number(inp.value) || 0);
  }));
  $$('.chapter-picker input', view).forEach((cb) => cb.addEventListener('change', () => {
    cb.checked ? custom.chapters.add(cb.value) : custom.chapters.delete(cb.value);
  }));
  $('[data-all]', view).addEventListener('click', () => $$('.chapter-picker input', view).forEach((cb) => { cb.checked = true; custom.chapters.add(cb.value); }));
  $('[data-none]', view).addEventListener('click', () => $$('.chapter-picker input', view).forEach((cb) => { cb.checked = false; custom.chapters.delete(cb.value); }));
  const discard = $('[data-discard]', view);
  if (discard) discard.addEventListener('click', () => { if (confirm('Discard the test in progress?')) { setActive(null); renderMockSetup(view, navigate); } });

  $('[data-start]', view).addEventListener('click', () => {
    if (getActive() && !confirm('Starting a new test will discard the one in progress. Continue?')) return;
    let cfg;
    if (sel === 'custom') {
      if (custom.mcq + custom.num < 1) return toast('Add at least one question');
      cfg = { id: 'custom', title: 'Custom test', mcq: Math.min(60, custom.mcq), num: Math.min(30, custom.num), minutes: Math.min(180, Math.max(5, custom.minutes)), chapters: [...custom.chapters], neg: 1, negNum: custom.negNum };
    } else cfg = { ...PRESETS.find((p) => p.id === sel) };
    const items = buildPaper(cfg);
    if (!items.length) return toast('No questions available for that selection');
    const now = Date.now();
    setActive({
      cfg, items, responses: items.map(() => null), visited: items.map((_, i) => i === 0), marked: items.map(() => false),
      times: items.map(() => 0), current: 0, startedAt: now, endsAt: now + cfg.minutes * 60000, lastTick: now,
    });
    navigate('#/mock/run');
  });
}

// ───────── Exam view
export function renderMockRun(view, navigate) {
  const m = getActive();
  if (!m) { navigate('#/mock'); return; }
  let tick = null;
  let paletteOpen = window.innerWidth > 1000;

  const status = (i) => {
    const ans = m.responses[i] != null && m.responses[i] !== '';
    return [m.visited[i] ? 'visited' : '', ans ? 'answered' : '', m.marked[i] ? 'marked' : '', i === m.current ? 'current' : ''].join(' ');
  };
  const persist = () => setActive(m);
  const accrue = () => { const now = Date.now(); m.times[m.current] += now - m.lastTick; m.lastTick = now; };

  function draw() {
    const i = m.current, q = m.items[i];
    const ch = chapterById[q.chapter];
    const counts = {
      answered: m.responses.filter((r) => r != null && r !== '').length,
      marked: m.marked.filter(Boolean).length,
    };
    view.innerHTML = `
      <div class="session-bar">
        <div class="session-title"><div style="min-width:0"><div class="eyebrow" style="margin:0">Mock test</div><h2>${esc(m.cfg.title)}</h2></div></div>
        <div class="row">
          <span class="timer" id="mtimer" aria-live="off">${ICONS.clock.replace('<svg', '<svg width="16" height="16"')}<span>--:--</span></span>
          <button class="btn btn-primary btn-sm" data-act="submit">Submit test</button>
        </div>
      </div>
      <div class="mock-layout">
        <article class="card">
          <div class="q-meta">
            <span class="chip chip-accent">Question ${i + 1} of ${m.items.length}</span>
            <span class="chip">${q.type === 'mcq' ? 'Single correct · +4 / −' + m.cfg.neg : 'Numerical · +4' + (m.cfg.negNum && m.cfg.neg ? ' / −' + m.cfg.neg : ' / 0')}</span>
            <span class="chip faint">${esc(ch.name)}</span>
          </div>
          <div class="q-text">${mathHTML(q.q)}</div>
          ${q.type === 'mcq' ? `<div class="options">${q.options.map((o, k) => `
            <button class="option ${m.responses[i] === k ? 'selected' : ''}" data-opt="${k}" aria-pressed="${m.responses[i] === k}"><span class="key">${'ABCD'[k]}</span><span>${mathHTML(o)}</span></button>`).join('')}</div>`
          : `<div class="num-input"><input id="numans" type="text" inputmode="decimal" autocomplete="off" placeholder="Enter a number (e.g. 12, -3.5, 7/3)" value="${esc(m.responses[i] ?? '')}" aria-label="Numerical answer"></div>`}
          <div class="q-actions">
            <div class="row">
              <button class="btn" data-act="prev" ${i === 0 ? 'disabled' : ''}>${ICONS.back} Prev</button>
              <button class="btn btn-ghost" data-act="clear">Clear</button>
            </div>
            <div class="row">
              <button class="btn" data-act="mark">${ICONS.flag} ${m.marked[i] ? 'Unmark' : 'Mark for review'} & next</button>
              <button class="btn btn-primary" data-act="savenext">${i === m.items.length - 1 ? 'Save' : 'Save & next'}</button>
            </div>
          </div>
        </article>
        <aside class="card palette-panel">
          <div class="row-between"><h3>Question palette</h3>
            <button class="btn btn-sm btn-ghost" data-act="togglepal" aria-expanded="${paletteOpen}">${paletteOpen ? 'Hide' : 'Show'}</button></div>
          <p class="small muted" style="margin-top:4px">${counts.answered} answered · ${counts.marked} marked · ${m.items.length - counts.answered} left</p>
          <div ${paletteOpen ? '' : 'hidden'}>
            <div class="palette">${m.items.map((_, k) => `<button class="pal ${status(k)}" data-jump="${k}" aria-label="Question ${k + 1}">${k + 1}</button>`).join('')}</div>
            <div class="legend">
              <span><i></i> Not visited</span>
              <span><i style="background:var(--bad-soft);border-color:var(--bad)"></i> Not answered</span>
              <span><i style="background:var(--good);border-color:var(--good)"></i> Answered</span>
              <span><i style="background:var(--review);border-color:var(--review);border-radius:50%"></i> Marked</span>
            </div>
          </div>
        </aside>
      </div>`;
    typeset(view);
    $$('[data-opt]', view).forEach((b) => b.addEventListener('click', () => {
      const k = Number(b.dataset.opt);
      m.responses[i] = m.responses[i] === k ? null : k; // click again to deselect
      persist(); draw();
    }));
    const inp = $('#numans', view);
    if (inp) inp.addEventListener('input', () => { m.responses[i] = inp.value.trim() || null; persist(); });
    $$('[data-jump]', view).forEach((b) => b.addEventListener('click', () => go(Number(b.dataset.jump))));
    $$('[data-act]', view).forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
    updateTimer();
  }

  function go(k) {
    accrue();
    m.current = Math.max(0, Math.min(m.items.length - 1, k));
    m.visited[m.current] = true;
    persist(); draw();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function act(a) {
    const i = m.current;
    if (a === 'prev') go(i - 1);
    else if (a === 'savenext') {
      const r = m.responses[i];
      if (m.items[i].type === 'num' && r != null && !Number.isFinite(parseAnswer(r))) return toast('That isn’t a valid number');
      if (i < m.items.length - 1) go(i + 1); else { persist(); toast('Saved'); draw(); }
    } else if (a === 'mark') { m.marked[i] = !m.marked[i]; if (i < m.items.length - 1) go(i + 1); else { persist(); draw(); } }
    else if (a === 'clear') { m.responses[i] = null; persist(); draw(); }
    else if (a === 'togglepal') { paletteOpen = !paletteOpen; draw(); }
    else if (a === 'submit') {
      const answered = m.responses.filter((r) => r != null && r !== '').length;
      if (confirm(`Submit test?\n\nAnswered: ${answered}\nNot answered: ${m.items.length - answered}\nMarked for review: ${m.marked.filter(Boolean).length}`)) submit();
    }
  }

  function updateTimer() {
    const left = m.endsAt - Date.now();
    const el = $('#mtimer', view);
    if (el) {
      el.querySelector('span').textContent = fmtTime(left);
      el.classList.toggle('urgent', left < 5 * 60000);
    }
    if (left <= 0) { toast('Time’s up — test submitted'); submit(); }
  }

  function submit() {
    clearInterval(tick);
    accrue();
    let score = 0, correct = 0, wrong = 0, skipped = 0;
    const perChapter = {};
    const items = m.items.map((q, i) => {
      const r = m.responses[i];
      const attempted = r != null && r !== '';
      const ok = attempted && (q.type === 'mcq' ? r === q.answer : answerMatches(r, q.answer));
      const neg = q.type === 'num' && !m.cfg.negNum ? 0 : m.cfg.neg;
      const marks = !attempted ? 0 : ok ? 4 : -neg;
      score += marks;
      if (!attempted) skipped++; else if (ok) correct++; else wrong++;
      const pc = (perChapter[q.chapter] ||= { correct: 0, wrong: 0, skipped: 0, score: 0 });
      pc.score += marks;
      if (!attempted) pc.skipped++; else if (ok) pc.correct++; else pc.wrong++;
      if (attempted) recordAttempt({ qid: q.id, chapter: q.chapter, correct: ok, time: m.times[i], mode: 'mock', difficulty: q.difficulty });
      return { q, response: r, correct: ok, attempted, marks, time: m.times[i] };
    });
    const result = {
      ts: Date.now(), title: m.cfg.title, score, max: m.items.length * 4, correct, wrong, skipped,
      duration: Math.min(Date.now(), m.endsAt) - m.startedAt, allotted: m.cfg.minutes * 60000, perChapter, items,
    };
    store.update((s) => { s.mocks.push(result); if (s.mocks.length > 50) s.mocks.shift(); });
    setActive(null);
    navigate(`#/mock/result/${store.get().mocks.length - 1}`);
  }

  function onKey(e) {
    if (e.target.tagName === 'INPUT' || e.metaKey || e.ctrlKey) return;
    const q = m.items[m.current];
    const k = e.key.toLowerCase();
    if (q.type === 'mcq') {
      const idx = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
      if (idx >= 0) { m.responses[m.current] = idx; persist(); draw(); return; }
    }
    if (k === 'arrowright') act('savenext');
    else if (k === 'arrowleft' && m.current > 0) act('prev');
  }

  document.addEventListener('keydown', onKey);
  draw();
  tick = setInterval(updateTimer, 1000);
  const onHide = () => { accrue(); persist(); };
  window.addEventListener('pagehide', onHide);
  return () => { clearInterval(tick); document.removeEventListener('keydown', onKey); window.removeEventListener('pagehide', onHide); if (getActive()) { accrue(); persist(); } };
}

// ───────── Result / analysis view
export function renderMockResult(view, idx) {
  const r = store.get().mocks[Number(idx)];
  if (!r) { view.innerHTML = `<div class="empty"><div class="big">📄</div><p>Result not found.</p></div>`; return; }
  const attempted = r.correct + r.wrong;
  const best = r.items.length ? r.items.reduce((a, b) => (b.time > a.time ? b : a)) : null;
  if (r.score / r.max >= 0.8 && Date.now() - r.ts < 5000) confetti();
  const rows = Object.entries(r.perChapter).map(([id, v]) => ({ id, ...v, n: v.correct + v.wrong + v.skipped })).sort((a, b) => b.score - a.score);
  const maxT = Math.max(1, ...r.items.map((x) => x.time));

  view.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">${esc(new Date(r.ts).toLocaleString())}</div><h1>${esc(r.title)} — Analysis</h1></div>
      <div class="row no-print"><a class="btn" href="#/mock">New test</a><button class="btn" onclick="window.print()">${ICONS.printer} Print</button></div></div>
    <div class="card result-hero">
      ${ring(Math.max(0, r.score) / r.max, { size: 150, stroke: 12, label: `${r.score}`, sub: `of ${r.max}` })}
      <div class="grid grid-4" style="gap:12px">
        <div class="stat"><span class="k">Correct</span><span class="v" style="color:var(--good)">${r.correct}</span><span class="s">+${r.correct * 4} marks</span></div>
        <div class="stat"><span class="k">Incorrect</span><span class="v" style="color:var(--bad)">${r.wrong}</span><span class="s">${r.items.filter((x) => x.attempted && !x.correct).reduce((s, x) => s + x.marks, 0)} marks</span></div>
        <div class="stat"><span class="k">Skipped</span><span class="v">${r.skipped}</span><span class="s">0 marks</span></div>
        <div class="stat"><span class="k">Accuracy</span><span class="v">${attempted ? pct(r.correct / attempted) : '—'}</span><span class="s">${fmtTime(r.duration)} of ${fmtTime(r.allotted)}</span></div>
      </div>
    </div>
    <div class="grid grid-2 section">
      <div class="card"><h3 style="margin-bottom:14px">By chapter</h3><div class="table-scroll"><table class="data">
        <thead><tr><th>Chapter</th><th class="n">✓</th><th class="n">✗</th><th class="n">–</th><th class="n">Marks</th></tr></thead>
        <tbody>${rows.map((x) => `<tr><td><a href="#/chapter/${x.id}">${esc(chapterById[x.id]?.name || x.id)}</a></td><td class="n">${x.correct}</td><td class="n">${x.wrong}</td><td class="n">${x.skipped}</td><td class="n"><b>${x.score}</b></td></tr>`).join('')}</tbody>
      </table></div></div>
      <div class="card"><h3 style="margin-bottom:4px">Time per question</h3>
        <p class="small muted" style="margin-bottom:14px">Avg ${fmtSecs(r.items.reduce((s, x) => s + x.time, 0) / Math.max(1, r.items.length))}${best ? ` · longest Q${r.items.indexOf(best) + 1} (${fmtSecs(best.time)})` : ''}</p>
        <div class="bars">${r.items.map((x, i) => `<div class="bar-row" style="grid-template-columns:36px 1fr 52px" title="Q${i + 1}: ${fmtSecs(x.time)} · ${x.attempted ? (x.correct ? 'correct' : 'incorrect') : 'skipped'}">
          <span class="label faint">Q${i + 1}</span><div class="bar-track"><div class="bar-fill" style="width:${(x.time / maxT) * 100}%;${x.attempted ? (x.correct ? '' : 'background:var(--bad)') : 'background:var(--border-strong)'}"></div></div>
          <span class="val">${fmtSecs(x.time)} ${x.attempted ? (x.correct ? '✓' : '✗') : '–'}</span></div>`).join('')}</div>
        <p class="tiny faint" style="margin-top:10px">Bar colour: blue = correct, red = incorrect, grey = skipped (also marked ✓ ✗ –).</p>
      </div>
    </div>
    <div class="section"><div class="section-head"><h2>Question review</h2>
      <div class="seg no-print" id="rf"><button class="on" data-f="all">All</button><button data-f="wrong">Incorrect</button><button data-f="skip">Skipped</button><button data-f="right">Correct</button></div></div>
      <div class="stack" id="rlist">${r.items.map((x, i) => `<details class="review-item" data-kind="${x.attempted ? (x.correct ? 'right' : 'wrong') : 'skip'}">
        <summary><span class="badge-dot ${x.attempted ? (x.correct ? 'good' : 'bad') : 'skip'}">${x.attempted ? (x.correct ? '✓' : '✗') : '–'}</span>
          <span class="review-q">Q${i + 1}. ${mathHTML(stripTex(x.q.q))}</span><span class="chip mono">${x.marks > 0 ? '+' : ''}${x.marks}</span></summary>
        <div class="body"><div class="q-text">${mathHTML(x.q.q)}</div>
          ${x.q.type === 'mcq' ? `<div class="options">${x.q.options.map((o, k) => `<div class="option ${k === x.q.answer ? 'correct' : k === x.response ? 'wrong' : ''}"><span class="key">${'ABCD'[k]}</span><span>${mathHTML(o)}</span></div>`).join('')}</div>`
          : `<p class="small" style="margin-top:12px">Your answer: <b>${esc(responseText(x.q, x.response))}</b> · Correct: <b>${mathHTML(correctText(x.q))}</b></p>`}
          <div class="feedback"><div class="feedback-title">Solution</div><div class="solution">${mathHTML(x.q.solution)}</div></div>
          <p class="tiny faint" style="margin-top:8px">${esc(chapterById[x.q.chapter]?.name || '')} · ${fmtSecs(x.time)} spent</p></div>
      </details>`).join('')}</div></div>`;
  typeset(view);
  $$('#rf button', view).forEach((b) => b.addEventListener('click', () => {
    $$('#rf button', view).forEach((x) => x.classList.toggle('on', x === b));
    $$('#rlist .review-item', view).forEach((d) => { d.hidden = b.dataset.f !== 'all' && d.dataset.kind !== b.dataset.f; });
  }));
}
