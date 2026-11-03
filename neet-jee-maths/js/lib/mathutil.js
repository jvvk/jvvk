// Seeded randomness + exact rational arithmetic + TeX formatting helpers.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const randInt = (rng, a, b) => a + Math.floor(rng() * (b - a + 1));
export const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
export const sign = (rng) => (rng() < 0.5 ? -1 : 1);
export function nonZero(rng, a, b) {
  let v = 0;
  while (v === 0) v = randInt(rng, a, b);
  return v;
}
export function shuffle(rng, arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const gcd = (a, b) => {
  a = Math.abs(a); b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
};

export function fact(n) {
  let p = 1;
  for (let i = 2; i <= n; i++) p *= i;
  return p;
}
export function nCr(n, k) {
  if (k < 0 || k > n) return 0;
  k = Math.min(k, n - k);
  let p = 1;
  for (let i = 1; i <= k; i++) p = (p * (n - k + i)) / i;
  return Math.round(p);
}
export const nPr = (n, k) => (k > n ? 0 : Math.round(fact(n) / fact(n - k)));

export class Frac {
  constructor(n, d = 1) {
    if (d === 0) throw new Error('zero denominator');
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    this.n = n / g;
    this.d = d / g;
  }
  static of(x) { return x instanceof Frac ? x : new Frac(x, 1); }
  add(o) { o = Frac.of(o); return new Frac(this.n * o.d + o.n * this.d, this.d * o.d); }
  sub(o) { o = Frac.of(o); return new Frac(this.n * o.d - o.n * this.d, this.d * o.d); }
  mul(o) { o = Frac.of(o); return new Frac(this.n * o.n, this.d * o.d); }
  div(o) { o = Frac.of(o); return new Frac(this.n * o.d, this.d * o.n); }
  get value() { return this.n / this.d; }
  isInt() { return this.d === 1; }
  tex() {
    if (this.d === 1) return String(this.n);
    const s = this.n < 0 ? '-' : '';
    return `${s}\\dfrac{${Math.abs(this.n)}}{${this.d}}`;
  }
  text() { return this.d === 1 ? String(this.n) : `${this.n}/${this.d}`; }
}

// Format a number for TeX, using a fraction when it's a "nice" rational.
export function numTex(x) {
  if (x instanceof Frac) return x.tex();
  if (Number.isInteger(x)) return String(x);
  for (let d = 2; d <= 64; d++) {
    const n = Math.round(x * d);
    if (Math.abs(n / d - x) < 1e-9) return new Frac(n, d).tex();
  }
  return String(+x.toFixed(4));
}

// Polynomial in x from coefficients, highest power first: poly([1,-5,6]) → "x^2 - 5x + 6"
export function poly(coeffs, v = 'x') {
  const deg = coeffs.length - 1;
  const parts = [];
  coeffs.forEach((c, i) => {
    if (c === 0) return;
    const p = deg - i;
    const vv = p === 0 ? '' : p === 1 ? v : `${v}^{${p}}`;
    const abs = Math.abs(c);
    const body = (abs === 1 && vv ? '' : String(abs)) + vv;
    if (parts.length === 0) parts.push((c < 0 ? '-' : '') + body);
    else parts.push((c < 0 ? '- ' : '+ ') + body);
  });
  return parts.length ? parts.join(' ') : '0';
}

// Signed constant for "x + 3" / "x - 3" style output
export const signed = (c) => (c < 0 ? `- ${Math.abs(c)}` : `+ ${c}`);
// Parenthesise negatives: (−3)
export const par = (c) => (c < 0 ? `(${c})` : String(c));

// Parse a learner's numeric answer: integers, decimals, fractions "7/3", leading minus.
export function parseAnswer(str) {
  if (str == null) return NaN;
  const s = String(str).trim().replace(/\s+/g, '').replace('−', '-');
  if (!s) return NaN;
  const m = s.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
  if (m) {
    const d = parseFloat(m[2]);
    return d === 0 ? NaN : parseFloat(m[1]) / d;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)(e-?\d+)?$/i.test(s)) return NaN;
  return parseFloat(s);
}

// JEE numerical answers: accept anything that matches when rounded to 2 decimals.
export function answerMatches(input, answer, tol = 0.0051) {
  const x = typeof input === 'number' ? input : parseAnswer(input);
  if (!Number.isFinite(x)) return false;
  return Math.abs(x - answer) <= tol + 1e-9 * Math.max(1, Math.abs(answer));
}
