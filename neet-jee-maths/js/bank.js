// Unified access to curated + generated questions, filtered by exam.
import { QUESTIONS, questionById } from './data/questions.js';
import { CHAPTERS, chapterById } from './data/syllabus.js';
import { generate, parseGeneratedId, generatorsForChapter, ALL_GENERATORS } from './generators.js';
import { mulberry32, hashString, shuffle, pick } from './lib/mathutil.js';
import { store } from './store.js';

export function getQuestion(id) {
  if (questionById[id]) return questionById[id];
  const g = parseGeneratedId(id);
  return g ? generate(g.genId, g.seed) : null;
}

export function examChapters(exam = store.get().settings.exam) {
  return exam === 'all' ? CHAPTERS : CHAPTERS.filter((c) => c.exams.includes(exam));
}

export const curatedFor = (chapterId) => QUESTIONS.filter((q) => q.chapter === chapterId);
export const randomSeed = () => (Math.random() * 2 ** 31) >>> 0;

export function generatedFor(chapterId, seed = randomSeed(), { numOnly = false } = {}) {
  let gens = generatorsForChapter(chapterId);
  if (!gens.length) return null;
  const R = mulberry32(seed);
  for (let tries = 0; tries < 8; tries++) {
    const g = pick(R, gens);
    const q = generate(g.id, (seed + tries * 7919) >>> 0);
    if (!numOnly || q.type === 'num') return q;
  }
  return null;
}

export function chapterHasContent(chapterId) {
  return curatedFor(chapterId).length > 0 || generatorsForChapter(chapterId).length > 0;
}

// Five questions a day, the same for everyone on that date (per exam filter).
export function dailyChallenge(date) {
  const exam = store.get().settings.exam;
  const R = mulberry32(hashString(`daily:${date}:${exam}`));
  const chapters = shuffle(R, examChapters(exam)).slice(0, 5);
  return chapters.map((c, i) => {
    const pool = curatedFor(c.id);
    const useGen = generatorsForChapter(c.id).length && (R() < 0.5 || !pool.length);
    if (useGen) return generatedFor(c.id, (hashString(date) + i * 104729) >>> 0);
    return pool[Math.floor(R() * pool.length)];
  }).filter(Boolean);
}

export { chapterById, CHAPTERS, ALL_GENERATORS, generatorsForChapter };
