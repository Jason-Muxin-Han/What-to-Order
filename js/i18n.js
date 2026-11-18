window.NBA = window.NBA || {};

/* 中英双语数据层：界面词条 + 战术出处/讲解英文版 + 防守术语 */
(function (NBA) {
  'use strict';

  const STRINGS = {
    appTitle: { zh: '攻防同步战术板', en: 'Sync Tactics Board' },
    tagline: { zh: '90 套 NBA 实战战术 · 10 人同帧仿真', en: '90 NBA plays · 10 players, one shared clock' },
    library: { zh: '战术库', en: 'Playbook' },
    search: { zh: '搜索战术 / 球队 / 体系', en: 'Search plays / teams / systems' },
    libHintSearch: { zh: '跨六类搜索结果 · 点击直接播放', en: 'Results across all six categories · click to play' },
    noMatch: { zh: '没有匹配的战术，换个关键词试试', en: 'No plays match. Try another keyword.' },
    viewHalf: { zh: '半场视图 · 47 ft', en: 'Half court · 47 ft' },
    viewFull: { zh: '全场视图 · 94 ft', en: 'Full court · 94 ft' },
    unitFt: { zh: '单位 ft', en: 'feet' },
    live: { zh: '实时仿真', en: 'Live simulation' },
    legendOff: { zh: '进攻 O1–O5', en: 'Offense O1–O5' },
    legendDef: { zh: '防守 X1–X5', en: 'Defense X1–X5' },
    legendBall: { zh: '球', en: 'Ball' },
    legendTrail: { zh: '跑位轨迹', en: 'Movement path' },
    legendLink: { zh: '对位连线', en: 'Matchup link' },
    currentPlay: { zh: '当前战术', en: 'Current play' },
    syncReadout: { zh: '同步解读', en: 'Synchronized read' },
    offense: { zh: '进攻', en: 'Offense' },
    defense: { zh: '防守', en: 'Defense' },
    simultaneous: { zh: '两条动作在同一帧发生', en: 'Both actions happen on the same frame' },
    defenseState: { zh: '防守实时状态', en: 'Live defensive state' },
    perFrame: { zh: '逐帧求解', en: 'Solved per frame' },
    clockAlign: { zh: '攻防时钟对齐', en: 'Offense / defense clock' },
    syncCaption: { zh: '攻防时钟完全重合 · 10 人同帧求值', en: 'Clocks fully aligned · 10 players solved per frame' },
    desyncA: { zh: '进攻独自推进中 · 防守被冻结', en: 'Offense advancing alone · defense frozen' },
    desyncB: { zh: '进攻已停止 · 防守才开始补位', en: 'Offense stopped · defense now catching up' },
    modeHintSync: {
      zh: '同一时间轴上，防守方每帧根据进攻站位、球的位置和篮筐求解目标点，叠加 0.10–0.20 秒反应延迟与最大移动速度，因此会出现真实的挤掩护滞后、协防收缩与轮转补位。',
      en: 'On one shared timeline, every defender solves a target from the offensive spacing, ball position and protected rim each frame, with a 0.10–0.20 s reaction delay and a capped speed. That produces genuine fighting-over-screen lag, help-side shrinkage and rotations.'
    },
    modeHintTurn: {
      zh: '对照模式（旧版）：前半段只有进攻方跑完，后半段防守方才补位。可以明显看到防守永远慢半拍 —— 这正是轮流播放不符合真实比赛的地方。',
      en: 'Comparison mode (legacy): the offense finishes in the first half of the timeline, then the defense moves in the second half. The defense is always a beat late — exactly why sequential playback is unrealistic.'
    },
    flagSync: { zh: '同步协同', en: 'In sync' },
    flagTurn: { zh: '轮流（旧版）', en: 'Sequential (old)' },
    trails: { zh: '跑位轨迹', en: 'Movement paths' },
    links: { zh: '对位连线', en: 'Matchup links' },
    play: { zh: '播放', en: 'Play' },
    pause: { zh: '暂停', en: 'Pause' },
    reset: { zh: '重置', en: 'Reset' },
    speed: { zh: '速度', en: 'Speed' },
    mode: { zh: '模式', en: 'Mode' },
    syncMode: { zh: '同步协同', en: 'Synchronized' },
    turnMode: { zh: '轮流对照', en: 'Sequential' },
    noteStage: { zh: '阶段', en: 'Phase' },
    of: { zh: '/', en: '/' },
    sets: { zh: '套', en: 'plays' },
    hoverTitle: { zh: '战术', en: 'Play' }
  };

  const CAT_NOTES = {
    full_off: { zh: '从后场发动，94 英尺推进，攻守双方全程同时移动', en: 'Started in the backcourt, 94 feet of transition with both sides moving together' },
    full_def: { zh: '紧逼、夹击与回防，压迫方与推进方同帧联动', en: 'Pressing, trapping and retreating, with pressure and advancement on the same frame' },
    half_off: { zh: '阵地战起手式，防守按对位与球实时反应', en: 'Half-court sets where the defense reacts live to matchups and the ball' },
    half_def: { zh: '换防、沉退、夹击与联防，五人协同轮转', en: 'Switching, drop, blitz and zone, with all five defenders rotating together' },
    front_inbound: { zh: '前场界外球（SLOB / 前场底线球），5 秒内直接形成出手', en: 'Frontcourt inbound (SLOB / baseline), a shot inside five seconds' },
    back_inbound: { zh: '后场界外球（BLOB / 压哨长传），需推进全场', en: 'Backcourt inbound (BLOB / buzzer heave), needing a full-court advance' }
  };

  const MODES = {
    onball: ['贴防持球', 'On-ball'], chase: ['挤过追防', 'Fight over'], deny: ['绕前拒传', 'Deny'],
    gap: ['对位待命', 'Gap stance'], show: ['上步干扰', 'Show'], drop: ['沉退护框', 'Drop'],
    help: ['协防收缩', 'Help side'], nail: ['罚球线协防', 'Nail help'], rim: ['篮下护框', 'Rim protect'],
    switch: ['换防接管', 'Switch'], closeout: ['扑防外线', 'Closeout'], contest: ['起跳干扰', 'Contest'],
    zone: ['守区域', 'Zone'], trap: ['双人夹击', 'Trap'], runjump: ['扑抢换防', 'Run & jump'],
    safety: ['拖后保护', 'Safety'], faceguard: ['绕前贴防', 'Face guard'], press: ['紧逼贴防', 'Full-court press'],
    scram: ['换回对位', 'Scram switch']
  };

  /* 每套战术：[英文出处, 英文讲解]，中文版在 catalog.js */
  const PLAY = {
    '7sol': ["Phoenix Suns 2004–08 · Mike D’Antoni / Steve Nash", "D’Antoni turned pace, spacing and the pick-and-roll into a complete system; Nash pushed the break within two seconds of a rebound. The five defenders here retreat, protect the rim and chase shooters on the very same frame."],
    showtime: ["Los Angeles Lakers 1980s · Pat Riley / Magic Johnson", "Magic grabbed the rebound and pushed himself, with Worthy and Scott filling the wings and Kareem trailing. Three-man breaks force defenders to choose between the rim and the wings simultaneously."],
    rungun: ["Denver Nuggets 1990–91 · Paul Westhead", "Westhead brought his college seven-second rule to the NBA; the 1990–91 Nuggets averaged a league-best 119.9 points. The break starts on any rebound, and the defense must handle the ball and both gaps at once."],
    outlet: ["Showtime Lakers / Seven Seconds Suns", "The big man secures the board and throws one pass ahead instead of dribbling, finding a wing already past midcourt. While the ball is in the air, all five defenders have already turned, split duties and started chasing."],
    grabgo: ["Milwaukee Bucks 2019–21 · Giannis Antetokounmpo", "Giannis rebounds and advances the ball himself instead of looking for the point guard; teammates only need to space the wings. Help and closeouts have to be decided in the same instant."],
    jokicout: ["Denver Nuggets 2020s · Nikola Jokić", "Jokić rebounds and throws a one-handed pass over the entire half-court to a cutting wing. The moment the ball leaves his hand, the pressing defenders must become retreat defenders or give up an open lane."],
    dubtrans: ["Golden State Warriors 2015–19 · Steve Kerr", "The Warriors made the transition three their first option: Curry passes and keeps moving while Draymond organizes from the arc. Retreating defenders must guard the rim and find shooters at the same time."],
    draypush: ["Golden State Warriors 2016–17 · Draymond Green", "Green rebounds and pushes through midcourt himself, with Curry and Klay spreading to create transition threes. Guarding the ball, the wings and the trailer are three simultaneous jobs."],
    heatout: ["Miami Heat 2010–14 · Erik Spoelstra", "After a pressure defense forces a turnover, LeBron or Wade throws a full-court pass to the other. On the very frame of the steal, the remaining three defenders have already begun a layered retreat."],
    nashadv: ["Phoenix Suns 2005–07 · Steve Nash", "Nash does not wait for teammates to arrive; he delivers the pass two steps ahead of the cutter. Defensive reads and offensive cuts have to be updated on the same frame."],
    earlydrag: ["D’Antoni system (Suns / Rockets)", "When the first break is not there, the trailing big immediately sets an early drag screen at the arc. As the offense accelerates, the defense must communicate a fight-over and a drop at the same time."],
    trailer3: ["Houston Rockets 2017–18 · Mike D’Antoni", "The last player trailing the break does not cut to the rim; he stops at the arc for a kick-out three. As the defense collapses to protect the paint, someone must simultaneously decide to close out."],
    pressbreak: ["NBA common · forced often by Toronto 2019", "Against full-court pressure the guard does not force the dribble: a short outlet, a third man advances through the middle. Trap, release and re-advance all happen on the same frame or it is an eight-second violation."],
    secbreak: ["San Antonio Spurs 2000s · Popovich / Parker", "When Parker’s first push stalls he does not stop; the weak-side big sets a second screen and the team flows into early offense. The defense switches from retreat sets to half-court matchups in one beat."],
    fiveout: ["Modern 2020s transition offense", "All five players space beyond the arc, emptying the paint for the ball handler. With the floor spread, the defense can neither blitz nor collapse — all five positions must be decided at once."],

    press221: ["Originating with UCLA’s John Wooden · used NBA late-game", "Two press the inbound, two clog the midcourt passing lanes, one stays back as a safety. The trap point moves with the ball and all four others must rotate on the same frame."],
    diamond: ["Toronto Raptors 2019–20 · Nick Nurse", "Toronto’s 1-2-1-1 diamond press powered a 30-point comeback against Dallas in December 2019. One pressures the inbounder, two deny the catch, one traps and one plays safety — five positions moving together."],
    threeq: ["Rick Pitino pressure system · used selectively in NBA", "The defense lets the ball cross midcourt, then traps at the sideline and half-court line. The instant the trap closes, the other three must cut off the return pass and occupy the lanes."],
    runjump: ["Classic pressure system · occasional NBA use", "A defender abandons his man and jumps to the ball while a teammate takes over his assignment immediately. Both switches must happen on the same frame and rely on constant communication."],
    fullman: ["Boston Celtics 2008 · Rivers / Thibodeau system", "No comfortable catch for the opposing guard: full-court one-on-one pressure starting at the baseline. As the ball advances, the other four must adjust pressure and help distance together."],
    inboundtrap: ["Raptors / Heat late-game comeback staple", "Two defenders attack the receiver within the five-second inbound window, forcing a rushed pass. Inbounder, receiver and both trappers occupy the same timeline."],
    sidelinetrap: ["Core of the 2-2-1 zone press", "Force the ball handler to the sideline so the boundary becomes a third defender, then bring the second trapper. The other three rotate to the ball-side lanes on the same frame."],
    midtrap: ["Preset trap zone of full-court presses", "Wait until the ball reaches midcourt before trapping, using the line and the eight-second count as pressure. When the trap starts, the safety steps up and the weak side cuts off the return."],
    rimreturn: ["Milwaukee Bucks 2019– · Budenholzer", "Milwaukee would rather give up the outside shot and get its big back to the rim; the other four then close out in sequence. Rim protection and perimeter closeouts are decided on the same beat."],
    getback: ["Spurs / Heat transition defense principle", "No offensive rebound gamble and no reach: all five sprint back immediately. Who protects the rim, who takes the arc and who chases the corner is assigned while the ball is still moving."],
    denyoutlet: ["Standard anti-transition deployment", "The first priority after a change of possession is not retreat but denying the outlet pass. Denial, retreat and rim protection are executed by different players at the same time."],
    boxpress: ["Extension of Toronto’s 2019 box-and-one", "One defender face-guards the star while four others form a square over the passing lanes. When the face-guard gets caught on a screen, the square shifts with the ball on the same frame."],
    press131: ["A common zone-press alignment", "One up top, three across midcourt and one deep safety, using length to fill the lanes. Every ball reversal makes the entire three-man line slide together."],
    fakepress: ["Late-game pace-control variation", "Show pressure to slow the opponent, then drop all five into a half-court set once the ball is inbounded. The show and the fallback must happen on the same beat or the offense gets an open look."],
    lategame: ["Toronto Raptors vs Dallas 2019", "When trailing by 20+, a full-court press compresses each possession into eight to ten seconds and trades risk for extra possessions. Pressure, steal and retreat are decided on the same frame."],

    pnr: ["Utah Jazz 1990s · Malone / Stockton", "The most used two-man action in basketball: the big screens, the handler attacks or drops a pass to the roller. Fighting over, dropping and weak-side help must all happen on one frame."],
    spain: ["Miami Heat 2023 playoffs · Erik Spoelstra", "A back screen behind the roller punishes drop coverage with a second layer of action. The defense needs two consecutive communications and a weak-side closeout, making it a perfect test of synchronization."],
    horns: ["Boston Celtics ATO common set", "Two bigs at the elbows, the guard picks a side to attack while the weak side cuts. The defense has to switch and help at the very moment the ball handler makes his choice."],
    dho: ["Golden State Warriors motion system · Kerr", "After the handoff the big immediately adds a second screen and the receiver curls into a three. Both defenders must decide to fight over or switch on the exchange itself."],
    triangle: ["Chicago Bulls 1990s / Lakers 2000s · Winter / Jackson", "Three players form a strong-side triangle, two stretch the weak side, and low-post threats create reads for Jordan, Kobe, Pippen and Gasol. Weak-side links and defensive rotations happen together."],
    princeton: ["Sacramento Kings 2000s · Webber / Divac", "Pete Carril’s high-post system uses backdoors, cuts and constant ball reversal. Sacramento brought it to its NBA peak; once a defender follows the ball, the cut and the help must start together."],
    floppy: ["Spurs ATO (Leonard / Ginobili) · Popovich", "The shooter starts at the baseline and two bigs set down screens on either side; he reads which way to curl. Both screens go up together and both defenders must decide to fight over or switch."],
    iverson: ["Philadelphia 76ers 2000s · Larry Brown for Allen Iverson", "The handler crosses the free-throw line off two consecutive big-man screens and attacks the other side. The Hawks and Timberwolves reuse it in SLOB; screens and pursuit interleave on the same frames."],
    elevator: ["Golden State Warriors 2014–16 · Stephen Curry", "Two bigs stand like doors, the shooter runs between them and the doors close on his defender. As the doors shut, the other three defenders must rewrite their help and closeout assignments."],
    hammer: ["San Antonio Spurs corner-three system", "A strong-side pick-and-roll pulls help while a weak-side hammer screen springs the corner shooter. The blitz and the hammer are two actions on the same beat — the clearest example of ball and people moving."],
    flex: ["Continuous baseline-screen system · used by NBA teams", "Baseline cross-screens and down screens form a repeating cycle in which every cutter fills the next spot. Five players rotate like gears and the defense must call switches on the same rhythm."],
    ucla: ["John Wooden high-post action · still used in NBA", "A guard passes to the elbow and cuts off the big man’s shoulder for a return layup. Pass, cut and the defender’s fight-over or switch are compressed into one frame."],
    zipper: ["Spurs (Parker) / Warriors common set", "A guard cuts straight up from the baseline off an elbow screen for a clean catch at the top. Screen and catch are continuous, so the defense must fight over and close out in the same motion."],
    chicago: ["Atlanta Hawks 2017–18 / Warriors motion", "A down screen flows into a handoff and then straight into a ball screen, all in one sequence. Switching, fighting over and dropping stitch together with no pause."],
    emptyside: ["Houston Rockets 2018 · Harden / Capela", "The weak side is emptied so the handler and screener can play pick-and-roll without help. With no weak-side helper, all five defenders must cover the gaps on the same beat."],

    switchall: ["Golden State Warriors 2015–19 / Rockets 2018", "The Warriors used Green and a rotation of wings to switch every screen; Houston used the same idea against their motion. Switching means five players change assignments at once — any hesitation creates an opening."],
    drop: ["Milwaukee’s Brook Lopez / Utah’s Rudy Gobert", "The big retreats to protect the rim and concedes the mid-range while the on-ball defender fights over. Drop depth and tagging the roller must be synchronized or the short roll breaks the coverage."],
    blitz: ["Miami’s Spoelstra / Toronto’s Nurse", "Two defenders trap the ball handler the moment the screen arrives, forcing the pass and leaving a four-on-three scramble. Blitz and rotation are one frame apart — late means a corner three."],
    zone23: ["Miami Heat 2020 playoffs", "The Heat’s 2-3 zone disrupted Boston’s drives in the bubble and forced contested mid-range jumpers. Two top defenders and three back-line defenders slide as a single board with the ball."],
    zone32: ["NBA variant used to pressure the perimeter", "Three defenders above the break and two at the rim trade paint touches for outside pressure. Every ball movement slides the entire top line together while the low two protect the basket."],
    zone131: ["Dallas Mavericks 2011 · Rick Carlisle", "Carlisle’s 1-3-1 zone disrupted passing lanes and created turnovers during the title run. One up top, three across and one back: every pass makes the whole line adjust at once."],
    boxone: ["Toronto Raptors 2019 Finals · Nick Nurse", "One defender glued to Curry while four others formed a square zone. The instant the face-guard is caught on a screen, the square must shift to cover the space behind him."],
    tritwo: ["Hybrid defense against two primary scorers", "Two defenders lock onto the opponent’s top scorers while three form a triangle zone. Face-guarding and zone help constantly pull against each other on the same timeline."],
    ice: ["Common side pick-and-roll coverage · funnel to the sideline", "The on-ball defender wins over the screen and sends the ball to the sideline instead of the middle, using the boundary as an extra defender. Ice and weak-side shrink must start together."],
    hedge: ["Coverage for mobile big men", "The big steps out briefly to slow the ball handler, then sprints back to his man. During that show and recovery, a weak-side defender must tag the roller at the same time."],
    packline: ["Thibodeau system (Bulls / Timberwolves)", "Four off-ball defenders stay one step inside the arc and funnel drives into pre-positioned help. Shrinking and closing out are triggered by the same read."],
    xout: ["Miami Heat weak-side rotations · Spoelstra", "The corner helper flies to the arc and another defender crosses to take his corner, forming an X. The two rotations are almost simultaneous and are the half-court defense’s toughest sync test."],
    denystar: ["Standard deployment against a star shooter", "The defender plays between his man and the ball and refuses the catch. If denial fails, weak-side help and recovery must start on the same frame."],
    scram: ["Warriors / Celtics mismatch rescue", "When a switch leaves a small defender posted up by a big, the weak-side big calls Scram and takes the matchup back. Switching, sealing and resetting all happen together."],
    matchzone: ["Miami Heat 2020s hybrid defense", "It looks like a zone but hands off like man-to-man, hiding perimeter weaknesses. Every handoff is completed by two defenders on the same frame so the disguise never breaks."],

    slobfloppy: ["Spurs / Celtics ATO staple", "A sideline inbound and two down screens let the shooter curl to either side. Both screens go up together and both defenders must decide to fight over or switch at the same time."],
    slobdiamond: ["Atlanta Hawks 2016–18 · Mike Budenholzer", "The Hawks’ diamond SLOB puts one player under the rim, one at the top and two bigs at the elbows, with two guards swapping as the ball is inbounded. First option is the top cut, second follows immediately."],
    slobchicago: ["Hawks’ Belinelli / widely used today", "A down screen flows into a handoff to deliver the shooter to his spot. Screen, handoff and defensive switching are stitched into a single motion."],
    slobhammer: ["Minnesota Timberwolves 2016–17 · Thibodeau", "Designed for Andrew Wiggins: an Iverson cut occupies two defenders while a weak-side hammer screen frees the corner three. Strong and weak side each execute an action on the same beat."],
    slobflare: ["Timberwolves 2016–17 · Wiggins buzzer-beater vs Phoenix", "Thibodeau’s late-game set: Wiggins crosses off two screens and a flare screen follows on the weak side. Within the five-second inbound window, every defensive switch must be synchronized."],
    slobelevator: ["Golden State Warriors inbound ATO", "Two bigs form a door, the shooter runs through and the doors close behind him. Closing and inbounding happen together; once the defender is trapped, the other four rotate at once."],
    slobstack: ["Common NBA ATO numbering", "Four players stack along the free-throw line and scatter in four directions on the inbound. The stack is a decoy; the four cuts and four defensive choices are triggered on the same frame."],
    slobbox: ["Common NBA ATO numbering", "Four players form a box, two bigs set cross screens in the low post and two wings pop out. Both screening lines start together and so must the defensive calls."],
    slobline: ["Standard frontcourt last-shot play", "Four players line up and split to the baseline and arc, clearing room for the final attempt. With seconds left, the cuts and the defensive closeouts must arrive together."],
    slobzipper: ["Hawks’ Schröder / common SLOB entry", "A guard zipper-cuts off an elbow screen to catch the inbound, then immediately enters a side pick-and-roll. The cut and the next screen are connected without a pause."],
    sloblob: ["Classic baseline inbound series", "A fake outward run pulls the defense away while a weak-side big cuts backdoor for a lob. Fake, cut and help all share the same timeline."],
    slobhorns: ["Boston Celtics ATO common set", "The inbound flows straight into a horns alignment and the guard picks a screen. There is no pause between the sideline ball and half-court offense, so the defense must match up while the ball is in the air."],
    slob35: ["Common NBA ATO numbering", "One player runs the baseline while another curls the opposite way, creating a momentary mismatch. When they cross, both defenders must communicate a switch on the same frame."],
    slobsplit: ["Golden State Warriors · Kerr motion system", "After the catch, two players set a cross screen and split while a third pops out. The split, the switch and the weak-side help all happen on the same beat."],
    slobquick: ["Standard ATO when trailing by three", "No extra movement: one screen delivers the ball to a shooter for a quick three. Inbound, screen and closeout must all be completed inside the same instant."],

    blobstack: ["Common NBA ATO numbering", "Four players stack at the free-throw line and split into two receiving lanes to advance safely within five seconds. The split, the catch and the press rotations start together."],
    blobbox: ["Common NBA ATO numbering", "Four players form a box, two bigs set cross screens low and a guard runs through the middle. Screen and release must be on the same frame."],
    blob4down: ["Common NBA ATO numbering", "Four players line up low and sprint forward together, creating depth for the inbound. The instant they start, the five defenders must assign their retreat duties."],
    blobwheel: ["Continuous-screen inbound series", "The receiver runs through three consecutive screens like a wheel, stretching the defensive chain. Every screen he rounds requires the defenders to update their rotation together."],
    blobzipper: ["San Antonio Spurs baseline inbound series", "Parker inbounds and cuts through three teammates’ screens, curling out of the weak side into a pick-and-roll. The curl and the defender’s fight-over are decided on the same frame."],
    blobdouble: ["Golden State Warriors · Curry baseline exits", "Curry passes and walks into the paint, then chooses one of two baseline exits to curl back to the ball. Both exits exist at once so the defense cannot lean either way."],
    hailmary: ["Standard last-second full-court heave", "The inbounder throws the ball the length of the floor for a contested finish or a tip. While the ball is airborne, all ten players are already moving."],
    maryland: ["Classic play when only seconds remain to cross midcourt", "A two-stage short-then-long advance solves the clock problem. The first and second receiving spots must start on the same beat."],
    splitpress: ["One of the standard buzzer-beater sets", "Two receivers split to the sides and a third cuts straight through, forcing the press to divide. All three cuts start on the same frame and so do the three defensive choices."],
    dukepress: ["One of the standard buzzer-beater sets", "Fake a reception to one side, then loft the ball to a sprinter on the other. During the gap between fake and pass, the defense’s weight has already shifted in sync with each other."],
    blobbreak: ["Inbound response to a full-court press", "No hopeful heave: three short passes advance the ball past midcourt before the trap closes. Every release and catch must beat the trap on the same timeline."],
    blob23: ["Baseline inbound series against a 2-3 zone", "Stack players in the two seams of the zone and hit the area behind it with one pass. Stack and scatter must be simultaneous or the zone recovers."],
    blobindiana: ["Baseline inbound series against zone defenses", "Use the gap around the free-throw line for a high-post catch, then skip to the weak side. High post and weak side are started by different players at the same time."],
    blobpinball: ["Continuous-screen inbound series", "The receiver Ping-Pongs through several screens, forcing continuous switches. The receiver’s reversals and the defenders’ calls must stay on the same rhythm."],
    blobcross: ["Full-court cross-inbound series", "Two receivers cross near midcourt and one takes the handoff straight up the floor. At the crossing, both defenders must decide to switch or follow at once."]
  };

  /* 每个参数化骨架 5 个阶段的英文攻防解读，索引与 templates.js 的 notes 一一对应 */
  const TPL_NOTES = {
    push: [
      ['O1 takes the inbound in the backcourt and the wings sprint wide', 'X1 takes the ball while the other four turn and retreat on the same frame'],
      ['O1 crosses midcourt as O2 and O3 fill both sidelines', 'X2 and X3 retreat while staying attached; X4 drops to deny the long pass'],
      ['Entering the frontcourt, O5 rolls down the middle and pulls the rim protector', 'X1 chasing the ball and X5 cutting off the roll happen together'],
      ['O1 looks up and kicks, with the trailer and corner both available', 'The moment the ball moves, all five defenders re-locate in sync'],
      ['The finish', 'X5 contests, X3 shrinks to protect and X1 retreats to box out']
    ],
    outlet: [
      ['O4 secures the rebound and throws one pass ahead', 'X1 and X2 switch from pressure to retreat on the same frame'],
      ['A full-court pass leaves the handler’s hands', 'While the ball is airborne, all five defenders have already turned and split duties'],
      ['The receiver catches in the frontcourt as the others fill lanes and trail', 'X3 chases, X5 protects the rim and X4 fills the middle — all at once'],
      ['Advancing into the frontcourt, the first option is open', 'Help-side shrink and perimeter closeout must be decided together'],
      ['The fast-break finish', 'X5 contests the shot while X1 and X2 box out']
    ],
    pressbreak: [
      ['O1 is forced toward the sideline in the backcourt', 'X1 and X5 trap together while the other three occupy the passing lanes'],
      ['Instead of forcing it, O1 makes the short outlet to O5', 'The trap has barely closed when the defender rotation must already begin'],
      ['O4 steps up as the third receiving option in the middle', 'X2 and X3 retreat from the trap to their assignments together'],
      ['The ball returns to O1, who accelerates through midcourt', 'X1 picks the ball back up while X4 covers the vacated trailer'],
      ['The press is broken and the frontcourt has an advantage', 'All five retreat and re-assign rim protection and closeouts at once']
    ],
    early: [
      ['The first break is not there, so O1 keeps the ball', 'The five retreating defenders are already finding their matchups'],
      ['Wings pull to the corners while O5 trails at full speed', 'X2 and X3 retreat while keeping their distance from shooters'],
      ['O5 does not wait — he sets an early drag screen at the arc', 'X5’s drop and X1’s fight-over must be communicated on the same frame'],
      ['O1 changes direction off the screen and delivers the pass', 'As the ball leaves, weak-side help and closeouts start together'],
      ['The early-offense finish', 'X4 covers the arc, X5 protects and X1 chases — all arriving together']
    ],
    press: [
      ['The opponent inbounds from the backcourt with five players spread', 'The press is set: front two and midcourt two step up on the same frame'],
      ['O1 receives and advances along the sideline', 'X1 and X2 trap together while the safety steps up'],
      ['Trapped, O1 throws a hurried pass to the weak side', 'As the trap closes, X3 and X4 cut off the return lanes'],
      ['The ball flips sides and the entire pressure line must slide', 'All five zone anchors shift with the ball; one late step means a gap'],
      ['A contested shot', 'X5 protects the rim, X1 closes out and X3 boxes out together']
    ],
    retreat: [
      ['No gamble for the steal — all five sprint back on a turnover', 'Rim, arc and corner duties are assigned at the same moment'],
      ['The guard pushes through midcourt', 'X1 holds position while X4 stays deep against the long pass'],
      ['The ball swings to a wing and the retreat shape must shift', 'X2 closing out and X5 protecting the rim happen on the same beat'],
      ['The receiver starts his shot', 'X3 shrinks from the weak side and X1 closes out together'],
      ['The shot goes up', 'X5 boxes out while the other four collapse at once']
    ],
    screen: [
      ['O1 holds the ball at the top as the shooter waits on the baseline', 'X2 denies the catch while the other four set their help distances'],
      ['O4 and O5 set two screens at the same time', 'X4 and X5 must each call fight-over or switch on the same frame'],
      ['O2 curls off the screens and catches in the first window', 'X2 pursues while X1 adjusts his help position together'],
      ['The ball goes to the finisher', 'Once the ball moves, weak-side help and closeouts are rewritten together'],
      ['The shot', 'X3 helps, X5 protects the rim and X1 boxes out']
    ],
    hammer: [
      ['O1 and O5 start a strong-side pick-and-roll, weak-side players ready', 'X1 takes the ball, X5 waits and X3/X4 shrink together'],
      ['O1 attacks the elbow as O5 rolls', 'X5 shows and X1 fights over on the same frame'],
      ['Strong-side help collapses and O4 sets a weak-side hammer screen', 'As help shrinks, the weak-side rotation must arrive with it'],
      ['The skip pass finds the weak-side opening', 'Ball and people move together: all five defenders re-locate'],
      ['The finish', 'X3 closes out, X5 protects and X2 boxes out']
    ],
    cut: [
      ['A strong-side triangle forms with the ball at the top', 'The five defenders set help distances by ball side together'],
      ['The ball enters the high post', 'As it arrives, X4 steps up and the weak side shrinks together'],
      ['The cutter starts behind his defender', 'X1 and X2 must call a fight-over or a switch on the same frame'],
      ['A return pass cuts through the defense', 'X5 helps and X3 shrinks together — the weak side cannot wait for the ball'],
      ['The finish at the rim', 'Rim protection, box-out and retreat all end on the same beat']
    ],
    zoneDef: [
      ['The opponent starts a high pick-and-roll; the zone is set in five areas', 'Two top and three back-line defenders fix their zones together'],
      ['The handler attacks the strong side off the screen', 'The whole zone slides with the ball instead of following men'],
      ['The ball enters the high post and a seam appears', 'Neighboring defenders must hand off together — neither can wait'],
      ['The ball swings weak side', 'The top closeout and the back-line rim protection happen on the same beat'],
      ['The opponent shoots', 'All five collapse together to secure the rebound']
    ],
    manDef: [
      ['The opponent starts a high pick-and-roll; the coverage is called', 'All five decide on the same frame whether they are on-ball, in help or switching'],
      ['The screen arrives and the handler attacks', 'On-ball and screener defenders decide together'],
      ['The ball reaches the elbow and the roller dives', 'Weak-side tag and rim protection shrink at the same time'],
      ['The ball is forced out or swung weak side', 'Rotation and closeout must be simultaneous — any delay is an open shot'],
      ['The opponent shoots', 'All five turn and box out to finish the possession']
    ],
    slob: [
      ['O5 stands out of bounds with four players set', 'All five defenders assign matchups and deny positions on the same frame'],
      ['The inbound pass is made and the first cutter starts', 'Inbound and pursuit happen on the same frame, never in sequence'],
      ['Screens go up as the second and third options appear', 'Two defenders must call fight-over or switch together'],
      ['The ball reaches the true shooter', 'Ball movement and weak-side help are rewritten at once'],
      ['The shot goes up inside five seconds', 'Closeout, rim protection and box-out finish together']
    ],
    blob: [
      ['O5 stands on the baseline with four players set to receive', 'All five defenders decide on the same frame whether to press or drop back'],
      ['A short safe outlet — or a heave past midcourt', 'Inbound assigns pressure and retreat duties simultaneously'],
      ['O1 advances with the wings filling the lanes', 'All five defenders slide with the ball rather than waiting for it to land'],
      ['Entering the frontcourt, the first option appears', 'Closeout and rim protection are one decision, not two'],
      ['The finish', 'X5 contests, X3 shrinks and X1 boxes out together']
    ]
  };

  /* 4 套手工精细战术的英文解读，索引与 plays.js 的 notes 一一对应 */
  const PLAY_NOTES = {
    pnr: [
      ['O1 holds at the top as O5 comes up from the right elbow', 'X1 keeps a three-foot gap while X5 waits in help'],
      ['O5 sets the screen and the weak side spaces to the corners', 'X5 shows early while X2 and X3 shrink slightly with the ball'],
      ['O1 accelerates right off the screen', 'X1 fights over and X5 steps out on the very same frame'],
      ['O1 reaches the elbow and O5 turns to roll', 'X5 recovers and drops, X3 shrinks to protect and X4 covers the top'],
      ['O1 drops a bounce pass to the rolling O5', 'The moment the ball moves all five re-locate: X5 chases, X1 lets go'],
      ['O5 catches and drives straight at the rim', 'X3 fills the rim, X2 drops to the free-throw line, X5 chases from behind'],
      ['O5 goes up at the basket', 'X3 and X5 jump together while X1 retreats for the rebound']
    ],
    spain: [
      ['O1 holds at the top, O2 on the right wing and O3 on the left', 'Five one-to-one matchups, with weak-side X3 leaning toward the ball'],
      ['O5 sets the screen as O3 starts his cross', 'X5 must show while X3 follows across — waiting is not an option'],
      ['O3 back-screens O5 behind the play', 'X3 is caught and X5/X3 must communicate a switch instantly'],
      ['O5 rolls and pulls two defenders as O2 pops to the right arc', 'X3 takes O5, X4 fills the nail and X2 tracks down O2'],
      ['O1 throws a skip pass to the weak-side O2', 'While the ball is in the air, four defenders jump to the ball and X2 closes out'],
      ['O2 catches and rises for three', 'X2 arrives on the closeout and X4 rotates while X3/X5 secure the glass'],
      ['The shot goes up', 'All five box out at once instead of recovering one by one']
    ],
    horns: [
      ['O4 and O5 hold the two elbows as O1 reads the set', 'X4 and X5 guard each elbow, X1 faces up and X3 is ready to help'],
      ['O1 moves left and chooses O4’s screen', 'X4 shows while X5 drops to the free-throw line — ball still stationary, people already moving'],
      ['O1 cuts off the screen as O3 starts a weak-side slice', 'X1 fights over and X3 denies at the same time; neither side can wait'],
      ['O1 bounces the pass to the cutting O3', 'X5 switches to the cutter, X4 drops and X3 chases — a three-point rotation at once'],
      ['O3 catches at the rim and goes up', 'X3 and X5 double-team while X2 shrinks to the restricted area'],
      ['The shot', 'All five box out together and X2/X1 crash the glass']
    ],
    dho: [
      ['O1 dribbles right as O2 prepares to receive the handoff', 'X1 takes the ball, X2 denies the catch and X5 sets up at the screen spot'],
      ['O1 and O2 converge as O5 comes up for the second screen', 'X1 and X2 must call a switch at this instant while X5 shows'],
      ['The handoff is complete and O2 curls out', 'On the exact frame the ball leaves, X2 fights over and X1 takes O1'],
      ['O2 uses O5’s screen to pull out for three', 'X5 drops, X2 chases over the top and X4 covers the top of the key'],
      ['O2 catches and rises for three', 'X2 closes out, X5 shrinks to protect and the weak side rotates together'],
      ['The shot', 'All five turn and box out at the same time as X3 crashes from the weak side']
    ]
  };

  NBA.I18N = {
    lang: 'zh',
    set(lang) { this.lang = (lang === 'en') ? 'en' : 'zh'; },
    t(key) {
      const row = STRINGS[key];
      if (!row) return key;
      return row[this.lang] || row.zh;
    },
    playField(id, field) {
      const row = PLAY[id];
      if (!row || this.lang !== 'en') return null;
      return field === 'era' ? row[0] : row[1];
    },
    catNote(id) {
      const row = CAT_NOTES[id];
      return row ? (this.lang === 'en' ? row.en : row.zh) : '';
    },
    catName(id) {
      if (this.lang !== 'en') return null;
      const c = (NBA.CATEGORIES || []).filter(x => x.id === id)[0];
      return c ? c.en : null;
    },
    mode(mode) {
      const row = MODES[mode];
      return row ? (this.lang === 'en' ? row[1] : row[0]) : mode;
    },
    noteEn(play, idx) {
      if (this.lang !== 'en') return null;
      const row = PLAY_NOTES[play.id] || TPL_NOTES[play.tpl];
      const pair = row ? row[idx] : null;
      return pair ? { o: pair[0], d: pair[1] } : null;
    }
  };

})(window.NBA);
