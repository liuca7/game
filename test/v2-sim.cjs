/* ============================================================
 * V2 改进方案数值复算脚本
 * 基于现有 public/js/data.js 的真实事件数据，
 * 验证 V2 四个可证伪命题：
 *   P1 人设达成：组合目标线（主属性>=95 且其余>=50）的
 *      随机策略与人设策略区分度
 *   P2 精力收支：精力约束下随机玩家温和、专注玩家可见约束，
 *      人设折扣校准扫描
 *   P3 低谷保护：属性<30 时事件加权能否让自救玩家拉回，
 *      摆烂玩家仍被开除
 *   P4 周目标：次数型 vs 净增长型判定的完成率与区分度
 * 运行：node test/v2-sim.cjs
 * ============================================================ */
const fs = require("fs");
const vm = require("vm");
const path = require("path");

const root = path.resolve(__dirname, "..");
const ctx = {};
vm.createContext(ctx);
const dataSrc =
  fs.readFileSync(path.join(root, "public/js/data.js"), "utf8") +
  "\n;({ EVENTS, REFLECTION_CHOICES });";
const { EVENTS, REFLECTION_CHOICES } = vm.runInContext(dataSrc, ctx);

const ATTRS = ["deyu", "zhili", "tiyu", "meiyu", "laoyu"];
const MAX_V = 100, MIN_V = 0;
const TOTAL_DAYS = 90;
const FORTUNES = [
  { mult: 1.35, w: 8 }, { mult: 1.15, w: 22 }, { mult: 1.0, w: 40 },
  { mult: 0.85, w: 22 }, { mult: 0.7, w: 8 },
];

function rollFortune() {
  const tot = FORTUNES.reduce((s, f) => s + f.w, 0);
  let r = Math.random() * tot;
  for (const f of FORTUNES) { r -= f.w; if (r <= 0) return f; }
  return FORTUNES[2];
}

function apply(attrs, effects, mult) {
  const out = { ...attrs };
  for (const [k, raw] of Object.entries(effects)) {
    if (!(k in out)) continue;
    const delta = Math.round(raw * mult);
    out[k] = Math.max(MIN_V, Math.min(MAX_V, out[k] + delta));
  }
  return out;
}

function newGame() {
  return { deyu: 60, zhili: 60, tiyu: 60, meiyu: 60, laoyu: 60 };
}

/* ---------- 事件收益统计（V2 配置依据） ---------- */
function statEvents() {
  const perAttr = {};
  ATTRS.forEach((a) => (perAttr[a] = { pos: [], neg: [] }));
  EVENTS.forEach((ev) => {
    ev.choices.forEach((c) => {
      for (const [k, v] of Object.entries(c.effects || {})) {
        if (perAttr[k]) (v >= 0 ? perAttr[k].pos : perAttr[k].neg).push(Math.abs(v));
      }
    });
  });
  const rows = ATTRS.map((a) => ({
    attr: a,
    posAvg: +(perAttr[a].pos.reduce((s, v) => s + v, 0) / perAttr[a].pos.length).toFixed(2),
    posMax: Math.max(...perAttr[a].pos),
    negAvg: +(perAttr[a].neg.reduce((s, v) => s + v, 0) / perAttr[a].neg.length).toFixed(2),
    posCount: perAttr[a].pos.length,
  }));
  console.log("== 事件属性收益统计（含自由时光 +8 选项） ==");
  rows.forEach((r) => console.log(`  ${r.attr}: 正收益均值 ${r.posAvg} / 最大 ${r.posMax} / 负收益均值 ${r.negAvg} / 正选项数 ${r.posCount}`));
  return rows;
}

/* ---------- P1 人设达成 ---------- */
function runGame(strategy, opts = {}) {
  const focus = opts.focus || "zhili";
  let attrs = newGame();
  let last = -1;
  const days = opts.days || TOTAL_DAYS;
  for (let d = 0; d < days; d++) {
    let idx = Math.floor(Math.random() * EVENTS.length);
    while (idx === last) idx = Math.floor(Math.random() * EVENTS.length);
    last = idx;
    const ev = EVENTS[idx];
    let choice;
    if (strategy === "random") {
      choice = ev.choices[Math.floor(Math.random() * ev.choices.length)];
    } else if (strategy === "focus") {
      choice = ev.choices.reduce((best, c) => {
        const v = (c.effects && c.effects[focus]) || 0;
        const bv = (best.effects && best.effects[focus]) || 0;
        return v > bv ? c : best;
      });
    } else {
      choice = ev.choices.reduce((best, c) => {
        const sv = (c.effects ? Object.values(c.effects).reduce((s, x) => s + x, 0) : 0);
        const bv = (best.effects ? Object.values(best.effects).reduce((s, x) => s + x, 0) : 0);
        return sv > bv ? c : best;
      });
    }
    attrs = apply(attrs, choice.effects, rollFortune().mult);
  }
  return attrs;
}

function p1() {
  const N = 5000;
  const lines = [85, 90, 95, 98, 100];
  const res = {};
  for (const strat of ["random", "focus"]) {
    res[strat] = {};
    const samples = [];
    for (let i = 0; i < N; i++) samples.push(runGame(strat));
    for (const line of lines) {
      const hit = samples.filter((a) => a.zhili >= line).length;
      res[strat][line] = +((hit / N) * 100).toFixed(1);
    }
  }
  console.log("\n== P1 人设达成（智力目标线扫描，5000局） ==");
  console.log("  目标线 | 随机策略达成率 | 人设策略达成率");
  for (const line of lines) {
    console.log(`  >=${line}   |   ${res.random[line]}%        |   ${res.focus[line]}%`);
  }
  const combo = { random: 0, focus: 0 };
  for (const strat of ["random", "focus"]) {
    for (let i = 0; i < N; i++) {
      const a = runGame(strat);
      if (a.zhili >= 95 && ATTRS.filter((k) => k !== "zhili").every((k) => a[k] >= 50)) combo[strat]++;
    }
  }
  console.log("  组合目标（智力>=95 且 其他四育>=50）达成率: 随机", +((combo.random / N) * 100).toFixed(1) + "% | 人设", +((combo.focus / N) * 100).toFixed(1) + "%");
  return res;
}

/* ---------- P2 精力收支（参数校准扫描） ---------- */
function energyCost(choice, tier) {
  const sum = Object.values(choice.effects || {}).reduce((s, v) => s + v, 0);
  const cfg = {
    old: { hi: -15, mid: -8, lo: -2, rec: 10 },
    new: { hi: -12, mid: -6, lo: -2, rec: 15 },
    loose: { hi: -10, mid: -5, lo: -2, rec: 18 },
    target: { hi: -12, mid: -6, lo: -2, rec: 20 },
  }[tier];
  if (sum >= 8) return cfg.hi;
  if (sum >= 4) return cfg.mid;
  if (sum >= 0) return cfg.lo;
  return cfg.rec;
}

function runWithEnergy(strategy, opts = {}) {
  let attrs = newGame();
  let energy = 100;
  let last = -1;
  let forcedRest = 0;
  let energyEmpty = 0;
  const focus = opts.focus || "zhili";
  const lowThreshold = opts.lowThreshold ?? 20;
  const tier = opts.tier || "new";
  const discount = opts.discount || 1;
  for (let d = 0; d < TOTAL_DAYS; d++) {
    let idx = Math.floor(Math.random() * EVENTS.length);
    while (idx === last) idx = Math.floor(Math.random() * EVENTS.length);
    last = idx;
    const ev = EVENTS[idx];
    const low = energy < lowThreshold;
    let pool = ev.choices;
    if (low) {
      pool = ev.choices.filter((c) => energyCost(c, tier) >= -8);
      if (!pool.length) pool = ev.choices;
    }
    let choice;
    if (strategy === "random") choice = pool[Math.floor(Math.random() * pool.length)];
    else {
      choice = pool.reduce((best, c) => {
        const v = (c.effects && c.effects[focus]) || 0;
        const bv = (best.effects && best.effects[focus]) || 0;
        return v > bv ? c : best;
      });
    }
    attrs = apply(attrs, choice.effects, rollFortune().mult);
    let c = energyCost(choice, tier);
    if (strategy === "focus" && discount < 1 && choice.effects && (choice.effects[focus] || 0) > 0 && c < 0) {
      c = -Math.round(-c * discount);
    }
    if (low && c < 0) forcedRest++;
    energy = Math.max(0, Math.min(100, energy + c));
    if (energy === 0) energyEmpty++;
  }
  return { attrs, forcedRest, energyEmpty };
}

function p2() {
  const N = 3000;
  const cfgs = [
    { label: "初始参数(消耗-15/-8/-2/+10, 阈值25, 无折扣)", lowThreshold: 25, tier: "old", discount: 1 },
    { label: "校准参数(消耗-12/-6/-2/+15, 阈值20, 无折扣)", lowThreshold: 20, tier: "new", discount: 1 },
    { label: "校准+人设折扣0.6(消耗-12/-6/-2/+15, 阈值20)", lowThreshold: 20, tier: "new", discount: 0.6 },
    { label: "宽松+人设折扣0.6(消耗-10/-5/-2/+18, 阈值15)", lowThreshold: 15, tier: "loose", discount: 0.6 },
    { label: "目标初值(消耗-12/-6/-2/+20, 阈值15, 折扣0.5)", lowThreshold: 15, tier: "target", discount: 0.5 },
  ];
  console.log("\n== P2 精力收支参数扫描（90天均值，3000局） ==");
  for (const cfg of cfgs) {
    const out = {};
    for (const strat of ["random", "focus"]) {
      let forced = 0, empty = 0;
      for (let i = 0; i < N; i++) {
        const r = runWithEnergy(strat, { lowThreshold: cfg.lowThreshold, tier: cfg.tier, discount: cfg.discount });
        forced += r.forcedRest; empty += r.energyEmpty;
      }
      out[strat] = { forcedAvg: +(forced / N).toFixed(1), emptyAvg: +(empty / N).toFixed(1) };
    }
    console.log(`  ${cfg.label}: 随机策略强制休息 ${out.random.forcedAvg} 天/局(见底${out.random.emptyAvg}) | 人设策略 ${out.focus.forcedAvg} 天/局(见底${out.focus.emptyAvg})`);
  }
}

/* ---------- P3 低谷保护 ---------- */
function runWithRescue(strategy) {
  let attrs = newGame();
  let last = -1;
  let rescued = 0;
  let dipEvents = 0;
  for (let d = 0; d < TOTAL_DAYS; d++) {
    const lowAttrs = ATTRS.filter((k) => attrs[k] < 30);
    if (lowAttrs.length) dipEvents++;
    let idx;
    if (lowAttrs.length) {
      const weights = EVENTS.map((ev, i) => {
        const touchesLow = ev.choices.some((c) =>
          Object.keys(c.effects || {}).some((k) => lowAttrs.includes(k) && c.effects[k] > 0)
        );
        return i === last ? 0 : touchesLow ? 2 : 1;
      });
      const tot = weights.reduce((s, w) => s + w, 0);
      let r = Math.random() * tot;
      for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r <= 0) { idx = i; break; } }
    } else {
      idx = Math.floor(Math.random() * EVENTS.length);
      while (idx === last) idx = Math.floor(Math.random() * EVENTS.length);
    }
    last = idx;
    const ev = EVENTS[idx];
    let choice;
    if (strategy === "slacker") {
      choice = ev.choices.reduce((best, c) => {
        const sv = (c.effects ? Object.values(c.effects).reduce((s, x) => s + x, 0) : 0);
        const bv = (best.effects ? Object.values(best.effects).reduce((s, x) => s + x, 0) : 0);
        return sv < bv ? c : best;
      });
    } else {
      choice = ev.choices.reduce((best, c) => {
        const v = lowAttrs.reduce((s, k) => s + ((c.effects && c.effects[k]) || 0), 0);
        const bv = lowAttrs.reduce((s, k) => s + ((best.effects && best.effects[k]) || 0), 0);
        return v > bv ? c : best;
      });
    }
    attrs = apply(attrs, choice.effects, rollFortune().mult);
    for (const k of lowAttrs) {
      if (attrs[k] >= 30) { rescued++; }
    }
  }
  return { dipEvents, rescued, attrEnd: attrs };
}

function p3() {
  const N = 3000;
  for (const strat of ["slacker", "rescue"]) {
    let dip = 0, res = 0, endedLow = 0;
    for (let i = 0; i < N; i++) {
      const r = runWithRescue(strat);
      dip += r.dipEvents; res += r.rescued;
      if (ATTRS.some((k) => r.attrEnd[k] < 30)) endedLow++;
    }
    const label = strat === "slacker" ? "摆烂对照（无保护）" : "摆烂 + 低谷保护";
    console.log(`  ${label}: 平均低谷天数 ${(dip / N).toFixed(1)} | 拉回次数均值 ${(res / N).toFixed(2)} | 结算仍有<30 属性 ${((endedLow / N) * 100).toFixed(1)}%`);
  }
}

/* ---------- P4 周目标 ---------- */
function runWithWeekly(strategy, focus = "zhili", mode = "count") {
  let attrs = newGame();
  let last = -1;
  let completed = 0;
  for (let w = 0; w < 18; w++) {
    let weekStart = { ...attrs };
    let posPicks = 0;
    for (let d = 0; d < 5; d++) {
      let idx = Math.floor(Math.random() * EVENTS.length);
      while (idx === last) idx = Math.floor(Math.random() * EVENTS.length);
      last = idx;
      const ev = EVENTS[idx];
      let choice;
      if (strategy === "random") {
        choice = ev.choices[Math.floor(Math.random() * ev.choices.length)];
      } else {
        choice = ev.choices.reduce((best, c) => {
          const v = (c.effects && c.effects[focus]) || 0;
          const bv = (best.effects && best.effects[focus]) || 0;
          return v > bv ? c : best;
        });
      }
      if ((choice.effects && (choice.effects[focus] || 0)) > 0) posPicks++;
      attrs = apply(attrs, choice.effects, rollFortune().mult);
    }
    if (mode === "count") { if (posPicks >= 3) completed++; }
    else { if (attrs[focus] - weekStart[focus] >= 4) completed++; }
  }
  return completed;
}

function p4() {
  const N = 2000;
  for (const mode of ["count", "growth"]) {
    let rand = 0, focus = 0;
    for (let i = 0; i < N; i++) { rand += runWithWeekly("random", "zhili", mode); focus += runWithWeekly("focus", "zhili", mode); }
    const label = mode === "count" ? "次数型(周选该领域正收益选项>=3)" : "净增长型(周净增长>=4)";
    console.log(`  ${label}: 随机策略 ${+(((rand / N) / 18) * 100).toFixed(0)}% | 人设策略 ${+(((focus / N) / 18) * 100).toFixed(0)}%`);
  }
}

/* ---------- 结算档位分布（V2 保持） ---------- */
function gradeDist() {
  const N = 5000;
  const g = { "完美学霸": 0, "优秀": 0, "良好": 0, "合格": 0, "仍需努力": 0 };
  for (let i = 0; i < N; i++) {
    const a = runGame("random");
    const t = ATTRS.reduce((s, k) => s + a[k], 0);
    if (t >= 450) g["完美学霸"]++;
    else if (t >= 400) g["优秀"]++;
    else if (t >= 350) g["良好"]++;
    else if (t >= 300) g["合格"]++;
    else g["仍需努力"]++;
  }
  console.log("\n== 结算档位分布（随机策略 5000 局，与现版本对比） ==");
  for (const k of Object.keys(g)) console.log(`  ${k}: ${((g[k] / N) * 100).toFixed(1)}%`);
}

statEvents();
p1();
p2();
p3();
p4();
gradeDist();
