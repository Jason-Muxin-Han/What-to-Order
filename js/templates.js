window.NBA = window.NBA || {};

/* 参数化战术骨架：一套骨架通过左右镜像、终结方式与阵型参数生成多套不同跑位。
   所有坐标仍为英尺；half 战术 y∈[0,47]，full 战术 y∈[0,94]。 */
(function (NBA) {
  'use strict';

  const HHOOP = [0, 5.25];
  const FHOOP = [0, 88.75];
  const K = (t, x, y) => [t, x, y];
  const N = (t, o, d) => ({ t, o, d });
  const D = (mark, delay, speed, rules) => ({ mark, delay, speed, rules });
  const FINISH_TO = { rim: 'O5', corner3: 'O3', trail3: 'O4', mid: 'O1', lob: 'O5' };

  /* 生成一条「持球 → 传球 → 出手」的球权时间线；to === from 时视为不传球直接出手 */
  function B(holder, passT, from, to, flight, arc, shotT, shotArc, style) {
    const segs = [{ t: 0, holder }];
    if (to && to !== from) {
      segs.push({ t: passT, type: 'pass', from, to, flight, arc, style });
      segs.push({ t: passT + flight, holder: to });
      segs.push({ t: shotT, type: 'shot', from: to, to: 'HOOP', flight: .12, arc: shotArc });
    } else {
      segs.push({ t: shotT, type: 'shot', from: from, to: 'HOOP', flight: .14, arc: shotArc });
    }
    segs.push({ t: 1, type: 'dead' });
    return segs;
  }

  function shotArc(f) { return f === 'rim' || f === 'lob' ? 10 : f === 'mid' ? 14 : 18; }
  function target(f) { return FINISH_TO[f] || 'O5'; }

  /* 半场进攻里的标准对手防守（10 人同帧求值，含挤掩护、协防、扑防） */
  function halfDef(s) {
    return {
      X1: D('O1', .10, 15, [
        { t: 0, mode: 'onball', gap: 3.0 },
        { t: .32, mode: 'chase', gap: 2.4, side: -s },
        { t: .56, mode: 'onball', gap: 2.6 },
        { t: .76, mode: 'help', w: .32 },
        { t: .9, mode: 'rim' }
      ]),
      X2: D('O2', .16, 13, [
        { t: 0, mode: 'deny', gap: 2.4 },
        { t: .48, mode: 'help', w: .32 },
        { t: .72, mode: 'closeout', mark: 'O2', gap: 2.2 },
        { t: .88, mode: 'contest', mark: 'O2' }
      ]),
      X3: D('O3', .18, 13, [
        { t: 0, mode: 'deny', gap: 2.6 },
        { t: .5, mode: 'help', w: .36 },
        { t: .78, mode: 'rim' }
      ]),
      X4: D('O4', .18, 13, [
        { t: 0, mode: 'gap', gap: 2.6 },
        { t: .5, mode: 'deny', gap: 2.4 },
        { t: .8, mode: 'help', w: .3 }
      ]),
      X5: D('O5', .12, 14, [
        { t: 0, mode: 'gap', gap: 2.6 },
        { t: .28, mode: 'show', push: 3.2 },
        { t: .48, mode: 'drop', depth: .2 },
        { t: .66, mode: 'onball', gap: 2.8, mark: 'O5' },
        { t: .86, mode: 'rim' }
      ])
    };
  }

  /* 全场推进时的对手回防：速度上限更高，护框与扑外线必须同一拍完成 */
  function fullRetreat(s) {
    return {
      X1: D('O1', .10, 19, [
        { t: 0, mode: 'onball', gap: 3.2 },
        { t: .42, mode: 'chase', gap: 2.8, side: -s },
        { t: .68, mode: 'help', w: .3 },
        { t: .88, mode: 'rim' }
      ]),
      X2: D('O2', .16, 18, [
        { t: 0, mode: 'deny', gap: 2.6 },
        { t: .48, mode: 'help', w: .3 },
        { t: .78, mode: 'closeout', mark: 'O2', gap: 2.2 }
      ]),
      X3: D('O3', .18, 18, [
        { t: 0, mode: 'deny', gap: 2.6 },
        { t: .52, mode: 'help', w: .34 },
        { t: .84, mode: 'rim' }
      ]),
      X4: D('O4', .18, 17, [
        { t: 0, mode: 'gap', gap: 2.8 },
        { t: .58, mode: 'help', w: .3 },
        { t: .84, mode: 'safety' }
      ]),
      X5: D('O5', .14, 18, [
        { t: 0, mode: 'gap', gap: 3.0 },
        { t: .46, mode: 'help', w: .34 },
        { t: .74, mode: 'rim' },
        { t: .9, mode: 'contest', mark: 'O5' }
      ])
    };
  }

  /* 对方从后场朝我方篮筐推进，供全场防守类战术共用 */
  function pressOffense(s) {
    return {
      O1: [K(0, 0, 88), K(.18, s * 3, 74), K(.38, s * 2, 58), K(.58, s * 4, 40), K(.78, s * 2, 22), K(1, s * 1, 13)],
      O2: [K(0, 18, 84), K(.2, 20, 70), K(.4, 21, 54), K(.6, 21, 36), K(.8, 20, 20), K(1, 19, 15)],
      O3: [K(0, -19, 84), K(.2, -21, 70), K(.4, -21, 52), K(.6, -22, 34), K(.8, -21, 18), K(1, -20, 13)],
      O4: [K(0, -8, 90), K(.25, -10, 72), K(.5, -9, 52), K(.75, -6, 30), K(1, -3, 17)],
      O5: [K(0, 8, 90), K(.25, 9, 72), K(.5, 8, 50), K(.75, 5, 28), K(1, 2, 15)]
    };
  }

  /* 半场防守类战术里，进攻方跑一次标准高位挡拆作为「考卷」 */
  function pnrLite(s) {
    return {
      O1: [K(0, 0, 31), K(.2, s * 4, 30), K(.4, s * 9, 26), K(.6, s * 10, 20), K(.8, s * 6, 15), K(1, s * 3, 12)],
      O2: [K(0, s * 19, 26), K(.4, s * 21, 27), K(1, s * 22, 28)],
      O3: [K(0, -s * 20, 24), K(.4, -s * 22, 16), K(1, -s * 22, 8)],
      O4: [K(0, -s * 8, 16), K(.4, -s * 5, 23), K(1, -s * 1, 29)],
      O5: [K(0, s * 8, 16), K(.24, s * 7, 26), K(.38, s * 6, 29), K(.52, s * 5, 24), K(.75, s * 2, 14), K(1, s * 1, 8)]
    };
  }
  function pnrLiteBall(s, f) {
    const to = target(f);
    return B('O1', .58, 'O1', to, .13, 9, .86, shotArc(f));
  }

  const SKELS = {};

  /* 1 —— 五人平行推进：控卫中路，两翼填满，大个拖后 */
  SKELS.push = function (m) {
    const s = m.side, f = m.finish, d = m.seed * .012;
    const off = {
      O1: [K(0, s * 2, 7), K(.16, s * 3, 24), K(.34, s * 2, 44), K(.54, s * 4, 64), K(.72, s * 2, 78), K(1, s * 1, 84)],
      O2: [K(0, 18, 9), K(.18, 20, 28), K(.36, 21, 50), K(.56, 21, 70), K(.78, 21, 83), K(1, 21, 86)],
      O3: [K(0, -19, 9), K(.18, -21, 28), K(.36, -21, 50), K(.56, -22, 70), K(.78, -22, 82), K(1, -22, 84)],
      O4: [K(0, -7, 6), K(.2, -10, 22), K(.4, -9, 42), K(.6, -10, 62), K(.8, -5, 74), K(1, -2, 79)],
      O5: [K(0, 7, 6), K(.2, 9, 20), K(.4, 8, 40), K(.6, 6, 60), K(.78, 3, 76), K(1, 1, 87)]
    };
    return {
      off, ball: B('O1', .66 + d, 'O1', target(f), .12, 9, .88, shotArc(f)),
      def: fullRetreat(s), court: 'full', hoop: FHOOP, duration: 5.4 + m.seed * .3,
      notes: [
        N(0, 'O1 后场接球启动，两翼立即拉开到边线', 'X1 正面顶球，其余四人同一帧转身回撤'),
        N(.2, 'O1 推过中线，O2 / O3 填满左右两翼', 'X2 / X3 边退边盯人，X4 拖后防长传'),
        N(.45, '进入前场，O5 沿中路顺下带走护框者', 'X1 追球与 X5 提前卡顺下路线同时发生'),
        N(.68, 'O1 抬头分球，拖后与底角同时出现机会', '球一动，五名防守人同步重新定位'),
        N(.86, '终结出手', 'X5 起跳干扰、X3 收缩护框、X1 回撤卡位')
      ]
    };
  };

  /* 2 —— 一传长传快攻 */
  SKELS.outlet = function (m) {
    const s = m.side, f = m.finish;
    const to = f === 'corner3' ? 'O3' : 'O2';
    const off = {
      O1: [K(0, s * 3, 8), K(.22, s * 2, 32), K(.5, s * 2, 56), K(.8, s * 1, 72), K(1, 0, 78)],
      O2: [K(0, 17, 10), K(.16, 20, 34), K(.34, 21, 62), K(.6, 21, 80), K(1, 20, 86)],
      O3: [K(0, -18, 10), K(.18, -21, 34), K(.4, -21, 60), K(.68, -22, 80), K(1, -22, 84)],
      O4: [K(0, -7, 5), K(.2, -6, 22), K(.5, -4, 48), K(.8, -2, 66), K(1, -1, 72)],
      O5: [K(0, 7, 5), K(.2, 8, 24), K(.5, 6, 50), K(.78, 3, 70), K(1, 1, 86)]
    };
    return {
      off, ball: B('O4', .10, 'O4', to, .26, 22, .82, shotArc(f)),
      def: fullRetreat(s), court: 'full', hoop: FHOOP, duration: 4.6 + m.seed * .25,
      notes: [
        N(0, 'O4 保护下篮板，不做二次运球', 'X1 / X2 同一帧开始从压迫切换成回撤'),
        N(.12, '一记越过半场的长传离手', '球还在空中，五名防守人已同步转身与分工'),
        N(.4, `${to} 在前场接球，其余四人继续填两翼与拖后`, 'X3 追球、X5 护框、X4 补中路，三点同时落位'),
        N(.66, '推进到前场，第一选择已经出现', '协防收缩与外线扑防必须在同一拍取舍'),
        N(.84, '快攻终结', 'X5 干扰出手，X1 / X2 卡住篮板位')
      ]
    };
  };

  /* 3 —— 破紧逼：短传接应后再从中路推进 */
  SKELS.pressbreak = function (m) {
    const s = m.side, f = m.finish;
    const off = {
      O1: [K(0, s * 1, 9), K(.12, -s * 5, 13), K(.3, -s * 2, 22), K(.52, s * 2, 45), K(.74, s * 3, 68), K(1, s * 1, 82)],
      O2: [K(0, 18, 14), K(.3, 21, 28), K(.55, 21, 56), K(.8, 21, 80), K(1, 21, 85)],
      O3: [K(0, -19, 13), K(.3, -21, 30), K(.55, -22, 58), K(.8, -22, 80), K(1, -22, 84)],
      O4: [K(0, -8, 20), K(.28, -s * 1, 26), K(.52, -6, 48), K(.78, -4, 70), K(1, -2, 78)],
      O5: [K(0, 8, 18), K(.18, s * 6, 17), K(.36, s * 5, 30), K(.6, 5, 54), K(.85, 2, 76), K(1, 1, 86)]
    };
    const ball = [
      { t: 0, holder: 'O1' },
      { t: .10, type: 'pass', from: 'O1', to: 'O5', flight: .08, arc: 4 },
      { t: .18, holder: 'O5' },
      { t: .30, type: 'pass', from: 'O5', to: 'O4', flight: .09, arc: 5 },
      { t: .39, holder: 'O4' },
      { t: .52, type: 'pass', from: 'O4', to: 'O1', flight: .1, arc: 6 },
      { t: .62, holder: 'O1' },
      { t: .82, type: 'pass', from: 'O1', to: target(f), flight: .1, arc: 8 },
      { t: .92, holder: target(f) },
      { t: .96, type: 'shot', from: target(f), to: 'HOOP', flight: .04, arc: 8 },
      { t: 1, type: 'dead' }
    ];
    return {
      off, ball, def: fullRetreat(s), court: 'full', hoop: FHOOP, duration: 6.6,
      notes: [
        N(0, 'O1 后场被两人逼向边线', 'X1 / X5 同步合围，另外三人占据传球线'),
        N(.12, '不硬突，先短传给接应的 O5', '夹击刚合拢，防守的轮转就要同时开始'),
        N(.36, 'O4 提到中路做第三接应点', 'X2 / X3 从夹击位同步退回各自对位'),
        N(.56, '球回到 O1 手中，从中路加速过半场', 'X1 重新顶球，X4 补上被放空的拖后点'),
        N(.84, '破紧逼成功，前场形成人数优势', '五名防守人同时回撤并重新分配护框与扑防')
      ]
    };
  };

  /* 4 —— 早攻：拖后大个补一个 early drag screen */
  SKELS.early = function (m) {
    const s = m.side, f = m.finish;
    const off = {
      O1: [K(0, s * 2, 8), K(.24, s * 2, 30), K(.44, s * 3, 52), K(.58, s * 7, 66), K(.72, s * 5, 74), K(.88, s * 3, 79), K(1, s * 2, 80)],
      O2: [K(0, 19, 10), K(.3, 21, 36), K(.55, 21, 62), K(.8, 22, 80), K(1, 22, 85)],
      O3: [K(0, -19, 10), K(.3, -21, 36), K(.55, -22, 62), K(.8, -22, 80), K(1, -22, 84)],
      O4: [K(0, -8, 6), K(.3, -9, 30), K(.55, -6, 54), K(.75, -3, 70), K(1, -1, 78)],
      O5: [K(0, 7, 6), K(.28, 8, 30), K(.5, s * 6, 60), K(.62, s * 5, 68), K(.76, s * 2, 76), K(1, s * 1, 87)]
    };
    return {
      off, ball: B('O1', .7, 'O1', target(f), .12, 9, .89, shotArc(f)),
      def: fullRetreat(s), court: 'full', hoop: FHOOP, duration: 5.8,
      notes: [
        N(0, '第一波快攻没有直接机会，球仍在 O1 手中', '回防五人已从退防阵型开始找对位'),
        N(.28, '两翼拉开到底角，O5 拖后全速跟进', 'X2 / X3 边退边保持对射手的距离'),
        N(.54, 'O5 不等落位，上提补一个 early drag screen', 'X5 的沉退与 X1 的挤过必须在同一帧沟通'),
        N(.7, 'O1 借掩护改变方向并分球', '球一离手，弱侧协防与扑外线同步启动'),
        N(.88, '早攻终结', 'X4 补弧顶、X5 护框、X1 追球，三点同时收尾')
      ]
    };
  };

  /* 5 —— 全场紧逼 / 压迫：shape 由 variant 决定阵型 */
  const PRESS_ANCHORS = [
    [[-8, 80], [8, 80], [-16, 54], [16, 54], [0, 16]],
    [[0, 86], [-14, 68], [14, 68], [0, 48], [0, 14]],
    [[-10, 66], [10, 66], [-18, 46], [18, 46], [0, 14]],
    [[-8, 78], [8, 78], [-16, 58], [16, 58], [0, 14]]
  ];
  SKELS.press = function (m) {
    const s = m.side, v = m.variant % 4, A = PRESS_ANCHORS[v];
    const rule = (i) => {
      const a = A[i], mk = 'O' + (i + 1);
      if (i === 4) return D(mk, .16, 19, [
        { t: 0, mode: 'safety' },
        { t: .5, mode: 'safety' },
        { t: .78, mode: 'rim' },
        { t: .92, mode: 'contest', mark: 'O3' }
      ]);
      if (i < 2) return D(mk, .10, 20, [
        { t: 0, mode: 'zone', anchor: a, follow: .3, followY: .12 },
        { t: .22, mode: 'trap', side: i === 0 ? s : -s, gap: 2.0 },
        { t: .5, mode: 'runjump', side: i === 0 ? -s : s, gap: 2.4 },
        { t: .76, mode: 'help', w: .4 },
        { t: .92, mode: 'rim' }
      ]);
      return D(mk, .14, 18, [
        { t: 0, mode: 'zone', anchor: a, follow: .34, followY: .14 },
        { t: .42, mode: 'zone', anchor: a, follow: .38, followY: .16 },
        { t: .7, mode: 'closeout', mark: mk, gap: 2.2 },
        { t: .9, mode: 'rim' }
      ]);
    };
    const def = { X1: rule(0), X2: rule(1), X3: rule(2), X4: rule(3), X5: rule(4) };
    const ball = [
      { t: 0, holder: 'O1' },
      { t: .42, type: 'pass', from: 'O1', to: 'O3', flight: .13, arc: 10 },
      { t: .55, holder: 'O3' },
      { t: .86, type: 'shot', from: 'O3', to: 'HOOP', flight: .14, arc: 16 },
      { t: 1, type: 'dead' }
    ];
    return {
      off: pressOffense(s), ball, def, court: 'full', hoop: HHOOP, duration: 6.2,
      notes: [
        N(0, '对方在后场发界外球，五人站位拉开', '紧逼阵型已摆好，前场两人与中线两人同一帧压上'),
        N(.2, 'O1 接球后沿边线推进', 'X1 / X2 同步合围，安全卫 X5 同时向前压一步'),
        N(.42, '被夹击，O1 勉强把球甩给弱侧 O3', '陷阱合拢的同一帧，X3 / X4 切断回传线'),
        N(.62, '球换到另一侧，整条压迫线必须平移', '五个区域锚点随球同步横移，谁慢谁漏人'),
        N(.86, '对方勉强出手', 'X5 护框、X1 回扑、X3 卡位，同时完成收尾')
      ]
    };
  };

  /* 6 —— 回防优先 / 混合压迫（全场防守的收尾型） */
  SKELS.retreat = function (m) {
    const s = m.side, v = m.variant % 4;
    const def = {
      X1: D('O1', .10, 19, [
        { t: 0, mode: 'onball', gap: 3.4 },
        { t: .4, mode: 'chase', gap: 3.0, side: -s },
        { t: .72, mode: 'help', w: .3 },
        { t: .9, mode: 'rim' }
      ]),
      X2: D('O2', .16, 18, [
        { t: 0, mode: v === 3 ? 'faceguard' : 'deny', gap: v === 3 ? 1.8 : 2.6 },
        { t: .5, mode: 'help', w: .3 },
        { t: .8, mode: 'closeout', mark: 'O2', gap: 2.2 }
      ]),
      X3: D('O3', .18, 18, [
        { t: 0, mode: 'deny', gap: 2.6 },
        { t: .55, mode: 'help', w: .34 },
        { t: .86, mode: 'rim' }
      ]),
      X4: D('O4', .18, 17, [
        { t: 0, mode: 'safety' },
        { t: .55, mode: 'help', w: .34 },
        { t: .88, mode: 'rim' }
      ]),
      X5: D('O5', .14, 18, [
        { t: 0, mode: 'rim' },
        { t: .5, mode: 'rim' },
        { t: .8, mode: 'contest', mark: 'O5' },
        { t: .92, mode: 'rim' }
      ])
    };
    const ball = [
      { t: 0, holder: 'O1' },
      { t: .56, type: 'pass', from: 'O1', to: 'O2', flight: .12, arc: 9 },
      { t: .68, holder: 'O2' },
      { t: .88, type: 'shot', from: 'O2', to: 'HOOP', flight: .12, arc: 16 },
      { t: 1, type: 'dead' }
    ];
    return {
      off: pressOffense(s), ball, def, court: 'full', hoop: HHOOP, duration: 5.8,
      notes: [
        N(0, '丢球权后不赌抢断，五人第一时间全线回撤', '护框、顶弧顶、扑底角三个任务同时分配'),
        N(.24, '对方控卫推过中线', 'X1 保持身位，X4 拖后保护长传'),
        N(.5, '球分到侧翼，回防阵型被迫横移', 'X2 扑外线与 X5 护框在同一拍发生'),
        N(.7, '接球人起手', 'X3 从弱侧收缩、X1 回扑，五人同步轮转'),
        N(.9, '出手', 'X5 卡住篮板位，其余四人同时收拢')
      ]
    };
  };

  /* 两次传球的时间线：发球 / 策应 / 强弱侧转移都用它 */
  function B2(h, t1, a, b, f1, a1, t2, c, f2, a2, st, sa) {
    const segs = [
      { t: 0, holder: h },
      { t: t1, type: 'pass', from: a, to: b, flight: f1, arc: a1 },
      { t: t1 + f1, holder: b }
    ];
    if (c && c !== b) {
      segs.push({ t: t2, type: 'pass', from: b, to: c, flight: f2, arc: a2 });
      segs.push({ t: t2 + f2, holder: c });
      segs.push({ t: st, type: 'shot', from: c, to: 'HOOP', flight: .12, arc: sa });
    } else {
      segs.push({ t: st, type: 'shot', from: b, to: 'HOOP', flight: .14, arc: sa });
    }
    segs.push({ t: 1, type: 'dead' });
    return segs;
  }

  /* 7 —— 半场射手借双掩护绕出（Floppy / Iverson / Elevator / Zipper） */
  SKELS.screen = function (m) {
    const s = m.side, f = m.finish, v = m.variant % 3;
    const off = {
      O1: [K(0, 0, 30), K(.25, s * 4, 30), K(.55, s * 6, 29), K(.8, s * 3, 30), K(1, s * 2, 29)],
      O2: [K(0, -s * 18, 8), K(.2, -s * 10, 8), K(.38, s * 1, 10), K(.56, s * 11, 13), K(.74, s * 18 + v, 24), K(1, s * 18 + v, 27)],
      O3: [K(0, -s * 20, 25), K(.45, -s * 22, 14), K(1, -s * 22, 8)],
      O4: [K(0, -s * 8, 17), K(.32, -s * 4, 14), K(.6, -s * 2, 18), K(1, -s * 1, 23)],
      O5: [K(0, s * 8, 16), K(.32, s * 8, 14), K(.6, s * 6, 18), K(.82, s * 3, 12), K(1, s * 1, 8)]
    };
    return {
      off, ball: B2('O1', .50, 'O1', 'O2', .10, 7, .68, target(f), .10, 8, .88, shotArc(f)),
      def: halfDef(s), court: 'half', hoop: HHOOP, duration: 5.6,
      notes: [
        N(0, 'O1 弧顶持球，射手沉在底角等待掩护', 'X2 绕前拒传，其余四人按球侧同步收缩'),
        N(.26, 'O4 / O5 两道掩护同时立起', 'X4 / X5 的挤过决定必须同一帧做出'),
        N(.5, 'O2 借掩护横切接球，第一选择出现', 'X2 追防与 X1 的协防站位同步调整'),
        N(.7, '球转到终结者手上', '球一动，弱侧收缩与扑外线同时启动'),
        N(.88, '出手', 'X3 补防、X5 护框、X1 回撤卡位')
      ]
    };
  };

  /* 8 —— 强侧挡拆吸引协防 + 弱侧 Hammer 掩护 */
  SKELS.hammer = function (m) {
    const s = m.side, f = m.finish, v = m.variant % 3;
    const to = f === 'mid' ? 'O1' : (f === 'rim' ? 'O5' : 'O3');
    const off = {
      O1: [K(0, 0, 31), K(.2, s * 5, 30), K(.38, s * 10, 26), K(.56, s * 11, 21), K(.76, s * 8, 20), K(1, s * 5, 23)],
      O2: [K(0, s * 19, 26), K(.4, s * 21, 27), K(.72, s * 22, 28), K(1, s * 22, 28)],
      O3: [K(0, -s * 20, 24), K(.3, -s * 22, 17), K(.6, -s * 22, 10), K(1, -s * 22, 8)],
      O4: [K(0, -s * 8, 16), K(.3, -s * 14, 12), K(.56, -s * 18, 9), K(.78, -s * 16, 10), K(1, -s * 10, 16)],
      O5: [K(0, s * 8, 16), K(.22, s * 7, 26), K(.36, s * 6, 29), K(.52, s * 5, 24), K(.74, s * 2, 14), K(1, s * 1, 8)]
    };
    return {
      off, ball: B('O1', .6 + v * .01, 'O1', to, .15, 13, .88, shotArc(f)),
      def: halfDef(s), court: 'half', hoop: HHOOP, duration: 6.0,
      notes: [
        N(0, 'O1 / O5 强侧挡拆起手，弱侧两人已就位', 'X1 顶球、X5 待命，弱侧 X3 / X4 同时收缩待命'),
        N(.26, 'O1 借掩护杀入肘区，O5 顺下', 'X5 上步干扰与 X1 挤过在同一帧发生'),
        N(.48, '强侧吸引两人协防，弱侧 O4 立刻设 Hammer 掩护', '协防一收缩，弱侧补位必须同步跟上'),
        N(.68, '球横传到弱侧空位', '球动人动：五名防守人同一帧重新定位'),
        N(.88, '终结出手', 'X3 扑防、X5 护框、X2 卡住篮板位')
      ]
    };
  };

  /* 9 —— 高位策应 + 空切（三角 / 普林斯顿 / UCLA / Flex） */
  SKELS.cut = function (m) {
    const s = m.side, f = m.finish, v = m.variant % 3;
    const cutter = v === 1 ? 'O2' : v === 2 ? 'O3' : 'O1';
    const off = {
      O1: [K(0, 0, 30), K(.22, s * 4, 28), K(.4, s * 6, 23), K(.58, s * 3, 14), K(.8, s * 1, 9), K(1, s * 1, 8)],
      O2: [K(0, s * 19, 24), K(.3, s * 15, 21), K(.5, s * 8, 17), K(.7, s * 3, 11), K(1, s * 1, 8)],
      O3: [K(0, -s * 19, 24), K(.35, -s * 20, 18), K(.6, -s * 17, 11), K(1, -s * 15, 9)],
      O4: [K(0, -s * 8, 19), K(.22, -s * 7, 20), K(.5, -s * 6, 20), K(.78, -s * 3, 19), K(1, -s * 1, 18)],
      O5: [K(0, s * 8, 15), K(.3, s * 7, 14), K(.6, s * 6, 12), K(.85, s * 3, 9), K(1, s * 2, 8)]
    };
    return {
      off, ball: B2('O1', .26, 'O1', 'O4', .10, 6, .54, cutter, .11, 8, .86, shotArc(f)),
      def: halfDef(s), court: 'half', hoop: HHOOP, duration: 5.8,
      notes: [
        N(0, '强弱侧形成三角站位，球在弧顶', '防守五人按球侧同步确定协防距离'),
        N(.24, '球交到肘区高位策应点', '球一进肘区，X4 上提与弱侧收缩同时发生'),
        N(.46, `${cutter} 从防守人背后启动空切`, 'X1 / X2 的贴防与补防必须在同一帧沟通'),
        N(.6, '高位回传打穿防线', 'X5 补防与 X3 收缩同步，弱侧不能等球到才动'),
        N(.86, '篮下终结', '护框、卡位与回撤三点同时收尾')
      ]
    };
  };

  /* 10 —— 半场区域联防：守区域不守人，整块阵型随球平移 */
  const ZONES = [
    [[-9, 24], [9, 24], [-15, 10], [0, 9], [15, 10]],
    [[-14, 26], [0, 27], [14, 26], [-9, 10], [9, 10]],
    [[0, 28], [-13, 21], [0, 19], [13, 21], [0, 9]],
    [[-9, 21], [9, 21], [-9, 10], [9, 10], [0, 26]],
    [[-8, 23], [8, 23], [-14, 10], [0, 9], [14, 10]]
  ];
  SKELS.zoneDef = function (m) {
    const s = m.side, f = m.finish, v = m.variant % 5, A = ZONES[v];
    const rule = (i) => {
      const mk = 'O' + (i + 1);
      if (v === 3 && i === 4) return D(mk, .10, 15, [
        { t: 0, mode: 'faceguard', gap: 1.8 },
        { t: .5, mode: 'faceguard', gap: 1.6 },
        { t: .82, mode: 'closeout', mark: 'O1', gap: 2.0 }
      ]);
      return D(mk, .14 + i * .01, 13, [
        { t: 0, mode: 'zone', anchor: A[i], follow: .26, followY: .09 },
        { t: .46, mode: 'zone', anchor: A[i], follow: .3, followY: .12 },
        { t: .72, mode: i === 0 ? 'closeout' : 'zone', anchor: A[i], follow: .32, followY: .12, mark: mk, gap: 2.2 },
        { t: .9, mode: i < 2 ? 'rim' : 'zone', anchor: A[i], follow: .2 }
      ]);
    };
    const def = { X1: rule(0), X2: rule(1), X3: rule(2), X4: rule(3), X5: rule(4) };
    return {
      off: pnrLite(s), ball: pnrLiteBall(s, f), def,
      court: 'half', hoop: HHOOP, duration: 6.4,
      notes: [
        N(0, '对方高位挡拆起手，联防阵型先站好五个区域', '两名上线与三名下线同一帧确定各自区域'),
        N(.26, '持球人借掩护向强侧移动', '整块阵型随球横移，而不是各自跟人'),
        N(.48, '球进入肘区，区域交界处出现缝隙', '相邻两名防守人必须同步交接，不能都等对方'),
        N(.68, '球转到弱侧', '上线扑球与下线护框在同一拍完成'),
        N(.88, '对方出手', '五人同时收拢卡住篮板位')
      ]
    };
  };

  /* 11 —— 半场人盯人各流派：换防 / 沉退 / 夹击 / 逼边 / 收缩 / 轮转 */
  SKELS.manDef = function (m) {
    const s = m.side, f = m.finish, k = m.variant % 9;
    const x2 = D('O2', .16, 13, [
      { t: 0, mode: k === 7 ? 'faceguard' : 'deny', gap: 2.4 },
      { t: .5, mode: 'help', w: k === 5 ? .52 : .32 },
      { t: .76, mode: 'closeout', mark: 'O2', gap: 2.1 }
    ]);
    const x3 = D('O3', .18, 13, [
      { t: 0, mode: 'help', w: k === 5 ? .48 : .34 },
      { t: .55, mode: k === 6 ? 'closeout' : 'help', mark: 'O2', gap: 2.2, w: .38 },
      { t: .82, mode: 'rim' }
    ]);
    const x4 = D('O4', .18, 13, [
      { t: 0, mode: 'gap', gap: 2.6 },
      { t: .5, mode: k === 8 ? 'scram' : 'help', mark: 'O5', w: .32 },
      { t: .8, mode: 'rim' }
    ]);
    let x1, x5;
    switch (k) {
      case 0:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.8 }, { t: .34, mode: 'switch', mark: 'O5' }, { t: .6, mode: 'onball', gap: 2.6 }, { t: .86, mode: 'rim' }]);
        x5 = D('O5', .12, 14, [{ t: 0, mode: 'gap', gap: 2.6 }, { t: .34, mode: 'switch', mark: 'O1' }, { t: .6, mode: 'deny', gap: 2.2, mark: 'O1' }, { t: .86, mode: 'rim' }]);
        break;
      case 1:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.6 }, { t: .34, mode: 'chase', gap: 2.2, side: -s }, { t: .66, mode: 'onball', gap: 2.6 }, { t: .88, mode: 'rim' }]);
        x5 = D('O5', .12, 12, [{ t: 0, mode: 'drop', depth: .3 }, { t: .5, mode: 'drop', depth: .36 }, { t: .82, mode: 'rim' }]);
        break;
      case 2:
        x1 = D('O1', .08, 16, [{ t: 0, mode: 'onball', gap: 2.6 }, { t: .3, mode: 'trap', side: s, gap: 1.9 }, { t: .58, mode: 'help', w: .34 }, { t: .82, mode: 'rim' }]);
        x5 = D('O5', .08, 16, [{ t: 0, mode: 'gap', gap: 2.6 }, { t: .3, mode: 'trap', side: -s, gap: 1.9 }, { t: .58, mode: 'rim' }]);
        break;
      case 3:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.4 }, { t: .3, mode: 'chase', gap: 2.0, side: s }, { t: .62, mode: 'onball', gap: 2.4 }, { t: .88, mode: 'rim' }]);
        x5 = D('O5', .12, 13, [{ t: 0, mode: 'gap', gap: 3.0 }, { t: .34, mode: 'drop', depth: .24 }, { t: .7, mode: 'rim' }]);
        break;
      case 4:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.8 }, { t: .34, mode: 'chase', gap: 2.2, side: -s }, { t: .7, mode: 'onball', gap: 2.6 }, { t: .88, mode: 'rim' }]);
        x5 = D('O5', .10, 16, [{ t: 0, mode: 'gap', gap: 2.6 }, { t: .28, mode: 'show', push: 4.0 }, { t: .48, mode: 'show', push: 2.2 }, { t: .66, mode: 'onball', gap: 3.0, mark: 'O5' }, { t: .86, mode: 'rim' }]);
        break;
      case 5:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.8 }, { t: .4, mode: 'chase', gap: 2.4, side: -s }, { t: .74, mode: 'help', w: .5 }, { t: .9, mode: 'rim' }]);
        x5 = D('O5', .12, 13, [{ t: 0, mode: 'help', w: .46 }, { t: .5, mode: 'help', w: .52 }, { t: .82, mode: 'rim' }]);
        break;
      case 6:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.8 }, { t: .36, mode: 'scram', mark: 'O5' }, { t: .66, mode: 'help', w: .4 }, { t: .88, mode: 'rim' }]);
        x5 = D('O5', .12, 14, [{ t: 0, mode: 'gap', gap: 2.6 }, { t: .36, mode: 'closeout', mark: 'O2', gap: 2.2 }, { t: .7, mode: 'rim' }]);
        break;
      case 7:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.8 }, { t: .4, mode: 'chase', gap: 2.4, side: -s }, { t: .72, mode: 'help', w: .3 }, { t: .9, mode: 'rim' }]);
        x5 = D('O5', .12, 14, [{ t: 0, mode: 'gap', gap: 2.6 }, { t: .34, mode: 'show', push: 3.0 }, { t: .6, mode: 'rim' }]);
        break;
      default:
        x1 = D('O1', .10, 15, [{ t: 0, mode: 'onball', gap: 2.8 }, { t: .34, mode: 'scram', mark: 'O4' }, { t: .6, mode: 'onball', gap: 2.6 }, { t: .86, mode: 'rim' }]);
        x5 = D('O5', .12, 14, [{ t: 0, mode: 'gap', gap: 2.6 }, { t: .34, mode: 'switch', mark: 'O1' }, { t: .62, mode: 'help', w: .36 }, { t: .86, mode: 'rim' }]);
    }
    return {
      off: pnrLite(s), ball: pnrLiteBall(s, f),
      def: { X1: x1, X2: x2, X3: x3, X4: x4, X5: x5 },
      court: 'half', hoop: HHOOP, duration: 6.2,
      notes: [
        N(0, '对方高位挡拆起手，防守先确定覆盖方式', '五人同一帧明确自己是对球、对位还是协防'),
        N(.26, '掩护落下，持球人向强侧启动', '对球防守人与掩护者防守人的决定必须同时做出'),
        N(.48, '球进入肘区，顺下者开始切入', '弱侧贴顺下者与护框者同步收缩'),
        N(.68, '球被逼出或转移到弱侧', '轮转扑防与回位在同一拍完成，慢一拍就是空位'),
        N(.88, '对方出手', '五人同时转身卡位，完成这次防守')
      ]
    };
  };

  /* 12 —— 前场界外球（SLOB / 前场底线球），5 秒内直接形成出手 */
  const SLOB_TO = { rim: 'O4', corner3: 'O3', trail3: 'O2', mid: 'O1', lob: 'O4' };
  SKELS.slob = function (m) {
    const s = m.side, f = m.finish, v = m.variant % 5;
    const recv = v === 3 ? 'O1' : v === 4 ? 'O4' : 'O2';
    const to = SLOB_TO[f] || 'O2';
    const shift = v * 1.2;
    const off = {
      O1: [K(0, 0, 29), K(.2, s * 4, 29), K(.45, s * 8 - shift, 27), K(.7, s * 4, 30), K(1, s * 2, 30)],
      O2: [K(0, s * 18, 10), K(.24, s * 10, 9), K(.5, s * 2, 10), K(.72, -s * 6 - shift, 18), K(1, -s * 12 - shift, 26)],
      O3: [K(0, -s * 20, 12), K(.4, -s * 22, 10), K(1, -s * 22, 8)],
      O4: [K(0, -s * 8, 17), K(.3, -s * 5, 14), K(.6, s * 2, 14), K(1, s * 3, 11)],
      O5: [K(0, s * 24, 22), K(.14, s * 24, 22), K(.42, s * 17, 24), K(.75, s * 13, 26), K(1, s * 11, 27)]
    };
    return {
      off, ball: B2('O5', .10, 'O5', recv, .10, 4, .56, to, .10, 8, .86, shotArc(f)),
      def: halfDef(s), court: 'half', hoop: HHOOP, duration: 4.8,
      notes: [
        N(0, 'O5 站在边线外准备发球，四人落位', '防守五人同一帧完成对位与拒传站位'),
        N(.12, '球发出，第一接应点立刻启动', '发球与追防在同一帧发生，没有先后'),
        N(.36, '掩护同时立起，第二、第三选择陆续出现', '两名防守人的挤过与换防必须同时沟通'),
        N(.6, '球转到真正的出手点', '球动人动：弱侧协防与扑防同步改写'),
        N(.86, '五秒时限内完成出手', '扑防、护框与卡位同时收尾')
      ]
    };
  };

  /* 13 —— 后场界外球（BLOB / 压哨长传），需推进 94 英尺 */
  SKELS.blob = function (m) {
    const s = m.side, f = m.finish, v = m.variant % 5;
    const off = {
      O5: [K(0, 0, 1), K(.12, 0, 2), K(.4, 0, 18), K(.72, 0, 48), K(1, 0, 66)],
      O1: [K(0, 0, 14), K(.2, s * 3, 26), K(.45, s * 2, 48), K(.7, s * 3, 68), K(1, s * 2, 80)],
      O2: [K(0, 18, 12), K(.25, 20, 32), K(.5, 21, 58), K(.78, 21, 80), K(1, 20, 86)],
      O3: [K(0, -19, 12), K(.25, -21, 32), K(.5, -21, 58), K(.78, -22, 80), K(1, -22, 84)],
      O4: [K(0, -8, 10), K(.25, -9 - v, 30), K(.5, -8, 52), K(.75, -5, 70), K(1, -2, 78)]
    };
    const long = v === 4;
    const ball = long
      ? B2('O5', .06, 'O5', 'O2', .30, 24, null, null, 0, 0, .84, 18)
      : B2('O5', .08, 'O5', 'O1', .09, 4, .62, target(f), .13, 10, .88, shotArc(f));
    return {
      off, ball, def: fullRetreat(s), court: 'full', hoop: FHOOP, duration: long ? 4.2 : 6.2,
      notes: [
        N(0, 'O5 在本方底线外持球，四人落位准备接应', '防守五人同一帧判断是紧逼还是回落'),
        N(.1, long ? '直接甩出越过半场的长传' : '先短传找到安全的第一接应点', '发球瞬间，压迫与退防的分工同步确定'),
        N(.38, long ? '球在空中飞行，前场接应者已经启动' : 'O1 带球推进，其余三人填满两翼', '五名防守人随球位置同步平移，不能等球落地'),
        N(.66, '进入前场，第一选择出现', '扑外线与护框在同一拍取舍'),
        N(.88, '出手', 'X5 干扰、X3 收缩、X1 回撤卡位同时完成')
      ]
    };
  };

  NBA.Templates = {
    build(m) {
      const fn = SKELS[m.tpl];
      if (!fn) throw new Error('未知战术模板: ' + m.tpl);
      const p = fn(m);
      return Object.assign({
        id: m.id, type: m.type, typeName: m.typeName, name: m.name, en: m.en,
        era: m.era, desc: m.desc, tag: m.typeName, index: m.index, seed: m.seed, tpl: m.tpl
      }, p);
    }
  };

  /* 组装 90 套：4 套手工精细战术 + 86 套模板生成 */
  const fineById = {};
  NBA.FINE_PLAYS.forEach(p => { fineById[p.id] = p; });
  NBA.PLAYS = NBA.CATALOG.map(m => {
    if (m.fine) {
      const base = fineById[m.fine];
      return Object.assign({}, base, {
        id: m.id, type: m.type, typeName: m.typeName, name: m.name, en: m.en,
        era: m.era, desc: m.desc, index: m.index, tpl: 'fine',
        court: 'half', hoop: HHOOP
      });
    }
    return NBA.Templates.build(m);
  });

})(window.NBA);
