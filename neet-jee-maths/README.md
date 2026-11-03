# Ganit — JEE & NEET Maths

A fast, local-first web app for **JEE Main, JEE Advanced and NEET** maths preparation.
It's a plain static site with no build step, no backend and no sign-in. Progress stays in the learner's browser.

## Features

| | |
|---|---|
| **Syllabus map** | 22 chapters in 7 units (Algebra, Trigonometry, Calculus, Coordinate Geometry, Vectors & 3D, Statistics & Probability, Maths Toolkit for Physics). Filter by exam and search across topics and formulas. |
| **Concept notes & formula sheets** | Short key ideas plus 100+ formulas typeset with KaTeX. The sheets are printable. |
| **Curated question bank** | 120+ original questions, MCQ and numerical-value, each with a step-by-step solution and an optional hint. |
| **Unlimited generated practice** | 31 seeded generators (quadratics, binomial, determinants, limits, conics, probability…) make fresh problems with exact solutions. Every generated question can be reproduced from its seed, so it can be bookmarked and reviewed later. |
| **Smart Practice** | Adaptive mode. It weights chapters by how weak you are in them and how much you've practised them. |
| **NTA-style mock tests** | JEE Main maths section (20 MCQ + 5 numerical, 60 min), Quick 10, NEET drill, Advanced sprint, or a custom test. The test screen has a question palette, mark-for-review and a countdown with auto-submit. A test in progress survives a page refresh. Afterwards you get a per-chapter and per-question analysis with solutions. |
| **Spaced-repetition flashcards** | Every formula is a card, scheduled with an SM-2-style algorithm (Again / Hard / Good / Easy). |
| **Analytics** | Accuracy, chapter mastery, accuracy by difficulty, mock score trend and a 20-week activity heatmap. |
| **Notebook** | Questions you got wrong stay here until you get them right; bookmarks sit alongside them. |
| **Daily challenge, streaks, daily goal** | Five new questions every day. |
| **Polish** | Light and dark themes, keyboard shortcuts (A–D / 1–4, Enter, H, B, S), mobile tab bar, offline PWA, export/import of progress. |

Numerical answers can be typed as integers, decimals or fractions (`7/3`). An answer is accepted if it matches when rounded to two decimal places, which is the JEE convention.

## Run locally

```bash
npm start            # serves on http://localhost:8080 (python3 -m http.server)
```

Any static file server works. ES modules don't load from `file://`, so opening `index.html` directly won't work.

## Tests

```bash
npm install          # dev-only: KaTeX, used to validate every TeX string
npm test
```

The tests check:
- the syllabus and question schemas, and that every chapter has at least 5 questions
- that every question, option, solution, hint, note and formula renders in KaTeX
- curated numerical answers against an independent computation (spot checks)
- 400 seeds of every generator: valid, deterministic, no `NaN`/`undefined`
- that numerical questions convert cleanly to 4-option MCQs for mock tests
- that every mock preset builds a full paper, with no duplicates and only on-syllabus chapters

## Deploy

It's fully static, so GitHub Pages works as is. In **Settings → Pages**, pick the branch and the root folder (or whichever folder holds `index.html`).

## Project layout

```
index.html            app shell
css/styles.css        design tokens (light/dark), layout, components
js/app.js             router, dashboard, syllabus, chapter, notebook, settings
js/practice.js        practice sessions (smart, chapter, generator, mistakes, bookmarks, daily)
js/mock.js            paper builder, exam interface, result analysis
js/cards.js           spaced-repetition flashcards
js/analytics.js       stats, heatmap, charts
js/generators.js      procedural question generators + numerical→MCQ conversion
js/store.js           localStorage persistence, mastery, streaks, SM-2 scheduling
js/bank.js            unified access to curated + generated questions
js/data/syllabus.js   units, chapters, notes, formulas
js/data/questions.js  curated question bank
sw.js                 offline cache
```

## Adding content

- **A question:** add an `mcq(...)` or `num(...)` entry to `js/data/questions.js`, then run `npm test`.
- **A generator:** add an object with `id`, `chapter`, `name`, `difficulty` and a `make(R)` function to `js/generators.js`. `make` must use only the seeded `R` for randomness. The tests pick it up automatically.
