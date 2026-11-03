import { $, $$, esc, mathHTML, typeset, toast, confetti, ICONS, diffDots, diffName, fmtTime, fmtSecs, pct } from './ui.js';
import { store, recordAttempt, toggleBookmark, isBookmarked, chapterStats, mistakeIds, today } from './store.js';
import {
  getQuestion, curatedFor, generatedFor, examChapters, chapterById, dailyChallenge, randomSeed,
  generatorsForChapter,
} from './bank.js';
import { generate, generatorById } from './generators.js';
import { answerMatches, parseAnswer, numTex, shuffle, mulberry32 } from './lib/mathutil.js';

// ───────── Session sources
function buildSession(mode, arg) {
  const seen = new Set();
  const lastResult = new Map(); // qid → last correct?
  for (const a of store.get().attempts) lastResult.set(a.qid, a.correct);

  if (mode === 'chapter') {
    const ch = chapterById[arg];
    if (!ch) return null;
    const R = mulberry32(randomSeed());
    const pool = shuffle(R, curatedFor(arg));
    // Unseen first, then previously wrong, then previously right.
    const rank = (q) => (!lastResult.has(q.id) ? 0 : lastResult.get(q.id) ? 2 : 1);
    pool.sort((a, b) => rank(a) - rank(b) || a.difficulty - b.difficulty);
    const hasGen = generatorsForChapter(arg).length > 0;
    let n = 0;
    return {
      title: ch.name, sub: 'Chapter practice', infinite: hasGen,
      next() {
        n++;
        if (hasGen && (pool.length === 0 || n % 3 === 0)) return generatedFor(arg);
        return pool.shift() || null;
      },
    };
  }

  if (mode === 'gen') {
    const g = generatorById[arg];
    if (!g) return null;
    return {
      title: g.name, sub: `${chapterById[g.chapter].name} · unlimited`, infinite: true,
      next: () => generate(g.id, randomSeed()),
    };
  }

  if (mode === 'smart') {
    return {
      title: 'Smart Practice', sub: 'Adaptive — targets your weakest chapters', infinite: true,
      next() {
        const chapters = examChapters();
        const weights = chapters.map((c) => {
          const s = chapterStats(c.id);
          return (s.attempts === 0 ? 0.9 : 1 - s.mastery) + 0.1;
        });
        const total = weights.reduce((a, b) => a + b, 0);
        let x = Math.random() * total, ch = chapters[0];
        for (let i = 0; i < chapters.length; i++) { x -= weights[i]; if (x <= 0) { ch = chapters[i]; break; } }
        const fresh = curatedFor(ch.id).filter((q) => !seen.has(q.id) && lastResult.get(q.id) !== true);
        if (fresh.length && (Math.random() < 0.6 || !generatorsForChapter(ch.id).length)) {
          return fresh[Math.floor(Math.random() * fresh.length)];
        }
        return generatedFor(ch.id) || curatedFor(ch.id)[Math.floor(Math.random() * curatedFor(ch.id).length)];
      },
    };
  }

  const listSession = (title, sub, ids) => {
    const queue = ids.map(getQuestion).filter(Boolean);
    return { title, sub, infinite: false, total: queue.length, next: () => queue.shift() || null };
  };
  if (mode === 'mistakes') return listSession('Mistakes Review', 'Questions you last got wrong', shuffle(Math.random, mistakeIds()));
  if (mode === 'bookmarks') return listSession('Bookmarked', 'Your saved questions', [...store.get().bookmarks]);
  if (mode === 'daily') {
    const qs = dailyChallenge(today());
    return { title: 'Daily Challenge', sub: new Date().toDateString(), infinite: false, total: qs.length, daily: true, next: () => qs.shift() || null };
  }
  if (mode === 'q') return listSession('Question', 'Single question', [arg]);
  return null;
}

// ───────── View
export function renderPractice(view, mode, arg) {
  const session = buildSession(mode, decodeURIComponent(arg || ''));
  if (!session) {
    view.innerHTML = `<div class="empty"><div class="big">🤔</div><p>That practice set doesn't exist.</p><p style="margin-top:12px"><a class="btn" href="#/syllabus">Browse chapters</a></p></div>`;
    return;
  }
  const history = []; // {q, response, correct, time, checked, hint}
  let cur = null;
  let tick = null;
  const startedAt = Date.now();

  function loadNext() {
    const q = session.next();
    if (!q) return finish();
    cur = { q, response: null, correct: null, checked: false, hint: false, start: Date.now(), time: 0 };
    history.push(cur);
    draw();
  }

  function finish() {
    clearInterval(tick);
    const done = history.filter((h) => h.checked);
    const correct = done.filter((h) => h.correct).length;
    if (session.daily && done.length && correct === done.length) confetti();
    view.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">${esc(session.sub)}</div><h1>Session complete</h1></div></div>
      <div class="grid grid-4">
        <div class="card stat"><span class="k">Answered</span><span class="v">${done.length}</span></div>
        <div class="card stat"><span class="k">Correct</span><span class="v">${correct}</span></div>
        <div class="card stat"><span class="k">Accuracy</span><span class="v">${done.length ? pct(correct / done.length) : '—'}</span></div>
        <div class="card stat"><span class="k">Time</span><span class="v">${fmtTime(Date.now() - startedAt)}</span></div>
      </div>
      ${done.length ? `<div class="section"><div class="section-head"><h2>Review</h2></div><div class="stack">${done.map((h, i) => reviewItem(h, i)).join('')}</div></div>` : ''}
      <div class="row section">
        ${mode === 'daily' ? '' : `<a class="btn btn-primary" href="#/practice/${mode}/${encodeURIComponent(arg || '')}" data-restart>Practice again</a>`}
        <a class="btn" href="#/">Dashboard</a>
        <a class="btn" href="#/analytics">See analytics</a>
      </div>`;
    const restart = $('[data-restart]', view);
    if (restart) restart.addEventListener('click', (e) => { e.preventDefault(); renderPractice(view, mode, arg); });
    typeset(view);
  }

  function reviewItem(h, i) {
    return `<details class="review-item">
      <summary><span class="badge-dot ${h.correct ? 'good' : 'bad'}">${h.correct ? '✓' : '✗'}</span>
        <span class="review-q">${i + 1}. ${mathHTML(stripTex(h.q.q))}</span>
        <span class="chip">${esc(chapterById[h.q.chapter]?.name || '')}</span></summary>
      <div class="body"><div class="q-text">${mathHTML(h.q.q)}</div>
        <p class="small muted" style="margin:10px 0">Your answer: <b>${esc(responseText(h.q, h.response))}</b> · Correct: <b>${mathHTML(correctText(h.q))}</b></p>
        <div class="solution">${mathHTML(h.q.solution)}</div></div>
    </details>`;
  }

  function draw() {
    const { q } = cur;
    const ch = chapterById[q.chapter];
    const answered = history.filter((h) => h.checked);
    const right = answered.filter((h) => h.correct).length;
    const pos = history.length;
    const bm = isBookmarked(q.id);
    view.innerHTML = `
      <div class="session-bar">
        <div class="session-title">
          <a class="btn btn-ghost icon-btn" href="#/" aria-label="Exit session">${ICONS.back}</a>
          <div style="min-width:0"><div class="eyebrow" style="margin:0">${esc(session.sub)}</div><h2>${esc(session.title)}</h2></div>
        </div>
        <div class="row">
          <span class="chip mono">${session.total ? `${pos} / ${session.total}` : `Q${pos}`}</span>
          <span class="chip chip-good mono">${right}/${answered.length} correct</span>
          <span class="timer" id="qtimer">${ICONS.clock.replace('<svg', '<svg width="16" height="16"')}<span>0:00</span></span>
          <button class="btn btn-sm" data-act="end">End</button>
        </div>
      </div>
      ${session.total ? `<div class="progress" style="margin-bottom:18px;max-width:820px"><span style="width:${((pos - 1) / session.total) * 100}%"></span></div>` : ''}
      <article class="card q-card">
        <div class="q-meta">
          <a class="chip chip-accent" href="#/chapter/${ch.id}">${esc(ch.name)}</a>
          <span class="chip">${diffDots(q.difficulty)} ${diffName(q.difficulty)}</span>
          <span class="chip">${q.type === 'mcq' ? 'Single correct' : 'Numerical value'}</span>
          ${q.generated ? `<span class="chip" title="Freshly generated — unlimited practice">${ICONS.infinity.replace('<svg', '<svg width="14" height="14"')} Generated</span>` : ''}
          <span style="flex:1"></span>
          <button class="btn btn-ghost icon-btn ${bm ? 'on' : ''}" data-act="bookmark" aria-pressed="${bm}" aria-label="Bookmark (B)" title="Bookmark (B)">${bm ? ICONS.bookmarkFill : ICONS.bookmark}</button>
        </div>
        <div class="q-text" id="qtext">${mathHTML(q.q)}</div>
        ${q.type === 'mcq' ? `<div class="options" role="radiogroup">${q.options.map((o, i) => `
          <button class="option" role="radio" aria-checked="false" data-opt="${i}"><span class="key">${'ABCD'[i]}</span><span>${mathHTML(o)}</span></button>`).join('')}</div>`
        : `<div class="num-input"><input id="numans" type="text" inputmode="decimal" autocomplete="off" placeholder="Your answer, e.g. 12, -3, 0.75 or 7/3" aria-label="Numerical answer" /></div>`}
        <div id="hintbox"></div>
        <div id="feedback"></div>
        <div class="q-actions">
          <div class="row">
            ${q.hint ? `<button class="btn btn-ghost" data-act="hint">${ICONS.bulb} Hint</button>` : ''}
            <button class="btn btn-ghost" data-act="skip">Skip</button>
          </div>
          <div class="row">
            <button class="btn btn-primary" data-act="check" disabled>Check <kbd style="background:transparent;color:inherit;border-color:currentColor;opacity:.7">↵</kbd></button>
          </div>
        </div>
        <div class="shortcuts no-print"><span><kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> choose</span><span><kbd>Enter</kbd> check / next</span><span><kbd>H</kbd> hint</span><span><kbd>B</kbd> bookmark</span><span><kbd>S</kbd> skip</span></div>
      </article>`;
    typeset(view);
    wire();
    clearInterval(tick);
    const tEl = $('#qtimer span', view);
    tick = setInterval(() => { if (!cur.checked && tEl.isConnected) tEl.textContent = fmtTime(Date.now() - cur.start); }, 1000);
    const input = $('#numans', view);
    if (input) setTimeout(() => input.focus(), 30);
  }

  function wire() {
    $$('[data-opt]', view).forEach((b) => b.addEventListener('click', () => select(Number(b.dataset.opt))));
    const input = $('#numans', view);
    if (input) input.addEventListener('input', () => {
      cur.response = input.value;
      $('[data-act="check"]', view).disabled = !input.value.trim();
    });
    view.querySelectorAll('[data-act]').forEach((b) => b.addEventListener('click', () => act(b.dataset.act)));
  }

  function select(i) {
    if (cur.checked || cur.q.type !== 'mcq') return;
    cur.response = i;
    $$('[data-opt]', view).forEach((b) => {
      const on = Number(b.dataset.opt) === i;
      b.classList.toggle('selected', on);
      b.setAttribute('aria-checked', String(on));
    });
    $('[data-act="check"]', view).disabled = false;
  }

  function act(a) {
    if (a === 'end') return finish();
    if (a === 'bookmark') {
      const on = toggleBookmark(cur.q.id);
      toast(on ? 'Bookmarked' : 'Bookmark removed');
      const b = $('[data-act="bookmark"]', view);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      b.innerHTML = on ? ICONS.bookmarkFill : ICONS.bookmark;
      return;
    }
    if (a === 'hint') {
      if (!cur.q.hint) return;
      cur.hint = true;
      const box = $('#hintbox', view);
      box.innerHTML = `<div class="hint-box"><b>Hint.</b> ${mathHTML(cur.q.hint)}</div>`;
      typeset(box);
      return;
    }
    if (a === 'skip') { history.pop(); return loadNext(); }
    if (a === 'next') return loadNext();
    if (a === 'check') return check();
  }

  function check() {
    if (cur.checked || cur.response == null || cur.response === '') return;
    const { q } = cur;
    if (q.type === 'num' && !Number.isFinite(parseAnswer(cur.response))) {
      toast('Enter a number like 12, -3.5 or 7/3');
      return;
    }
    cur.checked = true;
    cur.time = Date.now() - cur.start;
    cur.correct = q.type === 'mcq' ? cur.response === q.answer : answerMatches(cur.response, q.answer);
    recordAttempt({ qid: q.id, chapter: q.chapter, correct: cur.correct, time: cur.time, mode, difficulty: q.difficulty });

    if (q.type === 'mcq') {
      $$('[data-opt]', view).forEach((b) => {
        const i = Number(b.dataset.opt);
        b.disabled = true;
        b.classList.remove('selected');
        if (i === q.answer) b.classList.add('correct');
        else if (i === cur.response) b.classList.add('wrong');
      });
    } else {
      const box = $('.num-input', view);
      box.classList.add(cur.correct ? 'correct' : 'wrong');
      $('#numans', view).readOnly = true;
    }
    const fb = $('#feedback', view);
    fb.innerHTML = `<div class="feedback ${cur.correct ? 'good' : 'bad'}">
      <div class="feedback-title">${cur.correct ? ICONS.check.replace('<svg', '<svg width="18" height="18"') + ' Correct' : ICONS.x.replace('<svg', '<svg width="18" height="18"') + ' Not quite'}
        <span class="faint small" style="font-weight:500;margin-left:auto">${fmtSecs(cur.time)}</span></div>
      ${!cur.correct ? `<p style="margin-bottom:8px">Answer: <b>${mathHTML(correctText(q))}</b></p>` : ''}
      <div class="solution">${mathHTML(q.solution)}</div>
    </div>`;
    typeset(fb);
    const btn = $('[data-act="check"]', view);
    btn.outerHTML = `<button class="btn btn-primary" data-act="next">Next ${ICONS.next}</button>`;
    $('[data-act="next"]', view).addEventListener('click', () => act('next'));
    $('[data-act="next"]', view).focus();
    const skip = $('[data-act="skip"]', view);
    if (skip) skip.remove();
    const goal = store.get().settings.dailyGoal;
    const todayN = store.get().attempts.filter((x) => today(new Date(x.ts)) === today()).length;
    if (todayN === goal) { confetti(); toast(`Daily goal of ${goal} reached!`); }
  }

  function onKey(e) {
    if (!cur || !view.isConnected || e.metaKey || e.ctrlKey || e.altKey) return;
    const inInput = e.target.tagName === 'INPUT';
    const k = e.key.toLowerCase();
    if (k === 'enter') {
      e.preventDefault();
      if (cur.checked) act('next'); else check();
      return;
    }
    if (inInput) return;
    if (cur.q.type === 'mcq' && !cur.checked) {
      const idx = 'abcd'.indexOf(k) >= 0 ? 'abcd'.indexOf(k) : '1234'.indexOf(k);
      if (idx >= 0 && idx < cur.q.options.length) { select(idx); return; }
    }
    if (k === 'h') act('hint');
    else if (k === 'b') act('bookmark');
    else if (k === 's' && !cur.checked) act('skip');
  }
  document.addEventListener('keydown', onKey);
  loadNext();
  return () => { document.removeEventListener('keydown', onKey); clearInterval(tick); };
}

// ───────── Shared text helpers
export function stripTex(s) {
  // Short plain-ish preview for summaries (keeps inline math; KaTeX renders it).
  if (s.length <= 140) return s;
  let t = s.slice(0, 137);
  if ((t.match(/\$/g) || []).length % 2) t = t.slice(0, t.lastIndexOf('$'));
  return t + '…';
}
export function correctText(q) {
  return q.type === 'mcq' ? `${'ABCD'[q.answer]}. ${q.options[q.answer]}` : `$${numTex(q.answer)}$${Number.isInteger(q.answer) ? '' : ` (≈ ${+q.answer.toFixed(2)})`}`;
}
export function responseText(q, resp) {
  if (resp == null || resp === '') return '—';
  return q.type === 'mcq' ? 'ABCD'[resp] : String(resp);
}
