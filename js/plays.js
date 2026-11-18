window.NBA = window.NBA || {};

/*
 * 半场坐标系（英尺）
 *   x: -25 .. 25 （左右边界）      y: 0（底线） .. 47（中线）
 *   篮筐 HOOP = [0, 5.25]
 * 进攻 O1..O5：关键帧 [t, x, y]，t 为归一化时间 0..1，路径用 Catmull-Rom 平滑
 * 防守 X1..X5：只给「反应规则」，不给终点坐标 —— 位置由引擎逐帧依据进攻与球算出
 */
window.NBA.HOOP = [0, 5.25];

window.NBA.FINE_PLAYS = [
  {
    id: 'pnr',
    name: '高位挡拆',
    en: 'High pick & roll',
    tag: '持球 / 顺下 / 协防',
    desc: 'O5 上提设掩护，O1 借掩护突破，O5 顺下接球。防守端同一时刻完成挤过、show & recover、沉退护框与弱侧收缩。',
    duration: 6.4,
    off: {
      O1: [[0, 0, 31], [.14, 3, 31], [.30, 7, 29], [.44, 11, 25], [.56, 11, 20], [.68, 8, 15], [.82, 4, 11], [1, 2, 10]],
      O2: [[0, 19, 26], [.30, 21, 27], [.56, 22, 28], [1, 22, 28]],
      O3: [[0, -20, 24], [.34, -22, 18], [.66, -22, 9], [1, -22, 7]],
      O4: [[0, -8, 16], [.30, -6, 22], [.56, -2, 29], [1, 0, 30]],
      O5: [[0, 8, 16], [.16, 7, 24], [.28, 6, 29], [.40, 6, 29], [.52, 5, 25], [.64, 3, 19], [.78, 1, 12], [.92, 0, 8], [1, 0, 7]]
    },
    ball: [
      { t: 0, holder: 'O1' },
      { t: .60, type: 'pass', from: 'O1', to: 'O5', flight: .14, style: 'bounce', arc: 7 },
      { t: .74, holder: 'O5' },
      { t: .90, type: 'shot', from: 'O5', to: 'HOOP', flight: .10, arc: 16 },
      { t: 1, type: 'dead' }
    ],
    def: {
      X1: { mark: 'O1', delay: .10, speed: 15, rules: [
        { t: 0, mode: 'onball', gap: 3.0 },
        { t: .24, mode: 'chase', gap: 2.4, side: -1 },
        { t: .46, mode: 'onball', gap: 2.6 },
        { t: .62, mode: 'help', w: .34 },
        { t: .80, mode: 'rim' }
      ] },
      X2: { mark: 'O2', delay: .16, speed: 13, rules: [
        { t: 0, mode: 'deny', gap: 2.4 },
        { t: .44, mode: 'help', w: .30 },
        { t: .66, mode: 'nail', w: .55 },
        { t: .86, mode: 'rim' }
      ] },
      X3: { mark: 'O3', delay: .20, speed: 13, rules: [
        { t: 0, mode: 'help', w: .36 },
        { t: .46, mode: 'help', w: .52 },
        { t: .68, mode: 'rim' }
      ] },
      X4: { mark: 'O4', delay: .18, speed: 13, rules: [
        { t: 0, mode: 'help', w: .26 },
        { t: .48, mode: 'deny', gap: 2.6 },
        { t: .78, mode: 'help', w: .30 }
      ] },
      X5: { mark: 'O5', delay: .12, speed: 14, rules: [
        { t: 0, mode: 'gap', gap: 2.6 },
        { t: .22, mode: 'show', push: 3.4 },
        { t: .40, mode: 'drop', depth: .20 },
        { t: .56, mode: 'onball', gap: 2.8, mark: 'O5' },
        { t: .74, mode: 'contest', mark: 'O5' }
      ] }
    },
    notes: [
      { t: 0, o: 'O1 弧顶持球，O5 从右肘区上提', d: 'X1 保持 3 英尺对位距离，X5 收缩待命' },
      { t: .18, o: 'O5 落位设掩护，弱侧两人拉开到底角', d: 'X5 提前上步 show，X2 / X3 随球轻微收缩' },
      { t: .30, o: 'O1 贴着掩护向右加速突破', d: 'X1 挤过掩护追防，X5 同步跨出干扰（同一帧）' },
      { t: .46, o: 'O1 杀入肘区，O5 转身顺下', d: 'X5 recover 沉退，X3 弱侧收缩护框、X4 补弧顶' },
      { t: .62, o: 'O1 击地传球给顺下的 O5', d: '球一动，五名防守人同时重新定位：X5 追球，X1 让开' },
      { t: .78, o: 'O5 接球直冲篮下', d: 'X3 补到篮下、X2 收到罚球线，X5 身后追盖' },
      { t: .92, o: 'O5 上篮出手', d: 'X3 / X5 同时起跳干扰，X1 回撤卡位抢篮板' }
    ]
  },

  {
    id: 'spain',
    name: '西班牙挡拆',
    en: 'Spain pick & roll',
    tag: '背掩护 / 弱侧轮转',
    desc: 'O5 设掩护顺下，O3 再给 O5 做背掩护放空顺下路线。防守必须连续两次沟通，弱侧轮转扑外线，是检验协同的最佳样本。',
    duration: 6.8,
    off: {
      O1: [[0, 0, 31], [.14, 4, 31], [.30, 8, 29], [.46, 10, 25], [.60, 9, 23], [.78, 6, 26], [1, 4, 28]],
      O2: [[0, 19, 26], [.28, 22, 27], [.48, 23, 29], [.64, 22, 30], [1, 22, 30]],
      O3: [[0, -20, 24], [.22, -14, 27], [.38, -4, 28], [.50, 3, 27], [.62, 5, 26], [.80, -6, 27], [1, -12, 26]],
      O4: [[0, -8, 16], [.34, -14, 12], [.60, -22, 8], [1, -22, 7]],
      O5: [[0, 8, 16], [.16, 7, 24], [.30, 6, 29], [.42, 6, 29], [.56, 4, 23], [.70, 1, 15], [.86, 0, 9], [1, 0, 7]]
    },
    ball: [
      { t: 0, holder: 'O1' },
      { t: .66, type: 'pass', from: 'O1', to: 'O2', flight: .16, arc: 12 },
      { t: .82, holder: 'O2' },
      { t: .88, type: 'shot', from: 'O2', to: 'HOOP', flight: .12, arc: 20 },
      { t: 1, type: 'dead' }
    ],
    def: {
      X1: { mark: 'O1', delay: .10, speed: 15, rules: [
        { t: 0, mode: 'onball', gap: 3.0 },
        { t: .26, mode: 'chase', gap: 2.4, side: -1 },
        { t: .48, mode: 'onball', gap: 2.6 },
        { t: .66, mode: 'help', w: .28 }
      ] },
      X2: { mark: 'O2', delay: .18, speed: 14, rules: [
        { t: 0, mode: 'deny', gap: 2.4 },
        { t: .42, mode: 'help', w: .40 },
        { t: .66, mode: 'closeout', mark: 'O2', gap: 2.0, maxSpeed: 18 },
        { t: .88, mode: 'contest', mark: 'O2' }
      ] },
      X3: { mark: 'O3', delay: .16, speed: 14, rules: [
        { t: 0, mode: 'deny', gap: 2.6 },
        { t: .36, mode: 'deny', gap: 2.2 },
        { t: .54, mode: 'switch', mark: 'O5' },
        { t: .70, mode: 'rim' },
        { t: .86, mode: 'onball', gap: 2.4, mark: 'O3' }
      ] },
      X4: { mark: 'O4', delay: .20, speed: 13, rules: [
        { t: 0, mode: 'help', w: .30 },
        { t: .48, mode: 'nail', w: .60 },
        { t: .70, mode: 'closeout', mark: 'O2', gap: 3.0 },
        { t: .86, mode: 'deny', gap: 2.4, mark: 'O4' }
      ] },
      X5: { mark: 'O5', delay: .12, speed: 14, rules: [
        { t: 0, mode: 'gap', gap: 2.6 },
        { t: .26, mode: 'show', push: 3.2 },
        { t: .44, mode: 'drop', depth: .18 },
        { t: .58, mode: 'onball', gap: 3.0, mark: 'O5' },
        { t: .72, mode: 'rim' }
      ] }
    },
    notes: [
      { t: 0, o: 'O1 弧顶持球，O2 沉右翼，O3 站左翼', d: '五人一对一对位，弱侧 X3 稍向球侧收缩' },
      { t: .22, o: 'O5 上提设掩护，O3 同时启动横切', d: 'X5 show 的同时 X3 必须跟着 O3 横穿，不能等' },
      { t: .40, o: 'O3 给顺下的 O5 做背掩护（Spain）', d: 'X3 被挡住，X5 与 X3 瞬间完成换防沟通' },
      { t: .58, o: 'O5 顺下带走两名防守，O2 外弹到右弧顶', d: 'X3 换防接管 O5，X4 补到罚球线，X2 回追 O2' },
      { t: .68, o: 'O1 越过头顶长传弱侧 O2', d: '球在空中时四人已开始 jump to the ball，X2 全力扑防' },
      { t: .84, o: 'O2 接球起手三分', d: 'X2 closeout 到位、X4 轮转补位，X3 / X5 卡住篮板位' },
      { t: .94, o: '出手，进攻抢进攻篮板', d: '防守五人同时转身挡人，而非依次回位' }
    ]
  },

  {
    id: 'horns',
    name: '牛角位双侧掩护',
    en: 'Horns twin screen',
    tag: '双侧选择 / 弱侧空切',
    desc: 'O4 / O5 分居两侧肘区形成双掩护，O1 任选一侧突破，弱侧 O3 空切篮下。防守要在持球人做选择的同一拍完成换防与补位。',
    duration: 6.0,
    off: {
      O1: [[0, 0, 31], [.16, -2, 31], [.30, -6, 29], [.44, -10, 26], [.58, -9, 23], [.74, -5, 25], [1, -2, 28]],
      O2: [[0, 19, 26], [.32, 21, 28], [.58, 22, 29], [1, 22, 29]],
      O3: [[0, -20, 24], [.28, -18, 20], [.46, -12, 14], [.62, -5, 9], [.80, -1, 7], [1, 0, 7]],
      O4: [[0, -8, 18], [.22, -8, 22], [.36, -7, 27], [.48, -6, 27], [.62, -4, 22], [.80, -1, 16], [1, 0, 13]],
      O5: [[0, 8, 18], [.30, 8, 21], [.52, 7, 20], [.72, 5, 15], [1, 3, 11]]
    },
    ball: [
      { t: 0, holder: 'O1' },
      { t: .58, type: 'pass', from: 'O1', to: 'O3', flight: .14, style: 'bounce', arc: 8 },
      { t: .72, holder: 'O3' },
      { t: .88, type: 'shot', from: 'O3', to: 'HOOP', flight: .12, arc: 14 },
      { t: 1, type: 'dead' }
    ],
    def: {
      X1: { mark: 'O1', delay: .10, speed: 15, rules: [
        { t: 0, mode: 'onball', gap: 3.0 },
        { t: .28, mode: 'chase', gap: 2.4, side: 1 },
        { t: .48, mode: 'onball', gap: 2.6 },
        { t: .60, mode: 'help', w: .30 },
        { t: .82, mode: 'rim' }
      ] },
      X2: { mark: 'O2', delay: .18, speed: 13, rules: [
        { t: 0, mode: 'deny', gap: 2.4 },
        { t: .40, mode: 'help', w: .38 },
        { t: .66, mode: 'nail', w: .58 },
        { t: .86, mode: 'rim' }
      ] },
      X3: { mark: 'O3', delay: .14, speed: 15, rules: [
        { t: 0, mode: 'deny', gap: 2.6 },
        { t: .38, mode: 'deny', gap: 2.0 },
        { t: .56, mode: 'onball', gap: 2.2, mark: 'O3', maxSpeed: 17 },
        { t: .76, mode: 'contest', mark: 'O3' }
      ] },
      X4: { mark: 'O4', delay: .16, speed: 14, rules: [
        { t: 0, mode: 'gap', gap: 2.4 },
        { t: .26, mode: 'show', push: 3.0 },
        { t: .44, mode: 'drop', depth: .18 },
        { t: .60, mode: 'help', w: .40 },
        { t: .80, mode: 'rim' }
      ] },
      X5: { mark: 'O5', delay: .18, speed: 13, rules: [
        { t: 0, mode: 'help', w: .26 },
        { t: .36, mode: 'nail', w: .50 },
        { t: .60, mode: 'switch', mark: 'O3' },
        { t: .78, mode: 'rim' }
      ] }
    },
    notes: [
      { t: 0, o: 'O4 / O5 站两侧肘区，O1 居中观察', d: 'X4 / X5 各守一侧，X1 正面顶防，弱侧 X3 准备协防' },
      { t: .20, o: 'O1 向左侧移动，选择 O4 的掩护', d: 'X4 立刻上步 show，X5 同步下沉到罚球线（球未动，人先动）' },
      { t: .40, o: 'O1 借掩护切入，O3 从弱侧启动空切', d: 'X1 挤过与 X3 贴防同时进行，两侧不能先后反应' },
      { t: .58, o: 'O1 击地塞给空切的 O3', d: 'X5 换防接管切入者、X4 沉退护框、X3 全力追球，三点同时轮转' },
      { t: .74, o: 'O3 篮下接球起跳', d: 'X3 与 X5 前后夹击，X2 收缩到合理冲撞区边缘' },
      { t: .90, o: '出手', d: '五人同时卡位，弱侧 X2 / X1 冲抢篮板' }
    ]
  },

  {
    id: 'dho',
    name: '手递手外弹',
    en: 'Dribble handoff',
    tag: '手递手 / 追防换人',
    desc: 'O1 与 O2 完成手递手，O5 立即补上第二次掩护。防守两人必须在交接的一瞬间决定挤过还是换防，否则立刻出现空位。',
    duration: 5.6,
    off: {
      O1: [[0, 0, 30], [.16, 5, 29], [.30, 11, 27], [.40, 14, 26], [.52, 15, 25], [.68, 12, 21], [.86, 6, 18], [1, 3, 15]],
      O2: [[0, 16, 25], [.22, 15, 26], [.36, 13, 27], [.48, 9, 29], [.62, 5, 30], [.78, 3, 31], [1, 2, 31]],
      O3: [[0, -20, 24], [.38, -22, 16], [.70, -22, 8], [1, -22, 7]],
      O4: [[0, -8, 16], [.36, -6, 21], [.62, -3, 27], [1, -2, 29]],
      O5: [[0, 8, 16], [.20, 9, 22], [.36, 11, 27], [.50, 10, 28], [.64, 8, 24], [.82, 4, 16], [1, 2, 11]]
    },
    ball: [
      { t: 0, holder: 'O1' },
      { t: .36, type: 'pass', from: 'O1', to: 'O2', flight: .07, style: 'handoff', arc: 2 },
      { t: .43, holder: 'O2' },
      { t: .70, type: 'shot', from: 'O2', to: 'HOOP', flight: .14, arc: 20 },
      { t: 1, type: 'dead' }
    ],
    def: {
      X1: { mark: 'O1', delay: .10, speed: 15, rules: [
        { t: 0, mode: 'onball', gap: 2.8 },
        { t: .32, mode: 'onball', gap: 2.2 },
        { t: .44, mode: 'switch', mark: 'O2' },
        { t: .58, mode: 'deny', gap: 2.4, mark: 'O1' },
        { t: .78, mode: 'help', w: .34 }
      ] },
      X2: { mark: 'O2', delay: .12, speed: 15, rules: [
        { t: 0, mode: 'deny', gap: 2.4 },
        { t: .34, mode: 'chase', gap: 2.0, side: 1, maxSpeed: 17 },
        { t: .46, mode: 'onball', gap: 2.4, mark: 'O2' },
        { t: .68, mode: 'contest', mark: 'O2' }
      ] },
      X3: { mark: 'O3', delay: .20, speed: 13, rules: [
        { t: 0, mode: 'help', w: .36 },
        { t: .50, mode: 'help', w: .50 },
        { t: .76, mode: 'rim' }
      ] },
      X4: { mark: 'O4', delay: .18, speed: 13, rules: [
        { t: 0, mode: 'help', w: .26 },
        { t: .46, mode: 'deny', gap: 2.6 },
        { t: .72, mode: 'nail', w: .48 }
      ] },
      X5: { mark: 'O5', delay: .14, speed: 14, rules: [
        { t: 0, mode: 'gap', gap: 2.6 },
        { t: .32, mode: 'show', push: 3.2 },
        { t: .50, mode: 'drop', depth: .20 },
        { t: .66, mode: 'onball', gap: 2.8, mark: 'O5' },
        { t: .84, mode: 'rim' }
      ] }
    },
    notes: [
      { t: 0, o: 'O1 持球向右翼运球，O2 准备接手递手', d: 'X1 贴球，X2 绕前防接球，X5 提前顶住掩护位' },
      { t: .24, o: 'O1 / O2 靠拢，O5 上提补第二道掩护', d: 'X1 与 X2 必须此刻就喊换防，X5 同步 show' },
      { t: .38, o: '手递手完成，O2 顺势外弹', d: '球离手的同一帧 X2 挤过掩护追防，X1 换防接管 O1' },
      { t: .52, o: 'O2 借 O5 掩护拉出三分线', d: 'X5 沉退、X2 从掩护上方追，X4 补到弧顶防传球' },
      { t: .68, o: 'O2 接球直接拔起三分', d: 'X2 closeout 扑防、X5 收缩护框，弱侧两人同步轮转' },
      { t: .84, o: '出手', d: '五人同时转身挡人，X3 从弱侧冲抢篮板' }
    ]
  }
];
