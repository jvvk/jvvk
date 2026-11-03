import { $, $$, esc, mathHTML, typeset, confetti, ICONS } from './ui.js';
import { store, reviewCard, dueCards, nextIntervalLabel, today } from './store.js';
import { FLASHCARDS, chapterById } from './data/syllabus.js';
import { examChapters } from './bank.js';

export function cardsForExam() {
  const ids = new Set(examChapters().map((c) => c.id));
  return FLASHCARDS.filter((c) => ids.has(c.chapter));
}

export function renderCards(view, chapterId) {
  const cram = !!chapterId;
  const pool = cram ? FLASHCARDS.filter((c) => c.chapter === chapterId) : cardsForExam();
  let queue = cram ? [...pool] : dueCards(pool);
  let flipped = false;
  let reviewed = 0;
  const title = cram ? `${chapterById[chapterId]?.name || 'Chapter'} — formula cards` : 'Formula Flashcards';

  function draw() {
    const card = queue[0];
    const srs = store.get().srs;
    const learned = pool.filter((c) => srs[c.id] && srs[c.id].reps > 0).length;
    if (!card) {
      if (reviewed) confetti();
      const nextDue = pool.map((c) => srs[c.id]?.due).filter((d) => d && d > today()).sort()[0];
      view.innerHTML = `
        <div class="page-head"><div><div class="eyebrow">Spaced repetition</div><h1>${esc(title)}</h1></div></div>
        <div class="card empty"><div class="big">🎉</div><h2>All caught up</h2>
          <p class="muted" style="margin-top:8px">${reviewed ? `You reviewed ${reviewed} card${reviewed === 1 ? '' : 's'}. ` : ''}${nextDue ? `Next review due ${nextDue}.` : ''}</p>
          <p class="muted small" style="margin-top:4px">${learned} of ${pool.length} formulas in your rotation.</p>
          <div class="row" style="justify-content:center;margin-top:18px">
            <a class="btn" href="#/syllabus">Browse chapters</a><a class="btn btn-primary" href="#/practice/smart">Smart Practice</a></div></div>`;
      return;
    }
    const isNew = !srs[card.id];
    view.innerHTML = `
      <div class="page-head"><div><div class="eyebrow">${cram ? 'Cram mode — every card in this chapter' : 'Spaced repetition · due today'}</div><h1>${esc(title)}</h1></div>
        <div class="row"><span class="chip mono">${queue.length} left</span>${isNew ? '<span class="chip chip-accent">New</span>' : ''}</div></div>
      <div class="flash-wrap">
        <div class="flash ${flipped ? 'flipped' : ''}" id="flash" tabindex="0" role="button" aria-label="Flip card (Space)">
          <div class="flash-face"><span class="chip">${esc(chapterById[card.chapter]?.name || '')}</span>
            <div class="front-text">${esc(card.front)}</div><span class="faint small">Recall the formula, then tap or press <kbd>Space</kbd></span></div>
          <div class="flash-face flash-back"><span class="chip">${esc(card.front)}</span><div class="back-tex">${mathHTML('$$' + card.back + '$$')}</div></div>
        </div>
      </div>
      <div class="grade-row" ${flipped ? '' : 'style="visibility:hidden"'}>
        <button class="btn grade-again" data-g="0">Again<small>${nextIntervalLabel(card.id, 0)} · 1</small></button>
        <button class="btn" data-g="1">Hard<small>${nextIntervalLabel(card.id, 1)} · 2</small></button>
        <button class="btn" data-g="2">Good<small>${nextIntervalLabel(card.id, 2)} · 3</small></button>
        <button class="btn grade-easy" data-g="3">Easy<small>${nextIntervalLabel(card.id, 3)} · 4</small></button>
      </div>`;
    typeset(view);
    $('#flash', view).addEventListener('click', flip);
    $$('[data-g]', view).forEach((b) => b.addEventListener('click', () => grade(Number(b.dataset.g))));
  }

  function flip() { flipped = !flipped; $('#flash', view).classList.toggle('flipped', flipped); $('.grade-row', view).style.visibility = flipped ? 'visible' : 'hidden'; }

  function grade(g) {
    if (!flipped) return;
    const card = queue.shift();
    reviewCard(card.id, g);
    reviewed++;
    if (g === 0) queue.splice(Math.min(queue.length, 3), 0, card); // see it again soon
    flipped = false;
    draw();
  }

  function onKey(e) {
    if (e.target.tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (queue.length) flip(); }
    const n = '1234'.indexOf(e.key);
    if (n >= 0 && flipped) grade(n);
  }
  document.addEventListener('keydown', onKey);
  draw();
  return () => document.removeEventListener('keydown', onKey);
}
