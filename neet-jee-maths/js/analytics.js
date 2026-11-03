import { $, $$, esc, pct, fmtSecs, fmtTime, ICONS } from './ui.js';
import { store, chapterStats, dayCounts, streak, today, addDays } from './store.js';
import { examChapters } from './bank.js';
import { unitById } from './data/syllabus.js';

export function renderAnalytics(view) {
  const s = store.get();
  const atts = s.attempts;
  const correct = atts.filter((a) => a.correct).length;
  const totalTime = atts.reduce((t, a) => t + a.time, 0);
  const chapters = examChapters().map((c) => ({ c, st: chapterStats(c.id) }));
  const attempted = chapters.filter((x) => x.st.attempts > 0).sort((a, b) => b.st.mastery - a.st.mastery);
  const byDiff = [1, 2, 3].map((d) => {
    const l = atts.filter((a) => a.difficulty === d);
    return { d, n: l.length, acc: l.length ? l.filter((a) => a.correct).length / l.length : 0 };
  });

  if (!atts.length) {
    view.innerHTML = `<div class="page-head"><div><div class="eyebrow">Insights</div><h1>Analytics</h1></div></div>
      <div class="card empty"><div class="big">📈</div><h2>No data yet</h2><p class="muted" style="margin-top:8px">Solve a few questions and your accuracy, mastery and activity will show up here.</p>
      <p style="margin-top:16px"><a class="btn btn-primary" href="#/practice/smart">Start Smart Practice</a></p></div>`;
    return;
  }

  view.innerHTML = `
    <div class="page-head"><div><div class="eyebrow">Insights</div><h1>Analytics</h1><p class="muted">Everything is computed locally from your attempts.</p></div></div>
    <div class="grid grid-4">
      <div class="card stat"><span class="k">Questions solved</span><span class="v">${atts.length}</span><span class="s">${correct} correct</span></div>
      <div class="card stat"><span class="k">Overall accuracy</span><span class="v">${pct(correct / atts.length)}</span><span class="s">last 50: ${pct(atts.slice(-50).filter((a) => a.correct).length / Math.min(50, atts.length))}</span></div>
      <div class="card stat"><span class="k">Avg time / question</span><span class="v">${fmtSecs(totalTime / atts.length)}</span><span class="s">${fmtTime(totalTime)} total</span></div>
      <div class="card stat"><span class="k">Current streak</span><span class="v">${streak()}d</span><span class="s">${Object.keys(dayCounts()).length} active days</span></div>
    </div>

    <div class="card section">
      <div class="row-between" style="margin-bottom:14px"><h3>Activity — last 20 weeks</h3><span class="faint small">questions per day</span></div>
      ${heatmap()}
    </div>

    <div class="grid grid-2 section">
      <div class="card">
        <div class="row-between" style="margin-bottom:4px"><h3>Chapter mastery</h3>
          <div class="seg" id="mview"><button class="on" data-v="chart">Chart</button><button data-v="table">Table</button></div></div>
        <p class="small muted" style="margin-bottom:14px">Recent accuracy weighted by volume (full weight at 15+ attempts).</p>
        <div id="mchart" class="bars">${attempted.map(({ c, st }) => `
          <div class="bar-row" title="${esc(c.name)}: mastery ${pct(st.mastery)} · ${st.correct}/${st.attempts} correct">
            <a class="label" href="#/chapter/${c.id}">${esc(c.name)}</a>
            <div class="bar-track"><div class="bar-fill" style="width:${st.mastery * 100}%"></div></div>
            <span class="val">${pct(st.mastery)}</span></div>`).join('')}</div>
        <div id="mtable" class="table-scroll" hidden><table class="data"><thead><tr><th>Chapter</th><th class="n">Attempts</th><th class="n">Accuracy</th><th class="n">Mastery</th><th class="n">Avg time</th></tr></thead>
          <tbody>${attempted.map(({ c, st }) => `<tr><td>${esc(c.name)}</td><td class="n">${st.attempts}</td><td class="n">${pct(st.accuracy)}</td><td class="n">${pct(st.mastery)}</td><td class="n">${fmtSecs(st.avgTime)}</td></tr>`).join('')}</tbody></table></div>
        ${chapters.length - attempted.length ? `<p class="small faint" style="margin-top:14px">${chapters.length - attempted.length} chapter(s) not started yet.</p>` : ''}
      </div>
      <div class="stack">
        <div class="card">
          <h3 style="margin-bottom:14px">Accuracy by difficulty</h3>
          <div class="bars">${byDiff.map((x) => `<div class="bar-row" style="grid-template-columns:80px 1fr 90px" title="${['', 'Easy', 'Medium', 'Hard'][x.d]}: ${pct(x.acc)} of ${x.n}">
            <span class="label">${['', 'Easy', 'Medium', 'Hard'][x.d]}</span><div class="bar-track"><div class="bar-fill" style="width:${x.acc * 100}%"></div></div>
            <span class="val">${x.n ? pct(x.acc) : '—'} <span class="faint">(${x.n})</span></span></div>`).join('')}</div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:4px">Mock test scores</h3>
          ${s.mocks.length >= 2 ? `<p class="small muted" style="margin-bottom:10px">Score as % of maximum, oldest → newest</p>${mockChart(s.mocks)}`
          : s.mocks.length === 1 ? `<p class="muted small" style="margin-top:8px">One test so far: ${s.mocks[0].score}/${s.mocks[0].max}. Take another to see a trend.</p>`
          : `<p class="muted small" style="margin-top:8px">No mock tests yet. <a href="#/mock">Take one</a>.</p>`}
        </div>
        <div class="card">
          <h3 style="margin-bottom:10px">Focus next</h3>
          ${focusList(chapters)}
        </div>
      </div>
    </div>`;

  $$('#mview button', view).forEach((b) => b.addEventListener('click', () => {
    $$('#mview button', view).forEach((x) => x.classList.toggle('on', x === b));
    $('#mchart', view).hidden = b.dataset.v !== 'chart';
    $('#mtable', view).hidden = b.dataset.v !== 'table';
  }));
  wireChartHover(view);
}

function heatmap() {
  const counts = dayCounts();
  const weeks = 20;
  const t = today();
  const dow = new Date(t + 'T00:00:00').getDay(); // 0 Sun
  const start = addDays(t, (6 - dow) - (weeks * 7 - 1)); // columns are Sun→Sat weeks; last one contains today
  const cells = [];
  const maxC = Math.max(1, ...Object.values(counts));
  for (let i = 0; i < weeks * 7; i++) {
    const d = addDays(start, i);
    if (d > t) { cells.push('<i style="visibility:hidden"></i>'); continue; }
    const n = counts[d] || 0;
    const l = n === 0 ? 0 : Math.min(4, Math.ceil((n / maxC) * 4));
    cells.push(`<i data-l="${l}" title="${d}: ${n} question${n === 1 ? '' : 's'}"></i>`);
  }
  return `<div class="heatmap" role="img" aria-label="Daily activity heatmap">${cells.join('')}</div>
    <div class="heat-legend">Less <i style="background:var(--heat-0)"></i><i style="background:var(--heat-1)"></i><i style="background:var(--heat-2)"></i><i style="background:var(--heat-3)"></i><i style="background:var(--heat-4)"></i> More</div>`;
}

function mockChart(mocks) {
  const pts = mocks.slice(-15).map((m) => ({ v: Math.max(0, m.score) / m.max, m }));
  const W = 460, H = 180, P = { l: 34, r: 12, t: 12, b: 24 };
  const x = (i) => P.l + (pts.length === 1 ? 0 : (i * (W - P.l - P.r)) / (pts.length - 1));
  const y = (v) => P.t + (1 - v) * (H - P.t - P.b);
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join('');
  const area = `${line}L${x(pts.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  return `<div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 ${W} ${H}" role="img" aria-label="Mock test score trend">
    ${[0, 0.25, 0.5, 0.75, 1].map((g) => `<line class="grid-line" x1="${P.l}" x2="${W - P.r}" y1="${y(g)}" y2="${y(g)}"/><text class="axis-text" x="${P.l - 6}" y="${y(g) + 4}" text-anchor="end">${g * 100}%</text>`).join('')}
    <path class="area" d="${area}"/><path class="line" d="${line}"/>
    ${pts.map((p, i) => `<circle class="dot" cx="${x(i)}" cy="${y(p.v)}" r="5"/><rect x="${x(i) - 14}" y="${P.t}" width="28" height="${H - P.t - P.b}" fill="transparent" data-tip="${esc(p.m.title)} · ${new Date(p.m.ts).toLocaleDateString()} · ${p.m.score}/${p.m.max}" data-x="${x(i)}" data-y="${y(p.v)}"/>`).join('')}
  </svg><div class="tooltip" role="tooltip"></div></div>`;
}

function wireChartHover(view) {
  $$('.chart-wrap', view).forEach((wrap) => {
    const tip = $('.tooltip', wrap);
    const svg = $('svg', wrap);
    $$('[data-tip]', wrap).forEach((r) => {
      r.addEventListener('mouseenter', () => {
        const sx = svg.clientWidth / svg.viewBox.baseVal.width;
        tip.textContent = r.dataset.tip;
        tip.style.left = Number(r.dataset.x) * sx + 'px';
        tip.style.top = Number(r.dataset.y) * sx + 'px';
        tip.classList.add('show');
      });
      r.addEventListener('mouseleave', () => tip.classList.remove('show'));
    });
  });
}

function focusList(chapters) {
  const weak = chapters
    .filter((x) => x.st.attempts >= 3)
    .sort((a, b) => a.st.mastery - b.st.mastery)
    .slice(0, 3);
  const unstarted = chapters.filter((x) => x.st.attempts === 0).slice(0, 3 - weak.length);
  const items = [...weak, ...unstarted];
  if (!items.length) return '<p class="muted small">You’re in great shape everywhere — try a full mock test.</p>';
  return `<div class="stack" style="gap:8px">${items.map(({ c, st }) => `<a class="gen-item" href="#/practice/chapter/${c.id}">
    <span><b>${esc(c.name)}</b><br><span class="small faint">${esc(unitById[c.unit].name)} · ${st.attempts ? `${pct(st.accuracy)} accuracy` : 'not started'}</span></span>${ICONS.next.replace('<svg', '<svg width="18" height="18"')}</a>`).join('')}</div>`;
}
