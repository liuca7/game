/* ============================================================
 * 《我的奇葩一学期》网页版 · 游戏主逻辑
 * 改进点：
 *  1. 今日运势系统（大吉/吉/平/凶/大凶，影响当日属性变化幅度）
 *  2. 休学反思机制（休学期间可选一项自我提升，兑现原版隐藏彩蛋）
 *  3. 32 个随机事件，事件不连续重复
 *  4. 自动存档（localStorage）+ 云端排行榜（D1）
 *  5. 修复原版结算档位重复 bug，新增「合格」档
 * ============================================================ */

/* ---------- 常量 ---------- */
const SAVE_KEY = "weirdSemester.save.v2";
const ATTRIBUTES = {
  deyu:  { label: "德育", icon: "💖", color: "#ef4444", gradient: "linear-gradient(90deg,#f87171,#ef4444)" },
  zhili: { label: "智力", icon: "🧠", color: "#3b82f6", gradient: "linear-gradient(90deg,#60a5fa,#3b82f6)" },
  tiyu:  { label: "体育", icon: "💪", color: "#22c55e", gradient: "linear-gradient(90deg,#4ade80,#22c55e)" },
  meiyu: { label: "美育", icon: "🎨", color: "#a855f7", gradient: "linear-gradient(90deg,#c084fc,#a855f7)" },
  laoyu: { label: "劳育", icon: "🧹", color: "#f59e0b", gradient: "linear-gradient(90deg,#fbbf24,#f59e0b)" },
};
const INITIAL_VALUE = 60;
const MAX_VALUE = 100;
const WEEKS = 18;
const DAYS_PER_WEEK = 5;
const TOTAL_DAYS = WEEKS * DAYS_PER_WEEK;
const SUSPEND_THRESHOLD = 30;
const SUSPEND_DAYS = 5;
const MAX_SUSPENDS = 3;
const WEEKDAY_NAMES = ["星期一", "星期二", "星期三", "星期四", "星期五"];
const FORTUNES = [
  { key: "daji",    label: "大吉", emoji: "🌟", mult: 1.35, weight: 8 },
  { key: "ji",      label: "吉",   emoji: "👍", mult: 1.15, weight: 22 },
  { key: "ping",    label: "平",   emoji: "😐", mult: 1.0,  weight: 40 },
  { key: "xiong",   label: "凶",   emoji: "😟", mult: 0.85, weight: 22 },
  { key: "daxiong", label: "大凶", emoji: "💢", mult: 0.7,  weight: 8 },
];

/* ---------- 游戏状态 ---------- */
let state = null;
let autoTimer = null;

function freshState(name) {
  return {
    name: name.trim() || "神秘小学生",
    week: 1,
    weekday: 1,
    totalDays: 0,
    attributes: { deyu: INITIAL_VALUE, zhili: INITIAL_VALUE, tiyu: INITIAL_VALUE, meiyu: INITIAL_VALUE, laoyu: INITIAL_VALUE },
    suspended: false,
    suspendLeft: 0,
    suspendCount: 0,
    fortune: FORTUNES[2], // 平
    log: [],
    stats: { events: 0 },
    lastEvent: -1,
    over: false,
    expelled: false,
    final: null,
  };
}

function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    /* 隐私模式等场景下忽略 */
  }
}

function loadSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function clearSave() {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    /* ignore */
  }
}

/* ---------- 工具函数 ---------- */
function $(id) { return document.getElementById(id); }

function rollFortune() {
  const totalWeight = FORTUNES.reduce((s, f) => s + f.weight, 0);
  let r = Math.random() * totalWeight;
  for (const f of FORTUNES) {
    r -= f.weight;
    if (r <= 0) return f;
  }
  return FORTUNES[2];
}

function applyEffects(effects) {
  const changes = [];
  for (const [key, raw] of Object.entries(effects)) {
    if (!(key in state.attributes)) continue;
    const delta = Math.round(raw * state.fortune.mult);
    const before = state.attributes[key];
    state.attributes[key] = Math.max(0, Math.min(MAX_VALUE, before + delta));
    const actual = state.attributes[key] - before;
    if (actual !== 0) changes.push({ key, delta: actual });
  }
  return changes;
}

function gradeOf(total) {
  if (total >= 450) return { stars: 5, label: "完美学霸", comment: "德智体美劳全面开花，你就是传说中的“别人家的孩子”！毕业证直接保送！🏆" };
  if (total >= 400) return { stars: 4, label: "优秀", comment: "各科均衡发展，前途无量！继续保持，向学霸发起冲锋！🚀" };
  if (total >= 350) return { stars: 3, label: "良好", comment: "稳扎稳打，基础扎实！再努力一把，就能更上一层楼！📈" };
  if (total >= 300) return { stars: 2, label: "合格", comment: "顺利通关，但还有不少成长空间。革命尚未成功，同志仍需努力！💪" };
  return { stars: 1, label: "仍需努力", comment: "这个学期有点波折，但别灰心！总结教训，下学期卷土重来！🌱" };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

/* ---------- 渲染 ---------- */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach((s) => s.classList.remove("active"));
  $(id).classList.add("active");
  window.scrollTo({ top: 0 });
}

function renderAttrBars(containerId) {
  const el = $(containerId);
  el.innerHTML = Object.entries(ATTRIBUTES).map(([key, a]) => {
    const v = state.attributes[key];
    const pct = Math.max(0, Math.min(100, (v / MAX_VALUE) * 100));
    const danger = v < SUSPEND_THRESHOLD ? " attr-danger" : "";
    return `
      <div class="attr-card${danger}" data-key="${key}">
        <div class="attr-head">
          <span class="attr-icon">${a.icon}</span>
          <span class="attr-name">${a.label}</span>
          <span class="attr-value">${v}</span>
        </div>
        <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${a.gradient}"></div></div>
      </div>`;
  }).join("");
}

function updateBar(key, value) {
  const card = document.querySelector(`.attr-card[data-key="${key}"]`);
  if (!card) return;
  const a = ATTRIBUTES[key];
  const pct = Math.max(0, Math.min(100, (value / MAX_VALUE) * 100));
  card.querySelector(".attr-value").textContent = value;
  card.querySelector(".bar-fill").style.width = pct + "%";
  card.classList.toggle("attr-danger", value < SUSPEND_THRESHOLD);
}

function renderHeader() {
  $("h-week").textContent = `第 ${state.week} 周 · ${WEEKDAY_NAMES[state.weekday - 1]} · 第 ${state.totalDays + 1} / ${TOTAL_DAYS} 天`;
  const f = state.fortune;
  $("h-fortune").textContent = `今日运势：${f.emoji} ${f.label}`;
  $("h-fortune").className = "fortune fortune-" + f.key;
  $("h-suspend").textContent = state.suspendCount > 0 ? `⚠️ 已休学 ${state.suspendCount} 次` : "";
}

function renderEventCard(html, withChoices = true) {
  $("event-card").innerHTML = html;
  if (!withChoices) $("event-card").querySelector(".event-inner")?.classList.add("no-choices");
}

function eventCardTemplate(scene, title, desc) {
  return `
    <div class="event-inner">
      <div class="event-scene">${scene}</div>
      ${title ? `<div class="event-title">${title}</div>` : ""}
      <div class="event-desc">${desc}</div>
      <div class="event-choices"></div>
      <div class="event-result hidden"></div>
    </div>`;
}

function bindChoices(choices) {
  const box = document.querySelector(".event-choices");
  box.innerHTML = choices
    .map((c, i) => `<button class="choice-btn" data-i="${i}"><span class="choice-letter">${String.fromCharCode(65 + i)}</span><span class="choice-text">${escapeHtml(c.text)}</span></button>`)
    .join("");
  const handlers = [];
  box.querySelectorAll(".choice-btn").forEach((btn) => {
    const fn = () => choose(Number(btn.dataset.i), choices);
    btn.addEventListener("click", fn);
    handlers.push(fn);
  });
  return handlers;
}

function bindSingleButton(text, fn) {
  const box = document.querySelector(".event-choices");
  box.innerHTML = "";
  const btn = document.createElement("button");
  btn.className = "choice-btn choice-single";
  btn.innerHTML = `<span class="choice-text">${text}</span>`;
  btn.addEventListener("click", fn);
  box.appendChild(btn);
}

/* ---------- 日志 ---------- */
function addLog(icon, text) {
  state.log.unshift({ icon, text, week: state.week, weekday: state.weekday });
  if (state.log.length > 80) state.log.length = 80;
  renderLog();
}

function renderLog() {
  const el = $("log-list");
  el.innerHTML = state.log
    .map((l) => `<div class="log-item"><span class="log-day">${l.week}周·${WEEKDAY_NAMES[l.weekday - 1]}</span><span class="log-icon">${l.icon}</span><span class="log-text">${escapeHtml(l.text)}</span></div>`)
    .join("");
}

/* ---------- 主流程 ---------- */
function nextDay() {
  clearTimeout(autoTimer);
  if (state.totalDays >= TOTAL_DAYS || state.over) return settle();

  state.fortune = rollFortune();
  renderHeader();

  if (state.suspended) {
    // 休学反思日：选择一个自我提升项目
    renderEventCard(eventCardTemplate("⏳", "休学反思中……", "休学不是浪费，而是查漏补缺的好机会！选择一项来提升自己吧："));
    bindChoices(REFLECTION_CHOICES);
    return;
  }

  // 正常上课日：随机事件（避免与上一事件重复）
  let idx = Math.floor(Math.random() * EVENTS.length);
  if (EVENTS.length > 1) {
    while (idx === state.lastEvent) idx = Math.floor(Math.random() * EVENTS.length);
  }
  state.lastEvent = idx;
  const ev = EVENTS[idx];
  renderEventCard(eventCardTemplate(ev.scene, "今日奇遇", ev.desc));
  bindChoices(ev.choices);
}

function choose(i, choices) {
  const choice = choices[i];
  if (!choice || autoTimer) return;

  // 应用属性变化
  const changes = applyEffects(choice.effects);
  changes.forEach((c) => updateBar(c.key, state.attributes[c.key]));
  state.stats.events += 1;
  addLog(choice.effects && Object.keys(choice.effects).length ? (Object.values(choice.effects).every(v => v >= 0) ? "😊" : "😅") : "😐", choice.text + "（" + (choice.reason || "因果循环，报应不爽") + "）");

  // 渲染结果面板
  const box = document.querySelector(".event-choices");
  const result = document.querySelector(".event-result");
  box.classList.add("fade-out");
  setTimeout(() => box.classList.add("hidden"), 250);
  result.classList.remove("hidden");
  result.innerHTML = `
    <div class="result-chips">
      ${changes.length ? changes.map((c) => `<span class="chip ${c.delta > 0 ? "chip-up" : "chip-down"}">${ATTRIBUTES[c.key].icon} ${c.delta > 0 ? "+" : ""}${c.delta} ${ATTRIBUTES[c.key].label}</span>`).join("") : `<span class="chip chip-flat">😐 今天没什么变化</span>`}
      <span class="chip chip-luck">${state.fortune.emoji} ${state.fortune.label}</span>
    </div>
    <p class="result-reason">${escapeHtml(choice.reason || "")}</p>
    <p class="result-hint">即将进入下一天…</p>`;

  // 存档
  saveGame();

  // 休学反思日：消耗一天休学时间（反思只增不减，无需再查休学）
  if (state.suspended) {
    state.suspendLeft -= 1;
    if (state.suspendLeft <= 0) {
      state.suspended = false;
      addLog("🎒", "休学结束！重返校园，继续学期冒险！");
    }
    autoTimer = setTimeout(() => {
      autoTimer = null;
      advanceDay();
    }, 1600);
    return;
  }

  // 检查休学
  if (checkSuspension()) return;

  autoTimer = setTimeout(() => {
    autoTimer = null;
    advanceDay();
  }, 1900);
}

function advanceDay() {
  state.totalDays += 1;
  state.weekday += 1;
  if (state.weekday > DAYS_PER_WEEK) {
    state.weekday = 1;
    state.week += 1;
  }
  nextDay();
}

function checkSuspension() {
  const low = Object.entries(state.attributes).find(([, v]) => v < SUSPEND_THRESHOLD);
  if (!low) return false;

  state.suspendCount += 1;
  state.suspended = true;
  state.suspendLeft = SUSPEND_DAYS;
  const [key, val] = low;
  const a = ATTRIBUTES[key];
  addLog("🚨", `${a.label} 亮起红灯（${val}点），被叫家长 + 勒令休学一周！`);

  if (state.suspendCount >= MAX_SUSPENDS) {
    // 三次休学 → 开除
    state.over = true;
    state.expelled = true;
    saveGame();
    renderEventCard(`
      <div class="event-inner event-bad">
        <div class="event-scene">💥</div>
        <div class="event-title">累计休学已达三次！</div>
        <div class="event-desc">恭喜达成【光荣开除】成就……老师、同学、校长都来送你。你的学期冒险提前结束了。</div>
        <div class="event-choices"></div>
        <div class="event-result"></div>
      </div>`);
    bindSingleButton("查看学期结算 →", () => settle());
    renderHeader();
    return true;
  }

  saveGame();
  renderEventCard(`
    <div class="event-inner event-bad">
      <div class="event-scene">🚨</div>
      <div class="event-title">红色警报！</div>
      <div class="event-desc">你的【${a.label}】属性亮起红灯（${val} 点）！<br>紧急通知：已被【叫家长 + 勒令休学】一周！<br><small>（累计休学 ${state.suspendCount} 次）</small></div>
      <div class="event-choices"></div>
      <div class="event-result"></div>
    </div>`);
  renderHeader();
  bindSingleButton("接受处分，开始休学反思 →", () => {
    advanceDay();
  });
  return true;
}

/* ---------- 结算 ---------- */
function settle() {
  const total = Object.values(state.attributes).reduce((s, v) => s + v, 0);
  const grade = gradeOf(total);
  state.final = { total, grade };
  state.over = true;
  saveGame();
  renderEndScreen(grade, total);
  submitScore(grade, total);
}

function renderEndScreen(grade, total) {
  showScreen("screen-end");
  $("end-title").textContent = state.expelled ? "😵 学期提前结束 · 被开除了" : "🎓 学期圆满落幕";
  $("end-title").classList.toggle("title-bad", !!state.expelled);

  $("end-stars").innerHTML = state.expelled
    ? `<div class="end-badge end-badge-bad">💥 光荣开除</div>`
    : `<div class="end-badge">${"⭐".repeat(grade.stars)}</div>`;

  $("end-bars").innerHTML = Object.entries(ATTRIBUTES).map(([key, a]) => {
    const v = state.attributes[key];
    const pct = Math.max(0, Math.min(100, (v / MAX_VALUE) * 100));
    return `
      <div class="end-bar-row">
        <span class="attr-icon">${a.icon}</span>
        <span class="attr-name">${a.label}</span>
        <div class="bar"><div class="bar-fill" style="width:${pct}%;background:${a.gradient}"></div></div>
        <span class="attr-value">${v}</span>
      </div>`;
  }).join("");

  $("end-comment").innerHTML = `
    <div class="end-total">学期总评：<b>${total}</b> 点 <span class="end-grade">${state.expelled ? "" : grade.label}</span></div>
    <p class="end-comment-text">${grade.comment}</p>`;

  $("end-stats").innerHTML = `
    <div class="stat-item"><span>📅</span><b>${state.totalDays}</b> 天在校</div>
    <div class="stat-item"><span>🎲</span><b>${state.stats.events}</b> 次事件</div>
    <div class="stat-item"><span>⚠️</span><b>${state.suspendCount}</b> 次休学</div>
    <div class="stat-item"><span>👤</span><b>${escapeHtml(state.name)}</b></div>`;

  $("end-leaderboard").innerHTML = `<div class="lb-box"><div class="lb-title">🏆 全校排行榜</div><div class="lb-loading">加载中…</div></div>`;
  loadLeaderboard("end-leaderboard");

  if (!state.expelled) launchConfetti();
}

async function submitScore(grade, total) {
  try {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: state.name,
        score: total,
        grade: state.expelled ? "被开除" : grade.label,
        weeks: WEEKS,
      }),
    });
    if (!res.ok) return;
    const data = await res.json();
    renderLeaderboardTable("end-leaderboard", data.scores, "保存成功！");
  } catch (e) {
    /* 排行榜服务不可用（未部署时）静默处理 */
  }
}

async function loadLeaderboard(containerId) {
  try {
    const res = await fetch("/api/scores");
    if (!res.ok) throw new Error("bad status");
    const data = await res.json();
    renderLeaderboardTable(containerId, data.scores || []);
  } catch (e) {
    const el = $(containerId).querySelector(".lb-box");
    if (el) el.innerHTML = `<div class="lb-title">🏆 全校排行榜</div><p class="lb-empty">排行榜需部署到 Cloudflare Workers 后可用<br>（本地打开页面时暂不显示）</p>`;
  }
}

function renderLeaderboardTable(containerId, scores, tip) {
  const el = $(containerId).querySelector(".lb-box");
  if (!el) return;
  if (!scores || !scores.length) {
    el.innerHTML = `<div class="lb-title">🏆 全校排行榜</div><p class="lb-empty">${tip || "还没有人上榜，快来抢占第一名！"}</p>`;
    return;
  }
  const rows = scores
    .map((s, i) => `
      <tr>
        <td class="lb-rank">${i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : i + 1}</td>
        <td class="lb-name">${escapeHtml(s.name)}</td>
        <td class="lb-score">${s.score}</td>
        <td class="lb-grade">${escapeHtml(s.grade)}</td>
      </tr>`)
    .join("");
  el.innerHTML = `
    <div class="lb-title">🏆 全校排行榜</div>
    ${tip ? `<p class="lb-tip">${tip}</p>` : ""}
    <table class="lb-table"><thead><tr><th></th><th>同学</th><th>总分</th><th>称号</th></tr></thead><tbody>${rows}</tbody></table>`;
}

/* ---------- 彩带 ---------- */
function launchConfetti() {
  const layer = $("confetti-layer");
  layer.innerHTML = "";
  const colors = ["#f87171", "#60a5fa", "#4ade80", "#c084fc", "#fbbf24", "#f472b6"];
  for (let i = 0; i < 90; i++) {
    const d = document.createElement("div");
    d.className = "confetti";
    d.style.left = Math.random() * 100 + "vw";
    d.style.background = colors[i % colors.length];
    d.style.animationDelay = Math.random() * 2 + "s";
    d.style.animationDuration = 2.6 + Math.random() * 2 + "s";
    d.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.6 + Math.random()})`;
    layer.appendChild(d);
  }
  setTimeout(() => (layer.innerHTML = ""), 6000);
}

/* ---------- 开始界面 ---------- */
function renderStart() {
  const save = loadSave();
  $("btn-continue").classList.toggle("hidden", !save);
  $("btn-clear-save").classList.toggle("hidden", !save);
  $("start-leaderboard").innerHTML = `<div class="lb-box"><div class="lb-title">🏆 全校排行榜</div><div class="lb-loading">加载中…</div></div>`;
  loadLeaderboard("start-leaderboard");
}

function startNewGame() {
  clearSave();
  const nameInput = $("name-input");
  state = freshState(nameInput.value);
  saveGame();
  enterGame();
}

function continueGame() {
  const save = loadSave();
  if (!save) return;
  state = save;
  if (state.over) {
    // 已结束的存档：直接展示结算
    const grade = gradeOf(state.final ? state.final.total : Object.values(state.attributes).reduce((s, v) => s + v, 0));
    const total = state.final ? state.final.total : Object.values(state.attributes).reduce((s, v) => s + v, 0);
    state.final = state.final || { total, grade };
    renderEndScreen(grade, total);
    return;
  }
  enterGame();
}

function enterGame() {
  showScreen("screen-game");
  renderAttrBars("attr-bars");
  renderLog();
  renderHeader();
  nextDay();
}

function init() {
  $("btn-new").addEventListener("click", startNewGame);
  $("btn-continue").addEventListener("click", continueGame);
  $("btn-clear-save").addEventListener("click", () => {
    clearSave();
    renderStart();
  });
  $("btn-again").addEventListener("click", () => {
    clearSave();
    location.reload();
  });
  $("name-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") startNewGame();
  });

  // 键盘选择 A/B/C/D/E
  document.addEventListener("keydown", (e) => {
    if (!$("screen-game").classList.contains("active")) return;
    const key = e.key.toUpperCase();
    const idx = key.charCodeAt(0) - 65;
    if (idx >= 0 && idx < 5) {
      const btn = document.querySelector(".choice-btn[data-i='" + idx + "']");
      if (btn && !btn.disabled) btn.click();
    }
  });

  renderStart();
}

document.addEventListener("DOMContentLoaded", init);
