// Small DOM helpers shared by all views.
export const $ = (s, el = document) => el.querySelector(s);
export const $$ = (s, el = document) => [...el.querySelectorAll(s)];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Math text is authored by us (trusted); it contains LaTeX + a little prose.
// We escape HTML-significant characters except inside nothing — KaTeX reads text nodes,
// so escaping < and > is safe and keeps the DOM clean.
export const mathHTML = (s) => esc(s);

const KATEX_OPTS = {
  delimiters: [
    { left: '$$', right: '$$', display: true },
    { left: '$', right: '$', display: false },
  ],
  throwOnError: false,
  strict: 'ignore',
};

export function typeset(el) {
  if (!el) return;
  if (window.renderMathInElement) {
    try { window.renderMathInElement(el, KATEX_OPTS); } catch { /* leave raw text */ }
  } else {
    pendingTypeset.add(el);
  }
}
const pendingTypeset = new Set();
if (typeof window !== 'undefined') window.addEventListener('load', () => {
  pendingTypeset.forEach((el) => el.isConnected && typeset(el));
  pendingTypeset.clear();
});

export function toast(msg, ms = 2200) {
  const box = $('#toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export function confetti() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const box = document.createElement('div');
  box.className = 'confetti';
  const colors = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#6250d6', '#e87ba4'];
  for (let i = 0; i < 70; i++) {
    const p = document.createElement('i');
    p.style.left = Math.random() * 100 + 'vw';
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = Math.random() * 0.4 + 's';
    p.style.animationDuration = 1.2 + Math.random() * 0.9 + 's';
    box.appendChild(p);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2600);
}

export function ring(value, { size = 120, stroke = 10, label = '', sub = '' } = {}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" aria-hidden="true">
      <circle class="ring-track" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="ring-val" cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke-width="${stroke}"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - v)}"/>
    </svg>
    <div class="ring-label"><b>${esc(label)}</b><span class="tiny">${esc(sub)}</span></div>
  </div>`;
}

export const pct = (x) => `${Math.round(x * 100)}%`;
export const fmtTime = (ms) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h) return `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  return `${m}:${String(s % 60).padStart(2, '0')}`;
};
export const fmtSecs = (ms) => (ms < 60000 ? `${Math.round(ms / 1000)}s` : `${(ms / 60000).toFixed(1)}m`);
export const diffDots = (d) =>
  `<span class="diff-dots" title="${['', 'Easy', 'Medium', 'Hard'][d]}" aria-label="${['', 'Easy', 'Medium', 'Hard'][d]}">${[1, 2, 3].map((i) => `<i class="${i <= d ? 'on' : ''}"></i>`).join('')}</span>`;
export const diffName = (d) => ['', 'Easy', 'Medium', 'Hard'][d] || '';

const I = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
export const ICONS = {
  home: I('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>'),
  book: I('<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5z"/><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>'),
  target: I('<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>'),
  clock: I('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  cards: I('<rect x="3" y="6" width="14" height="14" rx="2"/><path d="M7 2h12a2 2 0 0 1 2 2v12"/>'),
  chart: I('<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>'),
  bookmark: I('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'),
  bookmarkFill: '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>',
  back: I('<path d="M15 18l-6-6 6-6"/>'),
  next: I('<path d="M9 18l6-6-6-6"/>'),
  bulb: I('<path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>'),
  check: I('<path d="M20 6 9 17l-5-5"/>'),
  x: I('<path d="M18 6 6 18M6 6l12 12"/>'),
  zap: I('<path d="M13 2 3 14h9l-1 8 10-12h-9z"/>'),
  flame: I('<path d="M12 22c4 0 7-2.7 7-7 0-4-3-6-4-10-2 2-3 4-3 6-1-1-2-2-2-4-2 2-5 5-5 8 0 4.3 3 7 7 7z"/>'),
  infinity: I('<path d="M18.2 8.2a5 5 0 1 1 0 7.6L12 12l-6.2-3.8a5 5 0 1 0 0 7.6L12 12z"/>'),
  notebook: I('<path d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6z"/><path d="M6 2v20M10 7h6M10 11h6"/>'),
  printer: I('<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>'),
  flag: I('<path d="M4 22V4a1 1 0 0 1 1-1h12l-2 4 2 4H5"/>'),
};
