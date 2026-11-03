// Procedural question generators: unlimited fresh practice, correct by construction.
// A generated question is reproducible from (generatorId, seed), so it can be bookmarked
// and reviewed later: id = "g:<generatorId>:<seed>".
import {
  mulberry32, randInt, pick, sign, nonZero, shuffle, Frac, numTex, poly, signed, par,
  fact, nCr, nPr, gcd,
} from './lib/mathutil.js';

const r = String.raw;
const ordinal = (n) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');

const GENERATORS = [
  // ───────── Sets & functions
  {
    id: 'sf-count', chapter: 'sets-functions', name: 'Counting functions & relations', difficulty: 1,
    make(R) {
      const m = randInt(R, 2, 4), n = randInt(R, m, 5);
      const kind = pick(R, ['all', 'oneone', 'rel']);
      if (kind === 'all') return {
        q: r`$|A|=${m}$ and $|B|=${n}$. How many functions are there from $A$ to $B$?`,
        answer: n ** m,
        solution: r`Each of the ${m} elements of $A$ independently picks one of ${n} images: $${n}^{${m}}=${n ** m}$.`,
      };
      if (kind === 'oneone') return {
        q: r`$|A|=${m}$ and $|B|=${n}$. How many one-one functions are there from $A$ to $B$?`,
        answer: nPr(n, m),
        solution: r`Distinct images in order: $\,{}^{${n}}P_{${m}}=\dfrac{${n}!}{${n - m}!}=${nPr(n, m)}$.`,
      };
      return {
        q: r`$|A|=${m}$ and $|B|=${n}$. How many relations are there from $A$ to $B$?`,
        answer: 2 ** (m * n),
        solution: r`A relation is any subset of $A\times B$, which has $${m}\cdot${n}=${m * n}$ elements: $2^{${m * n}}=${2 ** (m * n)}$.`,
      };
    },
  },
  // ───────── Complex numbers
  {
    id: 'cx-mod', chapter: 'complex', name: 'Modulus of a product', difficulty: 1,
    make(R) {
      const T = [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [1, 0, 1], [0, 2, 2]];
      const [a, b, p] = pick(R, T), [c, d, q] = pick(R, T);
      const cplx = (x, y) => {
        if (y === 0) return String(x);
        const yi = Math.abs(y) === 1 ? 'i' : `${Math.abs(y)}i`;
        if (x === 0) return (y < 0 ? '-' : '') + yi;
        return `${x} ${y < 0 ? '-' : '+'} ${yi}`;
      };
      const z1 = cplx(a * sign(R), b * sign(R));
      const z2 = cplx(c * sign(R), d * sign(R));
      return {
        q: r`Find $|z_1z_2|$ where $z_1=${z1}$ and $z_2=${z2}$.`,
        answer: p * q,
        solution: r`$|z_1z_2|=|z_1|\,|z_2|=\sqrt{${a}^2+${b}^2}\cdot\sqrt{${c}^2+${d}^2}=${p}\cdot${q}=${p * q}$.`,
        hint: r`Don't multiply out — moduli multiply.`,
      };
    },
  },
  {
    id: 'cx-ipow', chapter: 'complex', name: 'Powers of i', difficulty: 1,
    make(R) {
      const a = randInt(R, 10, 999), b = randInt(R, 10, 999);
      const val = (n) => [[1, 0], [0, 1], [-1, 0], [0, -1]][n % 4];
      const [x1, y1] = val(a), [x2, y2] = val(b);
      const re = x1 + x2, im = y1 + y2;
      const fmt = (re, im) => {
        if (re === 0 && im === 0) return '0';
        const imPart = im === 0 ? '' : (im === 1 ? 'i' : im === -1 ? '-i' : `${im}i`);
        if (re === 0) return imPart;
        if (im === 0) return String(re);
        return `${re}${im > 0 ? '+' : ''}${imPart}`;
      };
      const correct = fmt(re, im);
      const pool = ['0', '2', '-2', '2i', '-2i', '1+i', '1-i', '-1+i', '-1-i'].filter((s) => s !== correct);
      const opts = shuffle(R, [correct, ...shuffle(R, pool).slice(0, 3)]);
      return {
        type: 'mcq',
        q: r`$i^{${a}}+i^{${b}}=$`,
        options: opts.map((s) => `$${s}$`),
        answer: opts.indexOf(correct),
        solution: r`$${a}\equiv${a % 4}$ and $${b}\equiv${b % 4}\pmod 4$, so $i^{${a}}+i^{${b}}=i^{${a % 4}}+i^{${b % 4}}=${correct}$.`,
        hint: r`Only the remainder mod 4 matters.`,
      };
    },
  },
  // ───────── Quadratics
  {
    id: 'qd-sym', chapter: 'quadratic', name: 'Symmetric functions of roots', difficulty: 1,
    make(R) {
      const p = nonZero(R, -7, 7);
      let q = nonZero(R, -7, 7);
      if (q === p) q = p === 7 ? -7 : p + 1;
      const s = p + q, pr = p * q;
      const eq = poly([1, -s, pr]);
      const kind = pick(R, ['sq', 'cube', 'recip']);
      if (kind === 'sq') return {
        q: r`If $\alpha,\beta$ are the roots of $${eq}=0$, find $\alpha^2+\beta^2$.`,
        answer: s * s - 2 * pr,
        solution: r`$\alpha+\beta=${s},\ \alpha\beta=${pr}$. So $\alpha^2+\beta^2=(${s})^2-2(${pr})=${s * s - 2 * pr}$.`,
        hint: r`Express in terms of $\alpha+\beta$ and $\alpha\beta$.`,
      };
      if (kind === 'cube') return {
        q: r`If $\alpha,\beta$ are the roots of $${eq}=0$, find $\alpha^3+\beta^3$.`,
        answer: s ** 3 - 3 * pr * s,
        solution: r`$\alpha^3+\beta^3=(\alpha+\beta)^3-3\alpha\beta(\alpha+\beta)=(${s})^3-3(${pr})(${s})=${s ** 3 - 3 * pr * s}$.`,
        hint: r`$\alpha^3+\beta^3=(\alpha+\beta)^3-3\alpha\beta(\alpha+\beta)$.`,
      };
      const f = new Frac(s, pr);
      return {
        q: r`If $\alpha,\beta$ are the roots of $${eq}=0$, find $\dfrac1\alpha+\dfrac1\beta$ (as a fraction or decimal).`,
        answer: f.value,
        solution: r`$\dfrac1\alpha+\dfrac1\beta=\dfrac{\alpha+\beta}{\alpha\beta}=\dfrac{${s}}{${pr}}=${f.tex()}$.`,
      };
    },
  },
  {
    id: 'qd-equal', chapter: 'quadratic', name: 'Condition for equal roots', difficulty: 1,
    make(R) {
      const u = randInt(R, 1, 4), v = randInt(R, 1, 6);
      const a = u * u, c = v * v;
      return {
        q: r`Find the positive value of $k$ for which $${a === 1 ? '' : a}x^2+kx+${c}=0$ has equal roots.`,
        answer: 2 * u * v,
        solution: r`Equal roots ⇔ $k^2-4\cdot${a}\cdot${c}=0\Rightarrow k^2=${4 * a * c}\Rightarrow k=${2 * u * v}$ (positive).`,
      };
    },
  },
  // ───────── Sequences
  {
    id: 'sq-ap', chapter: 'sequences', name: 'AP sums & terms', difficulty: 1,
    make(R) {
      const a = randInt(R, -10, 20), d = nonZero(R, -5, 9), n = randInt(R, 8, 40);
      const terms = [a, a + d, a + 2 * d].join(', ');
      if (R() < 0.5) {
        const S = (n * (2 * a + (n - 1) * d)) / 2;
        return {
          q: r`Find the sum of the first ${n} terms of the AP $${terms},\dots$`,
          answer: S,
          solution: r`$a=${a},\ d=${d}$. $S_{${n}}=\tfrac{${n}}{2}\left[2(${a})+${n - 1}(${d})\right]=${S}$.`,
        };
      }
      return {
        q: r`Find the ${ordinal(n)} term of the AP $${terms},\dots$`,
        answer: a + (n - 1) * d,
        solution: r`$a_{${n}}=a+(n-1)d=${a}+${n - 1}\cdot${par(d)}=${a + (n - 1) * d}$.`,
      };
    },
  },
  {
    id: 'sq-gp', chapter: 'sequences', name: 'Infinite GP', difficulty: 2,
    make(R) {
      const q = randInt(R, 2, 6), p = randInt(R, 1, q - 1) * sign(R);
      if (gcd(p, q) !== 1) return this.make(R);
      const k = randInt(R, 1, 4);
      const a = k * (q - p); // makes the sum an integer
      const r_ = new Frac(p, q);
      const S = new Frac(a).div(new Frac(1).sub(r_));
      const t2 = new Frac(a).mul(r_), t3 = t2.mul(r_);
      return {
        q: r`Find the sum to infinity of the GP $${a},\ ${t2.tex()},\ ${t3.tex()},\ \dots$`,
        answer: S.value,
        solution: r`$a=${a},\ r=${r_.tex()}$ with $|r|<1$. $S_\infty=\dfrac{a}{1-r}=\dfrac{${a}}{1-\left(${r_.tex()}\right)}=${S.tex()}$.`,
      };
    },
  },
  {
    id: 'sq-sigma', chapter: 'sequences', name: 'Standard sums', difficulty: 1,
    make(R) {
      const n = randInt(R, 5, 25);
      const kind = pick(R, [1, 2, 3]);
      const val = kind === 1 ? (n * (n + 1)) / 2 : kind === 2 ? (n * (n + 1) * (2 * n + 1)) / 6 : ((n * (n + 1)) / 2) ** 2;
      const f = kind === 1 ? r`\dfrac{n(n+1)}{2}` : kind === 2 ? r`\dfrac{n(n+1)(2n+1)}{6}` : r`\left[\dfrac{n(n+1)}{2}\right]^2`;
      return {
        q: r`Evaluate $\displaystyle\sum_{k=1}^{${n}}k${kind === 1 ? '' : `^${kind}`}$.`,
        answer: val,
        solution: r`Using $${f}$ with $n=${n}$: ${val}.`,
      };
    },
  },
  // ───────── P&C
  {
    id: 'pc-word', chapter: 'pnc', name: 'Arrangements of letters', difficulty: 1,
    make(R) {
      const word = pick(R, ['BANANA', 'LETTER', 'SUCCESS', 'BALLOON', 'PEPPER', 'APPLE', 'COFFEE', 'CALCULUS', 'ALGEBRA', 'TATTOO', 'GEOMETRY', 'PARALLEL', 'INDIA', 'ASSESS', 'ADDRESS']);
      const counts = {};
      for (const ch of word) counts[ch] = (counts[ch] || 0) + 1;
      const reps = Object.entries(counts).filter(([, c]) => c > 1);
      let ans = fact(word.length);
      reps.forEach(([, c]) => { ans /= fact(c); });
      const denom = reps.map(([, c]) => `${c}!`).join('\\,') || '1';
      const desc = reps.map(([l, c]) => `${l}×${c}`).join(', ') || 'no repeats';
      return {
        q: r`In how many distinct ways can the letters of the word ${word} be arranged?`,
        answer: ans,
        solution: r`${word.length} letters (${desc}): $\dfrac{${word.length}!}{${denom}}=${ans}$.`,
        hint: r`Divide by the factorial of each repeat count.`,
      };
    },
  },
  {
    id: 'pc-committee', chapter: 'pnc', name: 'Committee selection', difficulty: 1,
    make(R) {
      const men = randInt(R, 4, 9), women = randInt(R, 3, 7);
      const k = randInt(R, 3, Math.min(6, men + women - 2));
      const j = randInt(R, 1, Math.min(women, k - 1));
      const ans = nCr(women, j) * nCr(men, k - j);
      return {
        q: r`A committee of ${k} is chosen from ${men} men and ${women} women. In how many ways can it contain exactly ${j} ${j === 1 ? 'woman' : 'women'}?`,
        answer: ans,
        solution: r`$\dbinom{${women}}{${j}}\dbinom{${men}}{${k - j}}=${nCr(women, j)}\cdot${nCr(men, k - j)}=${ans}$.`,
      };
    },
  },
  {
    id: 'pc-geo', chapter: 'pnc', name: 'Polygons: diagonals & triangles', difficulty: 1,
    make(R) {
      const n = randInt(R, 5, 20);
      if (R() < 0.5) return {
        q: r`How many diagonals does a convex polygon with ${n} sides have?`,
        answer: (n * (n - 3)) / 2,
        solution: r`$\dfrac{n(n-3)}{2}=\dfrac{${n}\cdot${n - 3}}{2}=${(n * (n - 3)) / 2}$.`,
      };
      return {
        q: r`How many triangles can be formed by joining vertices of a convex ${n}-gon?`,
        answer: nCr(n, 3),
        solution: r`Any 3 vertices give a triangle: $\dbinom{${n}}{3}=${nCr(n, 3)}$.`,
      };
    },
  },
  // ───────── Binomial
  {
    id: 'bn-coef', chapter: 'binomial', name: 'Coefficient of xᵏ', difficulty: 1,
    make(R) {
      const a = pick(R, [1, 1, 2, 3]), b = pick(R, [1, 2, 3, -1, -2]);
      const n = randInt(R, 4, 9), k = randInt(R, 1, n - 1);
      const ans = nCr(n, k) * a ** (n - k) * b ** k;
      const bx = b === 1 ? 'x' : b === -1 ? '-x' : `${b}x`;
      return {
        q: r`Find the coefficient of $x^{${k}}$ in $(${a}${b < 0 ? '' : '+'}${bx})^{${n}}$.`,
        answer: ans,
        solution: r`$T_{${k + 1}}=\dbinom{${n}}{${k}}(${a})^{${n - k}}(${bx})^{${k}}$, coefficient $=${nCr(n, k)}\cdot${a ** (n - k)}\cdot${par(b ** k)}=${ans}$.`,
      };
    },
  },
  {
    id: 'bn-const', chapter: 'binomial', name: 'Term independent of x', difficulty: 2,
    make(R) {
      let p, q, n;
      do {
        p = randInt(R, 1, 3); q = randInt(R, 1, 3); n = randInt(R, 4, 12);
      } while ((n * p) % (p + q) !== 0);
      const c = pick(R, [1, 2, -1, 3]);
      const rr = (n * p) / (p + q);
      const ans = nCr(n, rr) * c ** rr;
      const xp = p === 1 ? 'x' : `x^{${p}}`;
      const den = q === 1 ? 'x' : `x^{${q}}`;
      const sec = c < 0 ? `-\\dfrac{${-c}}{${den}}` : `+\\dfrac{${c}}{${den}}`;
      return {
        q: r`Find the term independent of $x$ in $\left(${xp}${sec}\right)^{${n}}$.`,
        answer: ans,
        solution: r`$T_{r+1}=\dbinom{${n}}{r}x^{${p}(${n}-r)}(${c})^r x^{-${q}r}$. Power of $x$: $${p * n}-${p + q}r=0\Rightarrow r=${rr}$. Term $=\dbinom{${n}}{${rr}}(${c})^{${rr}}=${ans}$.`,
        hint: r`Set the exponent of $x$ in the general term to zero.`,
      };
    },
  },
  // ───────── Matrices
  {
    id: 'mt-det', chapter: 'matrices', name: 'Determinants', difficulty: 1,
    make(R) {
      if (R() < 0.45) {
        const [a, b, c, d] = [0, 0, 0, 0].map(() => randInt(R, -6, 9));
        return {
          q: r`Evaluate $\begin{vmatrix}${a}&${b}\\${c}&${d}\end{vmatrix}$.`,
          answer: a * d - b * c,
          solution: r`$(${a})(${d})-(${b})(${c})=${a * d - b * c}$.`,
        };
      }
      const m = [0, 1, 2].map(() => [0, 1, 2].map(() => randInt(R, -3, 4)));
      const [[a, b, c], [d, e, f], [g, h, i]] = m;
      const ans = a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
      return {
        q: r`Evaluate $\begin{vmatrix}${a}&${b}&${c}\\${d}&${e}&${f}\\${g}&${h}&${i}\end{vmatrix}$.`,
        answer: ans,
        solution: r`Expanding along row 1: $${a}(${e * i - f * h})-${par(b)}(${d * i - f * g})+${par(c)}(${d * h - e * g})=${ans}$.`,
      };
    },
  },
  {
    id: 'mt-adj', chapter: 'matrices', name: 'Determinant properties', difficulty: 2,
    make(R) {
      const n = randInt(R, 2, 4), d = pick(R, [2, 3, -2, 4, 5]);
      const kind = pick(R, ['adj', 'k', 'inv', 'adjadj']);
      if (kind === 'adj') return {
        q: r`$A$ is a square matrix of order ${n} with $|A|=${d}$. Find $|\operatorname{adj}A|$.`,
        answer: d ** (n - 1),
        solution: r`$|\operatorname{adj}A|=|A|^{n-1}=(${d})^{${n - 1}}=${d ** (n - 1)}$.`,
      };
      if (kind === 'k') {
        const k = pick(R, [2, 3, -1, -2]);
        return {
          q: r`$A$ is a square matrix of order ${n} with $|A|=${d}$. Find $|${k}A|$.`,
          answer: k ** n * d,
          solution: r`$|kA|=k^n|A|=(${k})^{${n}}\cdot${par(d)}=${k ** n * d}$.`,
        };
      }
      if (kind === 'inv') {
        const f = new Frac(1, d);
        return {
          q: r`$A$ is invertible with $|A|=${d}$. Find $|A^{-1}|$ (as a fraction or decimal).`,
          answer: f.value,
          solution: r`$|A^{-1}|=\dfrac{1}{|A|}=${f.tex()}$.`,
        };
      }
      const e = (n - 1) ** 2;
      return {
        q: r`$A$ is a square matrix of order ${n} with $|A|=${d}$. Find $|\operatorname{adj}(\operatorname{adj}A)|$.`,
        answer: d ** e,
        solution: r`$|\operatorname{adj}(\operatorname{adj}A)|=|A|^{(n-1)^2}=(${d})^{${e}}=${d ** e}$.`,
      };
    },
  },
  // ───────── Trigonometry
  {
    id: 'tg-range', chapter: 'trigonometry', name: 'Max/min of a sin x + b cos x', difficulty: 1,
    make(R) {
      const [a, b, h] = pick(R, [[3, 4, 5], [5, 12, 13], [6, 8, 10], [8, 15, 17], [12, 5, 13], [4, 3, 5], [7, 24, 25]]);
      const c = randInt(R, -5, 8);
      const isMax = R() < 0.5;
      const sa = a * sign(R), sb = b * sign(R);
      const expr = `${sa}\\sin x ${sb < 0 ? '-' : '+'} ${Math.abs(sb)}\\cos x${c ? ` ${signed(c)}` : ''}`;
      return {
        q: r`Find the ${isMax ? 'maximum' : 'minimum'} value of $${expr}$.`,
        answer: isMax ? h + c : c - h,
        solution: r`$${sa}\sin x${sb < 0 ? '-' : '+'}${Math.abs(sb)}\cos x$ ranges over $[-\sqrt{${a}^2+${b}^2},\sqrt{${a}^2+${b}^2}]=[-${h},${h}]$. ${isMax ? 'Maximum' : 'Minimum'} $=${isMax ? h + c : c - h}$.`,
      };
    },
  },
  // ───────── Limits
  {
    id: 'lm-poly', chapter: 'limits', name: 'Limits of (xⁿ − aⁿ)/(x − a)', difficulty: 1,
    make(R) {
      const n = randInt(R, 2, 6), a = nonZero(R, -3, 3);
      const an = a ** n;
      return {
        q: r`Evaluate $\displaystyle\lim_{x\to${a}}\frac{x^{${n}}${signed(-an)}}{x${signed(-a)}}$.`,
        answer: n * a ** (n - 1),
        solution: r`This is $\lim\limits_{x\to a}\dfrac{x^n-a^n}{x-a}=na^{n-1}$ with $a=${a},\ n=${n}$: $${n}\cdot(${a})^{${n - 1}}=${n * a ** (n - 1)}$.`,
      };
    },
  },
  {
    id: 'lm-trig', chapter: 'limits', name: 'Standard trigonometric limits', difficulty: 1,
    make(R) {
      const a = randInt(R, 1, 9), b = randInt(R, 1, 9);
      const f = new Frac(a, b);
      const top = pick(R, ['\\sin', '\\tan']), bot = pick(R, ['\\sin', '\\tan', '']);
      const den = bot ? `${bot} ${b}x` : `${b}x`;
      return {
        q: r`Evaluate $\displaystyle\lim_{x\to0}\frac{${top} ${a}x}{${den}}$ (as a fraction or decimal).`,
        answer: f.value,
        solution: r`Each of $\sin kx,\ \tan kx$ behaves like $kx$ near $0$, so the limit is $\dfrac{${a}}{${b}}=${f.tex()}$.`,
      };
    },
  },
  {
    id: 'lm-e', chapter: 'limits', name: '1^∞ forms', difficulty: 2,
    make(R) {
      const a = randInt(R, 1, 5), b = randInt(R, 1, 5);
      const correct = `e^{${a * b}}`;
      const cands = [`e^{${a + b}}`, `e^{${numTex(a / b)}}`, `e^{${numTex(b / a)}}`, `e^{${a * b + 1}}`, `${a * b}e`, '1', `e^{${a}}`];
      const opts = [correct];
      for (const c of shuffle(R, cands)) if (opts.length < 4 && !opts.includes(c)) opts.push(c);
      const final = shuffle(R, opts);
      return {
        type: 'mcq',
        q: r`$\displaystyle\lim_{x\to\infty}\left(1+\frac{${a}}{x}\right)^{${b === 1 ? '' : b}x}=$`,
        options: final.map((s) => `$${s}$`),
        answer: final.indexOf(correct),
        solution: r`$1^\infty$ form: $\exp\left(\lim ${b === 1 ? '' : b}x\cdot\tfrac{${a}}{x}\right)=e^{${a * b}}$.`,
      };
    },
  },
  // ───────── Differentiation & AOD
  {
    id: 'df-poly', chapter: 'differentiation', name: 'Derivative at a point', difficulty: 1,
    make(R) {
      const c = [nonZero(R, -4, 5), randInt(R, -6, 6), randInt(R, -9, 9), randInt(R, -9, 9)];
      const x0 = randInt(R, -3, 3);
      const d = 3 * c[0] * x0 * x0 + 2 * c[1] * x0 + c[2];
      return {
        q: r`If $f(x)=${poly(c)}$, find $f'(${x0})$.`,
        answer: d,
        solution: r`$f'(x)=${poly([3 * c[0], 2 * c[1], c[2]])}$, so $f'(${x0})=${d}$.`,
      };
    },
  },
  {
    id: 'df-motion', chapter: 'basic-maths', name: 'Kinematics with calculus', difficulty: 1,
    make(R) {
      const a = randInt(R, 1, 4), b = randInt(R, -6, 6), c = randInt(R, -5, 10), t = randInt(R, 1, 5);
      const x = poly([a, b, c, 0], 't');
      if (R() < 0.5) return {
        q: r`A particle moves along a line with $x=${x}$ (SI units). Find its velocity at $t=${t}$ s, in m/s.`,
        answer: 3 * a * t * t + 2 * b * t + c,
        solution: r`$v=\dfrac{dx}{dt}=${poly([3 * a, 2 * b, c], 't')}$; at $t=${t}$: $v=${3 * a * t * t + 2 * b * t + c}$ m/s.`,
      };
      return {
        q: r`A particle moves along a line with $x=${x}$ (SI units). Find its acceleration at $t=${t}$ s, in m/s².`,
        answer: 6 * a * t + 2 * b,
        solution: r`$a=\dfrac{d^2x}{dt^2}=${poly([6 * a, 2 * b], 't')}$; at $t=${t}$: ${6 * a * t + 2 * b} m/s².`,
      };
    },
  },
  {
    id: 'ad-extrema', chapter: 'aod', name: 'Local maxima & minima', difficulty: 2,
    make(R) {
      let p, q;
      do { p = randInt(R, -4, 4); q = randInt(R, -4, 5); } while (p >= q || (p + q) % 2 !== 0);
      const c0 = randInt(R, -5, 5);
      const b = (-3 * (p + q)) / 2, cc = 3 * p * q;
      const f = (x) => x ** 3 + b * x * x + cc * x + c0;
      const isMax = R() < 0.5;
      const x0 = isMax ? p : q;
      return {
        q: r`Find the local ${isMax ? 'maximum' : 'minimum'} value of $f(x)=${poly([1, b, cc, c0])}$.`,
        answer: f(x0),
        solution: r`$f'(x)=${poly([3, 2 * b, cc])}=3(x${signed(-p)})(x${signed(-q)})$. $f''(x)=6x${signed(2 * b)}$ is ${isMax ? 'negative' : 'positive'} at $x=${x0}$, so it's a local ${isMax ? 'max' : 'min'}. $f(${x0})=${f(x0)}$.`,
        hint: r`Factor $f'(x)$; the cubic has positive leading coefficient, so the smaller critical point is the max.`,
      };
    },
  },
  // ───────── Definite integration
  {
    id: 'dt-poly', chapter: 'definite', name: 'Definite integrals of polynomials', difficulty: 1,
    make(R) {
      const a = randInt(R, -3, 4), b = randInt(R, -5, 6), c = randInt(R, -6, 6);
      if (a === 0 && b === 0 && c === 0) return this.make(R);
      const k = randInt(R, 1, 4);
      const val = new Frac(a * k ** 3, 3).add(new Frac(b * k * k, 2)).add(c * k);
      return {
        q: r`Evaluate $\displaystyle\int_0^{${k}}\left(${poly([a, b, c])}\right)dx$ (as a fraction or to two decimal places).`,
        answer: val.value,
        solution: r`Antiderivative $\dfrac{${a}x^3}{3}+\dfrac{${b}x^2}{2}+${par(c)}x$, evaluated from $0$ to $${k}$: $\dfrac{${a}\cdot${k}^3}{3}+\dfrac{${b}\cdot${k}^2}{2}+${par(c)}\cdot${k}=${val.tex()}$.`,
      };
    },
  },
  // ───────── Lines & circles & conics
  {
    id: 'ln-dist', chapter: 'lines', name: 'Distance from a point to a line', difficulty: 1,
    make(R) {
      const [a0, b0, h] = pick(R, [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [6, 8, 10], [8, 15, 17]]);
      const a = a0 * sign(R), b = b0 * sign(R), c = randInt(R, -20, 20);
      const x0 = randInt(R, -5, 5), y0 = randInt(R, -5, 5);
      const num_ = Math.abs(a * x0 + b * y0 + c);
      const f = new Frac(num_, h);
      return {
        q: r`Find the distance of the point $(${x0},${y0})$ from the line $${a}x ${b < 0 ? '-' : '+'} ${Math.abs(b)}y${c ? ' ' + signed(c) : ''}=0$.`,
        answer: f.value,
        solution: r`$d=\dfrac{|${a}(${x0})+${par(b)}(${y0})${signed(c)}|}{\sqrt{${a}^2+${b}^2}}=\dfrac{${num_}}{${h}}=${f.tex()}$.`,
      };
    },
  },
  {
    id: 'cr-radius', chapter: 'circles', name: 'Centre & radius from general form', difficulty: 1,
    make(R) {
      const h = randInt(R, -6, 6), k = randInt(R, -6, 6), rad = randInt(R, 1, 9);
      const C = h * h + k * k - rad * rad;
      const eq = `x^2+y^2 ${h ? `${signed(-2 * h)}x` : ''} ${k ? `${signed(-2 * k)}y` : ''} ${C ? signed(C) : ''}=0`.replace(/\s+/g, ' ');
      return {
        q: r`Find the radius of the circle $${eq}$.`,
        answer: rad,
        solution: r`Centre $(-g,-f)=(${h},${k})$; $r=\sqrt{g^2+f^2-c}=\sqrt{${h * h}+${k * k}-${par(C)}}=${rad}$.`,
      };
    },
  },
  {
    id: 'cn-ellipse', chapter: 'conics', name: 'Ellipse & hyperbola parameters', difficulty: 1,
    make(R) {
      const isE = R() < 0.6;
      if (isE) {
        const [a, b, c] = pick(R, [[5, 4, 3], [5, 3, 4], [13, 12, 5], [13, 5, 12], [10, 8, 6], [10, 6, 8], [17, 15, 8]]);
        const kind = pick(R, ['e', 'lr', 'foci']);
        const eq = r`\dfrac{x^2}{${a * a}}+\dfrac{y^2}{${b * b}}=1`;
        if (kind === 'e') return { q: r`Find the eccentricity of the ellipse $${eq}$.`, answer: c / a, solution: r`$e=\sqrt{1-\tfrac{b^2}{a^2}}=\tfrac{\sqrt{${a * a - b * b}}}{${a}}=${new Frac(c, a).tex()}$.` };
        if (kind === 'lr') return { q: r`Find the length of the latus rectum of $${eq}$.`, answer: (2 * b * b) / a, solution: r`$\dfrac{2b^2}{a}=\dfrac{${2 * b * b}}{${a}}=${new Frac(2 * b * b, a).tex()}$.` };
        return { q: r`Find the distance between the foci of $${eq}$.`, answer: 2 * c, solution: r`$ae=\sqrt{a^2-b^2}=${c}$, so $2ae=${2 * c}$.` };
      }
      const [a, b, c] = pick(R, [[4, 3, 5], [3, 4, 5], [12, 5, 13], [5, 12, 13], [8, 6, 10], [15, 8, 17]]);
      const eq = r`\dfrac{x^2}{${a * a}}-\dfrac{y^2}{${b * b}}=1`;
      if (R() < 0.5) return { q: r`Find the eccentricity of the hyperbola $${eq}$.`, answer: c / a, solution: r`$e=\sqrt{1+\tfrac{b^2}{a^2}}=\tfrac{${c}}{${a}}=${new Frac(c, a).tex()}$.` };
      return { q: r`Find the distance between the foci of $${eq}$.`, answer: 2 * c, solution: r`$ae=\sqrt{a^2+b^2}=${c}$; distance $=2ae=${2 * c}$.` };
    },
  },
  // ───────── Vectors & 3D
  {
    id: 'vc-ops', chapter: 'vectors', name: 'Dot & cross products', difficulty: 1,
    make(R) {
      const v = () => [randInt(R, -4, 5), randInt(R, -4, 5), randInt(R, -4, 5)];
      const a = v(), b = v();
      const show = (u) => `(${u.join(',')})`;
      if (R() < 0.55) {
        const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        return {
          q: r`Find $\vec a\cdot\vec b$ for $\vec a=${show(a)}$ and $\vec b=${show(b)}$.`,
          answer: d,
          solution: r`$${a[0]}\cdot${par(b[0])}+${par(a[1])}\cdot${par(b[1])}+${par(a[2])}\cdot${par(b[2])}=${d}$.`,
        };
      }
      const c = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const m2 = c[0] ** 2 + c[1] ** 2 + c[2] ** 2;
      return {
        q: r`Find $|\vec a\times\vec b|^2$ for $\vec a=${show(a)}$ and $\vec b=${show(b)}$.`,
        answer: m2,
        solution: r`$\vec a\times\vec b=${show(c)}$, so $|\vec a\times\vec b|^2=${c.map((x) => `${par(x)}^2`).join('+')}=${m2}$.`,
        hint: r`Expand the $3\times3$ determinant with $\hat i,\hat j,\hat k$ in the first row.`,
      };
    },
  },
  {
    id: 'td-dist', chapter: 'three-d', name: 'Distance between points in space', difficulty: 1,
    make(R) {
      const Q = [[1, 2, 2, 3], [2, 3, 6, 7], [1, 4, 8, 9], [4, 4, 7, 9], [2, 6, 9, 11], [6, 6, 7, 11], [3, 4, 12, 13], [2, 10, 11, 15]];
      const [x, y, z, d] = pick(R, Q);
      const dv = shuffle(R, [x, y, z]).map((t) => t * sign(R));
      const P = [randInt(R, -5, 5), randInt(R, -5, 5), randInt(R, -5, 5)];
      const P2 = P.map((t, i) => t + dv[i]);
      return {
        q: r`Find the distance between $(${P.join(',')})$ and $(${P2.join(',')})$.`,
        answer: d,
        solution: r`$\sqrt{${dv.map((t) => `${par(t)}^2`).join('+')}}=\sqrt{${d * d}}=${d}$.`,
      };
    },
  },
  // ───────── Statistics & probability
  {
    id: 'st-var', chapter: 'statistics', name: 'Mean & variance', difficulty: 1,
    make(R) {
      const n = pick(R, [4, 5, 6]);
      const xs = Array.from({ length: n }, () => randInt(R, 1, 12));
      const mean = new Frac(xs.reduce((s, x) => s + x, 0), n);
      const sq = new Frac(xs.reduce((s, x) => s + x * x, 0), n);
      const v = sq.sub(mean.mul(mean));
      if (R() < 0.35) return {
        q: r`Find the mean of $${xs.join(',\\ ')}$.`,
        answer: mean.value,
        solution: r`$\bar x=\dfrac{${xs.join('+')}}{${n}}=${mean.tex()}$.`,
      };
      return {
        q: r`Find the variance of $${xs.join(',\\ ')}$ (as a fraction or to two decimal places).`,
        answer: v.value,
        solution: r`$\bar x=${mean.tex()}$, $\dfrac{\sum x_i^2}{n}=${sq.tex()}$. $\sigma^2=${sq.tex()}-\left(${mean.tex()}\right)^2=${v.tex()}$.`,
      };
    },
  },
  {
    id: 'pb-dice', chapter: 'probability', name: 'Dice & draws', difficulty: 1,
    make(R) {
      if (R() < 0.5) {
        const s = randInt(R, 2, 12);
        const ways = 6 - Math.abs(7 - s);
        const f = new Frac(ways, 36);
        return {
          q: r`Two fair dice are thrown. Find the probability that the sum is ${s} (as a fraction or to two decimal places).`,
          answer: f.value,
          solution: r`There are ${ways} favourable ordered pairs out of 36: $${f.tex()}$.`,
        };
      }
      const red = randInt(R, 2, 7), blue = randInt(R, 2, 7), N = red + blue;
      const both = R() < 0.5;
      const f = both ? new Frac(nCr(red, 2), nCr(N, 2)) : new Frac(red * blue, nCr(N, 2));
      return {
        q: r`A bag has ${red} red and ${blue} blue balls. Two are drawn at random without replacement. Find the probability that ${both ? 'both are red' : 'one is red and one is blue'} (fraction or two decimals).`,
        answer: f.value,
        solution: both
          ? r`$\dfrac{\binom{${red}}{2}}{\binom{${N}}{2}}=\dfrac{${nCr(red, 2)}}{${nCr(N, 2)}}=${f.tex()}$.`
          : r`$\dfrac{${red}\cdot${blue}}{\binom{${N}}{2}}=\dfrac{${red * blue}}{${nCr(N, 2)}}=${f.tex()}$.`,
      };
    },
  },
  // ───────── Basic maths (NEET)
  {
    id: 'bm-log', chapter: 'basic-maths', name: 'Logarithm drills', difficulty: 1,
    make(R) {
      const pairs = [[2, randInt(R, 2, 8)], [3, randInt(R, 1, 5)], [5, randInt(R, 1, 4)], [10, randInt(R, 1, 6)]];
      const chosen = shuffle(R, pairs).slice(0, 3);
      const signs = [1, sign(R), sign(R)];
      let total = 0;
      const parts = chosen.map(([b, k], i) => {
        total += signs[i] * k;
        return `${i === 0 ? '' : signs[i] < 0 ? '-' : '+'}\\log_{${b}}${b ** k}`;
      });
      return {
        q: r`Evaluate $${parts.join(' ')}$.`,
        answer: total,
        solution: r`$\log_b b^k=k$: ${chosen.map(([, k], i) => `${i === 0 ? '' : signs[i] < 0 ? '−' : '+'}${k}`).join(' ')} $=${total}$.`,
      };
    },
  },
];

export const generatorById = Object.fromEntries(GENERATORS.map((g) => [g.id, g]));
export const generatorsForChapter = (chapterId) => GENERATORS.filter((g) => g.chapter === chapterId);
export const ALL_GENERATORS = GENERATORS;

// Build a full question object from a generator and seed.
export function generate(genId, seed) {
  const g = generatorById[genId];
  if (!g) return null;
  const R = mulberry32(seed);
  const out = g.make.call(g, R);
  return {
    id: `g:${genId}:${seed}`,
    chapter: g.chapter,
    difficulty: g.difficulty,
    generated: true,
    generator: genId,
    type: out.type || 'num',
    q: out.q,
    options: out.options,
    answer: out.answer,
    solution: out.solution,
    hint: out.hint || '',
  };
}

export function parseGeneratedId(id) {
  const m = /^g:([^:]+):(\d+)$/.exec(id);
  return m ? { genId: m[1], seed: Number(m[2]) } : null;
}

// Turn a numerical question into a 4-option MCQ with plausible distractors (for mock tests).
export function toMCQ(q, seed) {
  if (q.type === 'mcq') return q;
  const R = mulberry32(seed ^ 0x9e3779b9);
  const ans = q.answer;
  const isInt = Number.isInteger(ans);
  const cands = new Set();
  const add = (x) => {
    if (!Number.isFinite(x)) return;
    const v = isInt ? Math.round(x) : +x.toFixed(6);
    if (Math.abs(v - ans) > 1e-6) cands.add(v);
  };
  if (isInt) {
    [ans + 1, ans - 1, ans + 2, -ans, 2 * ans, ans + 10, ans - 10, Math.round(ans / 2), ans * 3].forEach(add);
  } else {
    [ans * 2, ans / 2, -ans, 1 - ans, ans + 1, ans + 0.5, 1 / ans].forEach(add);
  }
  // Prefer distractors with the same sign as the answer (a distance shouldn't get a negative option).
  const sameSign = (v) => (ans >= 0 ? v >= 0 : v < 0);
  const pool = [...shuffle(R, [...cands].filter(sameSign)), ...shuffle(R, [...cands].filter((v) => !sameSign(v)))];
  const distractors = pool.slice(0, 3);
  let k = 3;
  while (distractors.length < 3) { const v = ans + k++; if (!distractors.includes(v)) distractors.push(v); }
  const opts = shuffle(R, [ans, ...distractors]);
  return {
    ...q,
    type: 'mcq',
    options: opts.map((v) => `$${numTex(v)}$`),
    answer: opts.indexOf(ans),
    q: q.q.replace(/\s*\((as a fraction or decimal|as a fraction or to two decimal places|fraction or two decimals|correct to two decimal places, or as a fraction)\)/, ''),
  };
}
