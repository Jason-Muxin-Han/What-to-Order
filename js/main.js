window.NBA = window.NBA || {};

(function (NBA) {
  'use strict';

  const PLAYS = NBA.PLAYS;
  const CATS = NBA.CATEGORIES;
  const E = NBA.Engine;
  const C = NBA.Court;
  const I = NBA.I18N;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);

  const ACTIVE_MODES = new Set(['show', 'switch', 'closeout', 'rim', 'contest', 'chase', 'trap', 'runjump', 'scram']);

  const state = {
    index: 0, cat: CATS[0].id, query: '',
    t: 0, playing: true, speed: 1, mode: 'sync',
    trails: true, links: true, sims: [], lastTs: 0
  };

  let svg, nodes = {}, links = {}, ballG, ballCircle, ballShadow, trailsG, linksG, playersG;

  function el(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function buildStage() {
    svg = $('court');
    svg.setAttribute('viewBox', `0 0 ${C.W} ${C.H}`);
    svg.style.aspectRatio = C.W + ' / ' + C.H;
    svg.innerHTML = `
      ${C.build()}
      <g id="trailLayer"></g>
      <g id="linkLayer"></g>
      <g id="playerLayer"></g>
      <g id="ballLayer"></g>`;
    trailsG = $('trailLayer');
    linksG = $('linkLayer');
    const ballLayer = $('ballLayer');
    playersG = $('playerLayer');
    nodes = {}; links = {};

    ballG = el('g', { id: 'ballNode' });
    ballShadow = el('ellipse', { class: 'ball-shadow', rx: 5, ry: 2, cx: 0, cy: 1 });
    ballCircle = el('circle', { class: 'ball', r: 5.6, cx: 0, cy: 0 });
    ballG.appendChild(ballShadow);
    ballG.appendChild(ballCircle);
    ballLayer.appendChild(ballG);

    for (const id of E.OFF_IDS) {
      const g = el('g', { class: 'player off', id: 'node-' + id });
      const halo = el('circle', { class: 'halo', r: 16 });
      const body = el('circle', { class: 'body', r: 12 });
      const label = el('text', { class: 'label', x: 0, y: .5 });
      label.textContent = id.slice(1);
      g.appendChild(halo); g.appendChild(body); g.appendChild(label);
      playersG.appendChild(g);
      nodes[id] = { g, halo };
      const tr = el('polyline', { class: 'trail', id: 'trail-' + id, fill: 'none' });
      trailsG.appendChild(tr);
    }
    for (const id of E.DEF_IDS) {
      const g = el('g', { class: 'player def', id: 'node-' + id });
      const halo = el('circle', { class: 'halo', r: 16 });
      const body = el('rect', { class: 'body', x: -9, y: -9, width: 18, height: 18, rx: 3, transform: 'rotate(45)' });
      const label = el('text', { class: 'label', x: 0, y: .5 });
      label.textContent = id.slice(1);
      g.appendChild(halo); g.appendChild(body); g.appendChild(label);
      playersG.appendChild(g);
      nodes[id] = { g, halo };
      const l = el('line', { class: 'deflink', id: 'link-' + id });
      linksG.appendChild(l);
      links[id] = l;
    }
    for (const id of E.DEF_IDS) playersG.insertBefore(nodes[id].g, playersG.firstChild);
    trailsG.style.display = state.trails ? '' : 'none';
    linksG.style.display = state.links ? '' : 'none';
    fitCourt();
    requestAnimationFrame(fitCourt);
  }

  /* 给 SVG 一个确定的像素高度，避免百分比高度在 grid/flex 中撑开整页 */
  function fitCourt() {
    const box = document.querySelector('.court-box');
    if (!box || !svg) return;
    if (window.innerWidth <= 560) { svg.style.height = ''; return; }
    const h = box.clientHeight;
    if (h > 0) svg.style.height = h + 'px';
  }

  function buildCatTabs() {
    const wrap = $('catTabs');
    wrap.innerHTML = '';
    const en = I.lang === 'en';
    CATS.forEach(c => {
      const b = document.createElement('button');
      b.className = 'cat-tab' + (c.id === state.cat ? ' active' : '');
      const label = I.catName(c.id) || c.name;
      const court = en ? (c.court === 'full' ? 'Full' : 'Half') : (c.court === 'full' ? '全场' : '半场');
      b.innerHTML = `<span class="cat-name">${label}</span><span class="cat-meta">15 ${I.t('sets')} · ${court}</span>`;
      b.addEventListener('click', () => setCategory(c.id));
      wrap.appendChild(b);
    });
  }

  function playSearchText(p) {
    if (I.lang === 'en') {
      return [p.en, p.name, I.playField(p.id, 'era') || '', I.playField(p.id, 'desc') || '', I.catName(p.type) || ''].join(' ').toLowerCase();
    }
    return [p.name, p.en, p.era, p.desc, p.typeName].join(' ').toLowerCase();
  }

  function visibleIndices() {
    const q = state.query.trim().toLowerCase();
    const all = PLAYS.map((p, i) => i);
    if (!q) return all.filter(i => PLAYS[i].type === state.cat);
    return all.filter(i => playSearchText(PLAYS[i]).includes(q));
  }

  function buildPlayList() {
    const wrap = $('playList');
    const idxs = visibleIndices();
    const en = I.lang === 'en';
    wrap.innerHTML = '';
    if (!idxs.length) wrap.innerHTML = `<div class="lib-empty">${I.t('noMatch')}</div>`;
    idxs.forEach(i => {
      const p = PLAYS[i];
      const era = I.playField(p.id, 'era') || p.era;
      const desc = I.playField(p.id, 'desc') || p.desc;
      const cat = I.catName(p.type) || p.typeName;
      const b = document.createElement('button');
      b.className = 'play-item' + (i === state.index ? ' active' : '');
      b.title = era + '\n' + desc;
      b.innerHTML = `<span class="play-num">${String(p.index).padStart(2, '0')} · ${cat}</span>` +
        `<span class="play-name">${en ? p.en : p.name}</span>` +
        `<span class="play-era">${era}</span>`;
      b.addEventListener('click', () => selectPlay(i));
      wrap.appendChild(b);
    });
    $('libCount').textContent = idxs.length + ' / 90 ' + I.t('sets');
    $('libHint').textContent = state.query.trim() ? I.t('libHintSearch') : I.catNote(state.cat);
  }

  function buildTicks() {
    const wrap = $('ticks');
    wrap.innerHTML = '';
    currentPlay().notes.forEach((n, i) => {
      const b = document.createElement('button');
      b.className = 'tick';
      b.style.left = (n.t * 100) + '%';
      const ne = I.noteEn(currentPlay(), i);
      b.title = I.t('noteStage') + ' ' + (i + 1) + ' · ' + ((I.lang === 'en' && ne) ? ne.o : n.o);
      b.addEventListener('click', ev => {
        ev.stopPropagation();
        state.t = n.t; state.playing = false; syncPlayBtn(); render(); writeHash();
      });
      wrap.appendChild(b);
    });
  }

  function setCategory(id) {
    state.cat = id;
    state.query = '';
    $('searchInput').value = '';
    const first = PLAYS.findIndex(p => p.type === id);
    buildCatTabs();
    selectPlay(first < 0 ? 0 : first);
  }

  function currentPlay() { return PLAYS[state.index]; }
  function currentSim() {
    if (!state.sims[state.index]) state.sims[state.index] = E.simulate(currentPlay());
    return state.sims[state.index];
  }

  function writeHash() {
    const tail = state.mode === 'turn' ? '&mode=turn' : '';
    const lang = I.lang === 'en' ? '&lang=en' : '';
    try {
      history.replaceState(null, '', '#play=' + currentPlay().id + '&t=' + state.t.toFixed(2) + tail + lang);
    } catch (e) { /* file:// 下忽略 */ }
  }

  function updatePlayInfo() {
    const p = currentPlay();
    const en = I.lang === 'en';
    $('playName').textContent = en ? p.en : p.name;
    $('playEn').textContent = en
      ? p.name + ' · ' + (I.catName(p.type) || p.typeName)
      : p.en + ' · ' + p.typeName;
    $('playEra').textContent = I.playField(p.id, 'era') || p.era;
    $('playDesc').textContent = I.playField(p.id, 'desc') || p.desc;
    $('playTag').textContent = en ? (I.catName(p.type) || p.typeName) : (p.tag || p.typeName);
    $('viewLabel').textContent = I.t(p.court === 'full' ? 'viewFull' : 'viewHalf') + ' · ' + I.t('unitFt');
  }

  function selectPlay(i) {
    state.index = i;
    state.t = 0;
    state.playing = true;
    const p = currentPlay();
    if (p.type !== state.cat) state.cat = p.type;

    C.setView(p.court);
    buildStage();
    buildCatTabs();
    buildPlayList();
    buildTicks();
    updatePlayInfo();
    for (const id of E.OFF_IDS) $('trail-' + id).setAttribute('points', C.poly(E.trailPoints(p, id)));
    syncPlayBtn();
    render();
    writeHash();
  }

  function syncPlayBtn() {
    const b = $('playBtn');
    b.textContent = state.playing ? I.t('pause') : I.t('play');
    b.classList.toggle('is-playing', state.playing);
  }

  function noteAt(p, t) {
    let n = p.notes[0], idx = 0;
    p.notes.forEach((item, i) => { if (t >= item.t) { n = item; idx = i; } });
    return { n, idx };
  }

  function render() {
    const sim = currentSim();
    const p = currentPlay();
    const f = E.frameAt(sim, state.t, state.mode);

    for (const id of E.OFF_IDS) {
      const q = f.off[id];
      const px = C.P(q[0], q[1]);
      nodes[id].g.setAttribute('transform', `translate(${px[0].toFixed(2)},${px[1].toFixed(2)})`);
      nodes[id].halo.classList.toggle('carrier', f.ball.holder === id);
    }
    for (const id of E.DEF_IDS) {
      const q = f.def[id];
      const pd = C.P(q.p[0], q.p[1]);
      nodes[id].g.setAttribute('transform', `translate(${pd[0].toFixed(2)},${pd[1].toFixed(2)})`);
      nodes[id].halo.classList.toggle('reacting', ACTIVE_MODES.has(q.mode));
      const m = f.off[q.mark] || f.off.O1;
      const pm = C.P(m[0], m[1]);
      links[id].setAttribute('x1', pd[0]); links[id].setAttribute('y1', pd[1]);
      links[id].setAttribute('x2', pm[0]); links[id].setAttribute('y2', pm[1]);
    }

    const bp = C.P(f.ball.pos[0], f.ball.pos[1]);
    ballG.setAttribute('transform', `translate(${bp[0].toFixed(2)},${bp[1].toFixed(2)})`);
    const bounce = f.ball.state === 'bounce' || f.ball.state === 'handoff';
    const lift = bounce ? -f.ball.lift * .4 : -f.ball.lift * 2.2;
    ballCircle.setAttribute('cy', lift.toFixed(2));
    ballCircle.setAttribute('r', (5.6 + Math.abs(lift) * .012).toFixed(2));
    ballShadow.setAttribute('opacity', Math.max(.12, .38 - Math.abs(lift) * .004).toFixed(2));
    ballG.style.opacity = f.ball.state === 'dead' ? '.35' : '1';

    $('clock').textContent = (state.t * p.duration).toFixed(2) + ' s';
    $('duration').textContent = p.duration.toFixed(1) + ' s';
    $('scrub').value = Math.round(state.t * 1000);

    const { n, idx } = noteAt(p, state.t);
    const ne = I.noteEn(p, idx);
    $('noteStage').textContent = I.t('noteStage') + ' ' + (idx + 1) + ' ' + I.t('of') + ' ' + p.notes.length;
    $('noteOff').textContent = (I.lang === 'en' && ne) ? ne.o : n.o;
    $('noteDef').textContent = (I.lang === 'en' && ne) ? ne.d : n.d;

    $('defState').innerHTML = E.DEF_IDS.map(id => {
      const q = f.def[id];
      const active = ACTIVE_MODES.has(q.mode) ? ' active' : '';
      return `<div class="def-row${active}"><span class="def-id">${id}</span>` +
        `<span class="def-mode">${I.mode(q.mode)}</span>` +
        `<span class="def-mark">→ ${q.mark}</span></div>`;
    }).join('');

    $('barOff').style.width = (f.tOff * 100).toFixed(1) + '%';
    $('barDef').style.width = (f.tDef * 100).toFixed(1) + '%';
    $('syncBars').classList.toggle('desync', state.mode === 'turn' && Math.abs(f.tOff - f.tDef) > .02);
    $('syncCaption').textContent = state.mode === 'sync'
      ? I.t('syncCaption')
      : (f.tDef === 0 ? I.t('desyncA') : I.t('desyncB'));
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-mode]').forEach(x => x.classList.toggle('active', x.dataset.mode === mode));
    $('modeHint').textContent = I.t(mode === 'sync' ? 'modeHintSync' : 'modeHintTurn');
    $('modeFlag').textContent = I.t(mode === 'sync' ? 'flagSync' : 'flagTurn');
    $('modeFlag').classList.toggle('warn', mode === 'turn');
    render();
  }

  function applyLang() {
    document.documentElement.lang = I.lang === 'en' ? 'en' : 'zh-CN';
    document.title = I.lang === 'en'
      ? 'Sync Tactics Board · 90 NBA Plays'
      : '攻防同步战术板 · 90 套 NBA 战术';
    document.querySelectorAll('[data-i18n]').forEach(n => { n.textContent = I.t(n.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(n => { n.placeholder = I.t(n.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('active', b.dataset.lang === I.lang));
    buildCatTabs();
    buildPlayList();
    buildTicks();
    updatePlayInfo();
    syncPlayBtn();
    setMode(state.mode);
  }

  function bindControls() {
    $('playBtn').addEventListener('click', () => {
      if (state.t >= .999) state.t = 0;
      state.playing = !state.playing;
      syncPlayBtn(); render();
    });
    $('resetBtn').addEventListener('click', () => {
      state.t = 0; state.playing = false; syncPlayBtn(); render();
    });
    $('scrub').addEventListener('input', ev => {
      state.t = Number(ev.target.value) / 1000;
      state.playing = false; syncPlayBtn(); render();
    });
    $('searchInput').addEventListener('input', ev => {
      state.query = ev.target.value;
      buildCatTabs(); buildPlayList();
    });
    document.querySelectorAll('[data-lang]').forEach(b => {
      b.addEventListener('click', () => {
        I.set(b.dataset.lang);
        try { localStorage.setItem('nba-board-lang', I.lang); } catch (e) { /* file:// 下忽略 */ }
        applyLang();
        writeHash();
      });
    });
    document.querySelectorAll('[data-speed]').forEach(b => {
      b.addEventListener('click', () => {
        state.speed = Number(b.dataset.speed);
        document.querySelectorAll('[data-speed]').forEach(x => x.classList.toggle('active', x === b));
      });
    });
    document.querySelectorAll('[data-mode]').forEach(b => {
      b.addEventListener('click', () => { setMode(b.dataset.mode); writeHash(); });
    });
    $('toggleTrails').addEventListener('change', ev => {
      state.trails = ev.target.checked;
      trailsG.style.display = state.trails ? '' : 'none';
    });
    $('toggleLinks').addEventListener('change', ev => {
      state.links = ev.target.checked;
      linksG.style.display = state.links ? '' : 'none';
    });
    document.addEventListener('keydown', ev => {
      if (ev.target.tagName === 'INPUT') return;
      if (ev.code === 'Space') { ev.preventDefault(); $('playBtn').click(); }
      if (ev.code === 'ArrowRight') { state.t = Math.min(1, state.t + .02); state.playing = false; syncPlayBtn(); render(); }
      if (ev.code === 'ArrowLeft') { state.t = Math.max(0, state.t - .02); state.playing = false; syncPlayBtn(); render(); }
    });
  }

  function loop(ts) {
    if (!state.lastTs) state.lastTs = ts;
    const dt = Math.min(.06, (ts - state.lastTs) / 1000);
    state.lastTs = ts;
    if (state.playing) {
      state.t += dt * state.speed / currentPlay().duration;
      if (state.t >= 1) state.t = state.t % 1;
      render();
    }
    requestAnimationFrame(loop);
  }

  function init() {
    state.sims = new Array(PLAYS.length);
    buildCatTabs();
    bindControls();
    window.addEventListener('resize', fitCourt);

    const hash = location.hash;
    const lm = hash.match(/lang=(zh|en)/);
    let lang = lm ? lm[1] : null;
    if (!lang) { try { lang = localStorage.getItem('nba-board-lang'); } catch (e) { /* file:// 下忽略 */ } }
    I.set(lang || 'zh');

    const pm = hash.match(/play=([a-z0-9]+)/);
    const found = pm ? PLAYS.findIndex(p => p.id === pm[1]) : -1;
    selectPlay(found >= 0 ? found : 0);
    applyLang();
    const tMatch = hash.match(/t=([0-9]*\.?[0-9]+)/);
    if (tMatch) {
      state.t = Math.max(0, Math.min(1, Number(tMatch[1])));
      state.playing = false;
      syncPlayBtn();
      render();
    }
    const modeMatch = hash.match(/mode=(sync|turn)/);
    if (modeMatch) setMode(modeMatch[1]);
    requestAnimationFrame(loop);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})(window.NBA);
