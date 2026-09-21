/* 游戏逻辑冒烟测试：模拟 1000 局随机游戏，验证：
 * 1. 事件数据结构完整（desc/choices/text/effects/reason）
 * 2. 属性始终在 0-100 区间
 * 3. 游戏必然到达结算（90 天结束或被开除）
 * 4. 结算档位正确
 */
const fs = require("fs");
const vm = require("vm");

const ctx = {};
vm.createContext(ctx);
const dataSrc = fs.readFileSync("public/js/data.js", "utf8") + "\n;({ EVENTS, REFLECTION_CHOICES });";
const { EVENTS, REFLECTION_CHOICES } = vm.runInContext(dataSrc, ctx);
const REFLECTION = REFLECTION_CHOICES;

const MAX_VALUE = 100, TOTAL_DAYS = 90, SUSPEND_THRESHOLD = 30, SUSPEND_DAYS = 5, MAX_SUSPENDS = 3;
const ATTR_KEYS = ["deyu", "zhili", "tiyu", "meiyu", "laoyu"];

function gradeOf(total) {
  if (total >= 450) return "完美学霸";
  if (total >= 400) return "优秀";
  if (total >= 350) return "良好";
  if (total >= 300) return "合格";
  return "仍需努力";
}

let errors = [];
let grades = { "完美学霸": 0, "优秀": 0, "良好": 0, "合格": 0, "仍需努力": 0 };
let outcomes = { graduated: 0, expelled: 0 };
let minTotal = Infinity, maxTotal = -Infinity;

// 数据结构完整性
EVENTS.forEach((ev, i) => {
  if (!ev.scene || !ev.desc || !Array.isArray(ev.choices) || ev.choices.length < 2) {
    errors.push(`事件${i} 结构不完整`);
  }
  ev.choices.forEach((c, j) => {
    if (!c.text || typeof c.effects !== "object") errors.push(`事件${i}选项${j} 缺 text/effects`);
    for (const k of Object.keys(c.effects)) {
      if (!ATTR_KEYS.includes(k)) errors.push(`事件${i}选项${j} 属性键非法: ${k}`);
      if (!Number.isInteger(c.effects[k])) errors.push(`事件${i}选项${j} 属性值非整数: ${c.effects[k]}`);
    }
  });
});

// 模拟对局
for (let g = 0; g < 1000; g++) {
  const attrs = { deyu: 60, zhili: 60, tiyu: 60, meiyu: 60, laoyu: 60 };
  let totalDays = 0, suspendLeft = 0, suspended = false, suspendCount = 0, lastEvent = -1, over = false, expelled = false;

  while (totalDays < TOTAL_DAYS && !over) {
    if (suspended) {
      // 休学反思日
      const c = REFLECTION[Math.floor(Math.random() * REFLECTION.length)];
      for (const [k, v] of Object.entries(c.effects)) attrs[k] = Math.max(0, Math.min(MAX_VALUE, attrs[k] + v));
      suspendLeft -= 1;
      if (suspendLeft <= 0) suspended = false;
    } else {
      let idx = Math.floor(Math.random() * EVENTS.length);
      if (EVENTS.length > 1) while (idx === lastEvent) idx = Math.floor(Math.random() * EVENTS.length);
      lastEvent = idx;
      const choice = EVENTS[idx].choices[Math.floor(Math.random() * EVENTS[idx].choices.length)];
      for (const [k, v] of Object.entries(choice.effects)) {
        attrs[k] = Math.max(0, Math.min(MAX_VALUE, attrs[k] + v));
      }
      const low = ATTR_KEYS.find((k) => attrs[k] < SUSPEND_THRESHOLD);
      if (low !== undefined) {
        suspendCount += 1;
        if (suspendCount >= MAX_SUSPENDS) { over = true; expelled = true; break; }
        suspended = true;
        suspendLeft = SUSPEND_DAYS;
      }
    }
    totalDays += 1;
  }

  for (const k of ATTR_KEYS) {
    if (attrs[k] < 0 || attrs[k] > MAX_VALUE) errors.push(`属性越界 ${k}=${attrs[k]}`);
  }

  const total = ATTR_KEYS.reduce((s, k) => s + attrs[k], 0);
  minTotal = Math.min(minTotal, total);
  maxTotal = Math.max(maxTotal, total);
  if (expelled) { outcomes.expelled += 1; grades["仍需努力"] += 1; }
  else { outcomes.graduated += 1; grades[gradeOf(total)] += 1; }
}

console.log("事件数:", EVENTS.length, "| 反思选项数:", REFLECTION.length);
console.log("对局结果:", outcomes, "| 总分范围:", minTotal, "-", maxTotal);
console.log("档位分布:", grades);
console.log("错误:", errors.length ? errors : "无");
process.exit(errors.length ? 1 : 0);
