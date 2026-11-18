window.NBA = window.NBA || {};

(function (NBA) {
  'use strict';

  /* 两种视图共用同一套英尺坐标：
     half —— 竖版半场，y ∈ [0,47]，篮筐 (0,5.25) 画在下方
     full —— 横置全场，y ∈ [0,94]，本方筐 (0,5.25) 在左、对方筐 (0,88.75) 在右 */
  let kind = 'half';
  const M = 20, S = 10;

  function P(x, y) {
    return kind === 'half'
      ? [M + (x + 25) * S, M + (47 - y) * S]
      : [M + y * S, M + (25 - x) * S];
  }
  const poly = pts => pts.map(p => {
    const q = P(p[0], p[1]);
    return q[0].toFixed(1) + ',' + q[1].toFixed(1);
  }).join(' ');
  function line(x1, y1, x2, y2, cls) {
    const a = P(x1, y1), b = P(x2, y2);
    return `<line class="${cls}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}"/>`;
  }

  /* 以 base 为底线、dir 为朝向画一组半场线条；全场视图复用两次 */
  function halfLines(base, dir) {
    const Q = (x, d) => [x, base + dir * d];
    const out = [];
    const r = 23.75;
    const three = [Q(-22, 0), Q(-22, 14.2)];
    for (let x = -22; x <= 22; x += .6) three.push(Q(x, 5.25 + Math.sqrt(r * r - x * x)));
    three.push(Q(22, 14.2), Q(22, 0));

    const paint = [Q(-8, 0), Q(8, 0), Q(8, 19), Q(-8, 19), Q(-8, 0)];
    const paintEdge = [Q(-8, 0), Q(-8, 19), Q(8, 19), Q(8, 0)];
    const ftTop = [], ftBottom = [], restricted = [];
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI * i / 36;
      ftTop.push(Q(6 * Math.cos(a), 19 + 6 * Math.sin(a)));
      const b = Math.PI + a;
      ftBottom.push(Q(6 * Math.cos(b), 19 + 6 * Math.sin(b)));
    }
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI * i / 24;
      restricted.push(Q(4 * Math.cos(a), 5.25 + 4 * Math.sin(a)));
    }
    const hoop = P(0, base + dir * 5.25);
    const bb = base + dir * 4;

    out.push(`<polygon class="paint" points="${poly(paint)}"/>`);
    out.push(`<polyline class="courtline" fill="none" points="${poly(paintEdge)}"/>`);
    out.push(`<polyline class="courtline" fill="none" points="${poly(three)}"/>`);
    out.push(`<polyline class="courtline" fill="none" points="${poly(ftTop)}"/>`);
    out.push(`<polyline class="courtline dashed" fill="none" points="${poly(ftBottom)}"/>`);
    out.push(`<polyline class="courtline thin" fill="none" points="${poly(restricted)}"/>`);
    out.push(line(-3, bb, 3, bb, 'backboard'));
    out.push(`<circle class="rim" cx="${hoop[0].toFixed(1)}" cy="${hoop[1].toFixed(1)}" r="7.5"/>`);
    return out;
  }

  function buildHalf() {
    const grid = [];
    for (let x = -20; x <= 20; x += 5) grid.push(line(x, 0, x, 47, 'grid'));
    for (let y = 5; y <= 45; y += 5) grid.push(line(-25, y, 25, y, 'grid'));
    const centerHalf = [];
    for (let i = 0; i <= 36; i++) {
      const a = Math.PI + Math.PI * i / 36;
      centerHalf.push([6 * Math.cos(a), 47 + 6 * Math.sin(a)]);
    }
    return `<g id="court-static">
      <rect class="floor" x="20" y="20" width="500" height="470" rx="4"/>
      <g class="grid-wrap">${grid.join('')}</g>
      ${halfLines(0, 1).join('')}
      <rect class="bounds" x="20" y="20" width="500" height="470" rx="4" fill="none"/>
      ${line(-25, 47, 25, 47, 'courtline')}
      <polyline class="courtline" fill="none" points="${poly(centerHalf)}"/>
      ${line(-11, 0, -11, 3, 'courtline thin')}
      ${line(11, 0, 11, 3, 'courtline thin')}
      <text class="court-label" x="40" y="478">3PT 23'9"</text>
      <text class="court-label" x="270" y="38" text-anchor="middle">HALF COURT · FT</text>
    </g>`;
  }

  function buildFull() {
    const grid = [];
    for (let y = 10; y < 94; y += 10) grid.push(line(-25, y, 25, y, 'grid'));
    for (let x = -20; x <= 20; x += 10) grid.push(line(x, 0, x, 94, 'grid'));
    const mid = P(0, 47);
    return `<g id="court-static">
      <rect class="floor" x="20" y="20" width="940" height="500" rx="4"/>
      <g class="grid-wrap">${grid.join('')}</g>
      ${halfLines(0, 1).join('')}
      ${halfLines(94, -1).join('')}
      <rect class="bounds" x="20" y="20" width="940" height="500" rx="4" fill="none"/>
      ${line(-25, 47, 25, 47, 'courtline')}
      <circle class="courtline" cx="${mid[0].toFixed(1)}" cy="${mid[1].toFixed(1)}" r="60" fill="none"/>
      <text class="court-label" x="34" y="512">DEFENSIVE END</text>
      <text class="court-label" x="946" y="512" text-anchor="end">OFFENSIVE END</text>
      <text class="court-label" x="490" y="38" text-anchor="middle">FULL COURT · 94 FT</text>
    </g>`;
  }

  NBA.Court = {
    setView(k) { kind = (k === 'full') ? 'full' : 'half'; },
    get kind() { return kind; },
    get W() { return kind === 'full' ? 980 : 540; },
    get H() { return kind === 'full' ? 540 : 510; },
    P, poly, line,
    build() { return kind === 'full' ? buildFull() : buildHalf(); }
  };
})(window.NBA);
