import { test } from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../js/data/questions.js';
import { CHAPTERS, UNITS, FLASHCARDS } from '../js/data/syllabus.js';
import { ALL_GENERATORS, generate, toMCQ, parseGeneratedId } from '../js/generators.js';
import { parseAnswer, answerMatches, nCr, fact, Frac, numTex } from '../js/lib/mathutil.js';
import { buildPaper, PRESETS } from '../js/mock.js';

let katex = null;
try { katex = (await import('katex')).default; } catch { /* optional dev dependency */ }

const chapterIds = new Set(CHAPTERS.map((c) => c.id));

// Split "text $math$ text $$display$$" into math segments and render each with KaTeX.
function texErrors(s) {
  if (!katex) return [];
  const errs = [];
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m;
  while ((m = re.exec(s))) {
    const tex = m[1] ?? m[2];
    try { katex.renderToString(tex, { throwOnError: true, displayMode: !!m[1], strict: 'ignore' }); }
    catch (e) { errs.push(`${tex} → ${e.message.split('\n')[0]}`); }
  }
  // An odd number of unescaped $ means a broken delimiter.
  const dollars = (s.match(/\$/g) || []).length;
  if (dollars % 2) errs.push(`odd number of $ in: ${s.slice(0, 80)}`);
  return errs;
}

function checkQuestion(q, where) {
  assert.ok(chapterIds.has(q.chapter), `${where}: unknown chapter ${q.chapter}`);
  assert.ok([1, 2, 3].includes(q.difficulty), `${where}: bad difficulty`);
  assert.ok(typeof q.q === 'string' && q.q.length > 5, `${where}: missing text`);
  assert.ok(typeof q.solution === 'string' && q.solution.length > 3, `${where}: missing solution`);
  const all = [q.q, q.solution, q.hint || '', ...(q.options || [])].join(' ');
  assert.ok(!/undefined|NaN|\[object/.test(all), `${where}: bad interpolation in ${all.slice(0, 120)}`);
  if (q.type === 'mcq') {
    assert.equal(q.options.length, 4, `${where}: needs 4 options`);
    assert.equal(new Set(q.options).size, 4, `${where}: duplicate options ${q.options}`);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4, `${where}: answer index`);
  } else {
    assert.equal(q.type, 'num', `${where}: type`);
    assert.ok(Number.isFinite(q.answer), `${where}: non-finite answer ${q.answer}`);
  }
  for (const s of [q.q, q.solution, q.hint || '', ...(q.options || [])]) {
    const errs = texErrors(s);
    assert.deepEqual(errs, [], `${where}: TeX errors`);
  }
}

test('syllabus is well-formed', () => {
  const unitIds = new Set(UNITS.map((u) => u.id));
  assert.equal(chapterIds.size, CHAPTERS.length, 'duplicate chapter ids');
  for (const c of CHAPTERS) {
    assert.ok(unitIds.has(c.unit), `${c.id}: unknown unit`);
    assert.ok(c.exams.length && c.exams.every((e) => ['main', 'adv', 'neet'].includes(e)), `${c.id}: exams`);
    assert.ok(c.notes.length >= 2, `${c.id}: needs notes`);
    assert.ok(c.formulas.length >= 3, `${c.id}: needs formulas`);
    c.notes.forEach((n) => assert.deepEqual(texErrors(n), [], `${c.id} note`));
    c.formulas.forEach((f) => assert.deepEqual(texErrors(`$${f.tex}$`), [], `${c.id} formula ${f.name}`));
  }
  assert.equal(new Set(FLASHCARDS.map((f) => f.id)).size, FLASHCARDS.length);
});

test('every chapter has at least 5 curated questions', () => {
  for (const c of CHAPTERS) {
    const n = QUESTIONS.filter((q) => q.chapter === c.id).length;
    assert.ok(n >= 5, `${c.id} has only ${n}`);
  }
});

test('curated questions are valid and render', () => {
  assert.equal(new Set(QUESTIONS.map((q) => q.id)).size, QUESTIONS.length, 'duplicate question ids');
  for (const q of QUESTIONS) checkQuestion(q, q.id);
});

test('curated numerical answers spot-check by independent computation', () => {
  const byId = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const expect = {
    sf2: 4 * 3 * 2, sf4: 2 ** 6, qd1: 25 - 12, sq1: 10 * (6 + 19 * 4), sq4: (10 * 11 * 21) / 6,
    pc1: fact(6) / (fact(3) * fact(2)), pc2: nCr(4, 2) * nCr(6, 3), pc3: (10 * 7) / 2, pc4: nCr(13, 3),
    pc5: 9 * 9 * 8 * 7, pc6: fact(4), bn1: nCr(6, 3) * 8, bn2: nCr(9, 3), bn4: nCr(8, 4), bn5: 2 ** 9,
    mt2: 16, mt3: 32, mt4: 7 + 22, ln1: Math.abs(6 + 12 - 8) / 5, cr1: Math.sqrt(4 + 9 + 12),
    td1: Math.hypot(3, 4, 12), vc2: 4 - 10 + 18, st1: 8, pb6: 10 * 0.3 * 0.7,
    tg6: Math.cos(Math.PI / 9) * Math.cos((2 * Math.PI) / 9) * Math.cos((4 * Math.PI) / 9),
    sq5: 1 - 1 / 100, cn2: 3 / 5, cn5: 10, dt1: 1 / 3, bm2: 3 * 0.301,
  };
  for (const [id, v] of Object.entries(expect)) {
    assert.ok(answerMatches(v, byId[id].answer, 1e-6), `${id}: stored ${byId[id].answer}, computed ${v}`);
  }
});

test('generators: 400 seeds each produce valid, deterministic questions', () => {
  for (const g of ALL_GENERATORS) {
    assert.ok(chapterIds.has(g.chapter), `${g.id}: chapter`);
    for (let seed = 1; seed <= 400; seed++) {
      const q = generate(g.id, seed * 7919);
      checkQuestion(q, `${g.id}#${seed}`);
      assert.deepEqual(parseGeneratedId(q.id), { genId: g.id, seed: seed * 7919 });
      if (seed <= 5) assert.deepEqual(generate(g.id, seed * 7919), q, `${g.id}: not deterministic`);
    }
  }
});

test('toMCQ converts numericals into valid 4-option questions', () => {
  const nums = [...QUESTIONS.filter((q) => q.type === 'num'), ...ALL_GENERATORS.map((g) => generate(g.id, 42)).filter((q) => q.type === 'num')];
  for (const q of nums) {
    for (const seed of [1, 2, 3]) {
      const m = toMCQ(q, seed);
      checkQuestion(m, `toMCQ(${q.id})`);
    }
  }
});

test('answer parsing accepts integers, decimals and fractions', () => {
  assert.equal(parseAnswer('12'), 12);
  assert.equal(parseAnswer(' -3.5 '), -3.5);
  assert.equal(parseAnswer('7/3'), 7 / 3);
  assert.equal(parseAnswer('.5'), 0.5);
  assert.ok(Number.isNaN(parseAnswer('abc')));
  assert.ok(Number.isNaN(parseAnswer('1/0')));
  assert.ok(answerMatches('0.33', 1 / 3));
  assert.ok(answerMatches('1/3', 1 / 3));
  assert.ok(!answerMatches('0.3', 1 / 3));
  assert.ok(answerMatches('-8', -8));
  assert.ok(!answerMatches('8', -8));
});

test('fractions format exactly', () => {
  assert.equal(new Frac(6, -8).tex(), '-\\dfrac{3}{4}');
  assert.equal(numTex(0.6), '\\dfrac{3}{5}');
  assert.equal(numTex(5), '5');
});

test('mock presets build full papers', () => {
  for (const p of PRESETS) {
    const items = buildPaper(p, 12345);
    assert.equal(items.length, p.mcq + p.num, `${p.id}: got ${items.length}`);
    assert.equal(items.filter((q) => q.type === 'mcq').length, p.mcq, `${p.id}: mcq count`);
    assert.equal(new Set(items.map((q) => q.id)).size, items.length, `${p.id}: duplicate questions`);
    if (p.exam) items.forEach((q) => assert.ok(CHAPTERS.find((c) => c.id === q.chapter).exams.includes(p.exam), `${p.id}: off-syllabus ${q.chapter}`));
    items.forEach((q, i) => checkQuestion(q, `${p.id}[${i}]`));
  }
});

test('KaTeX validation ran', { skip: !!katex ? false : 'katex not installed (npm i)' }, () => {
  assert.ok(katex);
});
