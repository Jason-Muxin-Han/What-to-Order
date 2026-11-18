window.NBA = window.NBA || {};

(function (NBA) {
  'use strict';

  const HOOP = NBA.HOOP;
  const OFF_IDS = ['O1', 'O2', 'O3', 'O4', 'O5'];
  const DEF_IDS = ['X1', 'X2', 'X3', 'X4', 'X5'];
  const STEPS = 240;

  const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const unit = (v) => {
    const l = Math.hypot(v[0], v[1]) || 1;
    return [v[0] / l, v[1] / l];
  };
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const mix = (a, b, u) => a + (b - a) * u;

  /* 非匀速关键帧之间的 Catmull-Rom 平滑，避免折线式的机械跑动 */
  function trackAt(track, t) {
    const n = track.length;
    if (t <= track[0][0]) return [track[0][1], track[0][2]];
    if (t >= track[n - 1][0]) return [track[n - 1][1], track[n - 1][2]];
    let i = 0;
    while (i < n - 2 && track[i + 1][0] < t) i++;
    const p0 = track[Math.max(0, i - 1)];
    const p1 = track[i];
    const p2 = track[i + 1];
    const p3 = track[Math.min(n - 1, i + 2)];
    const span = p2[0] - p1[0] || 1;
    const u = clamp((t - p1[0]) / span, 0, 1);
    const u2 = u * u, u3 = u2 * u;
    const out = [0, 0];
    for (let k = 1; k <= 2; k++) {
      const a = p1[k], b = p2[k];
      const m1 = (p2[k] - p0[k]) * 0.5;
      const m2 = (p3[k] - p1[k]) * 0.5;
      out[k - 1] = (2 * u3 - 3 * u2 + 1) * a
        + (u3 - 2 * u2 + u) * m1
        + (-2 * u3 + 3 * u2) * b
        + (u3 - u2) * m2;
    }
    return out;
  }

  function allOffAt(play, t) {
    const out = {};
    for (const id of OFF_IDS) out[id] = trackAt(play.off[id], t);
    return out;
  }

  /* 球的位置：跟随持球人 / 传球飞行 / 投篮飞行，飞行弧高用于渲染 */
  function ballAt(play, t, off) {
    const segs = play.ball;
    let seg = segs[0], nextT = 1;
    for (let i = 0; i < segs.length; i++) {
      if (t >= segs[i].t) { seg = segs[i]; nextT = segs[i + 1] ? segs[i + 1].t : 1; }
      else break;
    }
    if (seg.holder) {
      const p = off[seg.holder];
      const ahead = trackAt(play.off[seg.holder], Math.min(1, t + 0.02));
      const d = unit([ahead[0] - p[0], ahead[1] - p[1]]);
      return { pos: [p[0] + d[0] * 1.1, p[1] + d[1] * 1.1], lift: 0, holder: seg.holder, state: 'held' };
    }
    if (seg.type === 'pass' || seg.type === 'shot') {
      const f = clamp((t - seg.t) / (seg.flight || .1), 0, 1);
      const from = off[seg.from];
      const to = seg.to === 'HOOP' ? (play.hoop || HOOP) : off[seg.to];
      const pos = lerp(from, to, f);
      const lift = Math.sin(Math.PI * f) * (seg.arc || 6);
      return { pos, lift, holder: seg.to === 'HOOP' ? null : seg.to, state: seg.style || seg.type };
    }
    return { pos: HOOP.slice(), lift: 0, holder: null, state: 'dead' };
  }

  function activeRule(rules, t) {
    let r = rules[0];
    for (const item of rules) { if (t >= item.t) r = item; else break; }
    return r;
  }

  /* 防守目标点：完全由「当前进攻站位 + 球 + 要保护的篮筐」推导，没有预设终点 */
  function defTarget(rule, ctx, mark) {
    const hoop = ctx.hoop || HOOP;
    const p = ctx.off[mark] || ctx.off.O1;
    const ball = ctx.ball;
    const holder = ctx.holder;
    const target = holder ? ctx.off[holder] : ball;
    const toHoop = unit([hoop[0] - p[0], hoop[1] - p[1]]);
    const toBall = unit([ball[0] - p[0], ball[1] - p[1]]);
    const q = rule.mark ? ctx.off[rule.mark] : p;

    switch (rule.mode) {
      case 'onball': {
        const d = unit([hoop[0] - target[0], hoop[1] - target[1]]);
        return [target[0] + d[0] * rule.gap, target[1] + d[1] * rule.gap];
      }
      case 'chase': {
        const d = unit([hoop[0] - target[0], hoop[1] - target[1]]);
        const side = [-d[1], d[0]];
        const s = rule.side || 1;
        return [target[0] + d[0] * rule.gap + side[0] * 1.8 * s,
                target[1] + d[1] * rule.gap + side[1] * 1.8 * s];
      }
      case 'deny':
      case 'faceguard':
        return [p[0] + toBall[0] * rule.gap, p[1] + toBall[1] * rule.gap];
      case 'press': {
        const d = unit([ball[0] - p[0], ball[1] - p[1]]);
        return [p[0] + d[0] * (rule.gap || 1.9), p[1] + d[1] * (rule.gap || 1.9)];
      }
      case 'gap':
        return [p[0] + (toBall[0] * .6 + toHoop[0] * .4) * rule.gap,
                p[1] + (toBall[1] * .6 + toHoop[1] * .4) * rule.gap];
      case 'show':
        return [p[0] + toBall[0] * rule.push, p[1] + toBall[1] * rule.push];
      case 'drop':
        return lerp(ball, hoop, rule.depth || .2);
      case 'help': {
        const anchor = lerp(ball, hoop, .45);
        let out = lerp(p, anchor, rule.w);
        const dv = [out[0] - p[0], out[1] - p[1]];
        const dist = Math.hypot(dv[0], dv[1]);
        const cap = rule.cap || 7;
        if (dist > cap) out = [p[0] + dv[0] * cap / dist, p[1] + dv[1] * cap / dist];
        return out;
      }
      case 'nail':
        return lerp(p, [0, 19], rule.w || .55);
      case 'rim':
      case 'safety':
        return lerp(ball, hoop, rule.mode === 'safety' ? .22 : .72);
      /* 区域联防：守固定区域，整体随球横移，而不是跟人 */
      case 'zone': {
        const a = rule.anchor || [0, 14];
        const fx = clamp(ball[0] * (rule.follow === undefined ? .22 : rule.follow), -3.4, 3.4);
        const fy = clamp((ball[1] - a[1]) * (rule.followY === undefined ? .08 : rule.followY), -7, 7);
        return [a[0] + fx, a[1] + fy];
      }
      /* 双人夹击 / 紧逼扑抢：从持球人侧翼合围 */
      case 'trap':
      case 'runjump': {
        const d = unit([hoop[0] - ball[0], hoop[1] - ball[1]]);
        const side = [-d[1], d[0]];
        const s = rule.side || 1;
        const gap = rule.gap || 2.0;
        return [ball[0] + side[0] * gap * s + d[0] * 1.1,
                ball[1] + side[1] * gap * s + d[1] * 1.1];
      }
      case 'switch':
      case 'scram': {
        const d = unit([hoop[0] - q[0], hoop[1] - q[1]]);
        return [q[0] + d[0] * 2.6, q[1] + d[1] * 2.6];
      }
      case 'closeout': {
        const d = unit([hoop[0] - q[0], hoop[1] - q[1]]);
        return [q[0] + d[0] * rule.gap, q[1] + d[1] * rule.gap];
      }
      case 'contest':
        return [q[0] + toHoop[0] * 1.3, q[1] + toHoop[1] * 1.3];
      default:
        return [p[0] + toHoop[0] * 2.6, p[1] + toHoop[1] * 2.6];
    }
  }

  /*
   * 整条时间轴一次性仿真：进攻与防守在每一个时间步同时求值，
   * 防守目标进环形缓冲实现「反应延迟」，再受最大速度约束，
   * 因此会出现真实的被甩开 / 追赶 / 轮转，而不是瞬移或分段等待。
   */
  function simulate(play) {
    const dt = play.duration / STEPS;
    const maxY = play.court === 'full' ? 93 : 46;
    const offFrames = [], ballFrames = [], defFrames = [];
    const state = {};
    for (const id of DEF_IDS) {
      const cfg = play.def[id];
      state[id] = { pos: null, mark: cfg.mark, hist: [], delaySteps: Math.round(cfg.delay / dt) };
    }

    for (let k = 0; k <= STEPS; k++) {
      const t = k / STEPS;
      const off = allOffAt(play, t);
      const ball = ballAt(play, t, off);
      const ctx = { off, ball: ball.pos, holder: ball.holder, hoop: play.hoop || HOOP };
      const def = {};

      for (const id of DEF_IDS) {
        const cfg = play.def[id];
        const s = state[id];
        const rule = activeRule(cfg.rules, t);
        if (rule.mark) s.mark = rule.mark;
        const target = defTarget(rule, ctx, s.mark);
        s.hist.push(target);

        const delayed = s.hist[Math.max(0, k - s.delaySteps)];
        if (s.pos === null) s.pos = delayed.slice();
        else {
          const maxSpeed = rule.maxSpeed || cfg.speed || 14;
          let vx = (delayed[0] - s.pos[0]) / dt;
          let vy = (delayed[1] - s.pos[1]) / dt;
          const v = Math.hypot(vx, vy);
          if (v > maxSpeed) { vx *= maxSpeed / v; vy *= maxSpeed / v; }
          s.pos = [s.pos[0] + vx * dt, s.pos[1] + vy * dt];
        }
        def[id] = {
          p: [clamp(s.pos[0], -24.5, 24.5), clamp(s.pos[1], 1, maxY)],
          mark: s.mark,
          mode: rule.mode
        };
      }

      /* 贴身对抗与协同轮转的重叠：柔和分离，并回写仿真状态，避免帧间瞬移 */
      for (let pass = 0; pass < 2; pass++) {
        for (const did of DEF_IDS) {
          for (const oid of OFF_IDS) {
            const D = def[did].p, O = off[oid];
            let dx = D[0] - O[0], dy = D[1] - O[1];
            const d = Math.hypot(dx, dy);
            if (d >= 1.45) continue;
            if (d < 1e-4) { dx = .7; dy = .7; }
            const l = Math.hypot(dx, dy) || 1;
            const step = (1.45 - d) * .55 / l;
            def[did].p = [D[0] + dx * step, D[1] + dy * step];
          }
        }
        for (let a = 0; a < DEF_IDS.length; a++) {
          for (let b = a + 1; b < DEF_IDS.length; b++) {
            const A = def[DEF_IDS[a]].p, B = def[DEF_IDS[b]].p;
            let dx = B[0] - A[0], dy = B[1] - A[1];
            let d = Math.hypot(dx, dy);
            if (d >= 2.6) continue;
            if (d < 1e-4) { dx = (b - a) * .7; dy = (a % 2 ? 1 : -1) * .7; d = Math.hypot(dx, dy); }
            const step = (2.6 - d) * .55 / (2 * d);
            def[DEF_IDS[a]].p = [A[0] - dx * step, A[1] - dy * step];
            def[DEF_IDS[b]].p = [B[0] + dx * step, B[1] + dy * step];
          }
        }
      }
      for (const id of DEF_IDS) {
        const q = def[id].p;
        def[id].p = [clamp(q[0], -24.5, 24.5), clamp(q[1], 1, maxY)];
        state[id].pos = def[id].p.slice();
      }
      offFrames.push(off);
      ballFrames.push(ball);
      defFrames.push(def);
    }
    return { play, steps: STEPS, dt, offFrames, ballFrames, defFrames };
  }

  function sampleVec(frames, t) {
    const x = clamp(t, 0, 1) * STEPS;
    const i = Math.floor(x), u = x - i;
    const a = frames[Math.min(STEPS, i)], b = frames[Math.min(STEPS, i + 1)];
    if (!a) return null;
    return lerp(a, b, u);
  }

  function frameAt(sim, t, mode) {
    const sync = mode !== 'turn';
    const tOff = sync ? t : Math.min(1, t * 2);
    const tDef = sync ? t : Math.max(0, (t - .5) * 2);
    const idxOff = clamp(tOff, 0, 1) * STEPS;
    const idxDef = clamp(tDef, 0, 1) * STEPS;
    const io = Math.floor(idxOff), id = Math.floor(idxDef);
    const uo = idxOff - io, ud = idxDef - id;
    const oa = sim.offFrames[Math.min(STEPS, io)], ob = sim.offFrames[Math.min(STEPS, io + 1)];
    const da = sim.defFrames[Math.min(STEPS, id)], db = sim.defFrames[Math.min(STEPS, id + 1)];
    const ballA = sim.ballFrames[Math.min(STEPS, io)], ballB = sim.ballFrames[Math.min(STEPS, io + 1)];

    const off = {}, def = {};
    for (const key of OFF_IDS) off[key] = lerp(oa[key], ob[key], uo);
    for (const key of DEF_IDS) {
      def[key] = {
        p: lerp(da[key].p, db[key].p, ud),
        mark: ud < .5 ? da[key].mark : db[key].mark,
        mode: ud < .5 ? da[key].mode : db[key].mode
      };
    }
    const nearBall = uo < .5 ? ballA : ballB;
    const ball = {
      pos: lerp(ballA.pos, ballB.pos, uo),
      lift: mix(ballA.lift, ballB.lift, uo),
      holder: nearBall.holder,
      state: nearBall.state
    };
    return { off, def, ball, tOff, tDef };
  }

  function trailPoints(play, id) {
    const pts = [];
    for (let i = 0; i <= 70; i++) pts.push(trackAt(play.off[id], i / 70));
    return pts;
  }

  NBA.Engine = {
    OFF_IDS, DEF_IDS, STEPS,
    trackAt, allOffAt, ballAt, simulate, frameAt, trailPoints,
    activeRule
  };
})(window.NBA);
