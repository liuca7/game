/* ============================================================
 * 真实代码端到端测试（jsdom）
 * 直接加载 public/index.html + data.js + game.js，
 * 驱动完整 90 天游戏流程，验证：
 *  1. 开始游戏 → 事件卡片出现
 *  2. 连续多次选择均生效（防止 autoTimer 卡死回归）
 *  3. 完整 90 天必然到达结算界面（含休学/开除路径）
 * 运行：node test/game.e2e.cjs
 * ============================================================ */
const { JSDOM } = require("jsdom");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
let html = fs.readFileSync(path.join(root, "public/index.html"), "utf8");
// 移除外链 script（jsdom 无法从本地路径加载），改为手动注入内联脚本
html = html.replace(/<script[^>]*><\/script>/g, "");

const dom = new JSDOM(html, {
  url: "http://localhost/",
  runScripts: "dangerously",
  pretendToBeVisual: true,
});
const win = dom.window;
const doc = win.document;

// 网络与动画降级
win.fetch = async () => ({ ok: false });
win.scrollTo = () => {};
// 将游戏内所有定时器缩短为 ≤5ms 真实延迟，保持异步语义（autoTimer 守卫依赖真实回调时序）
const realSetTimeout = global.setTimeout;
win.setTimeout = (fn, ms) => realSetTimeout(() => fn(), Math.min(ms, 5));
win.clearTimeout = () => {};
const sleep = (ms) => new Promise((r) => realSetTimeout(r, ms));

// 以真实 <script> 语义加载代码（顶层 const 形成全局词法绑定）
function loadScript(file) {
  const s = doc.createElement("script");
  s.textContent = fs.readFileSync(path.join(root, file), "utf8");
  doc.body.appendChild(s);
}
loadScript("public/js/data.js");
loadScript("public/js/game.js");

let failures = [];
function assert(cond, msg) {
  if (cond) console.log("  ✓ " + msg);
  else { failures.push(msg); console.log("  ✗ " + msg); }
}

// 等待 DOMContentLoaded 触发 init
const ready = new Promise((resolve) => {
  if (doc.readyState === "complete" || doc.readyState === "interactive") {
    win.addEventListener("load", () => resolve(), { once: true });
    setTimeout(resolve, 20);
  } else {
    win.addEventListener("DOMContentLoaded", () => resolve(), { once: true });
  }
});
ready.then(async () => {
  // 1. 开始新游戏
  doc.getElementById("name-input").value = "端到端测试员";
  doc.getElementById("btn-new").click();
  await sleep(20);
  assert(doc.getElementById("screen-game").classList.contains("active"), "点击开始后进入游戏界面");

  // 2. 连续 3 次选择均生效（freeze 回归检测）
  for (let i = 0; i < 3; i++) {
    const btns = doc.querySelectorAll(".choice-btn");
    if (!btns.length) { failures.push("第 " + i + " 次点击时无选项按钮"); break; }
    btns[Math.floor(Math.random() * btns.length)].click();
    await sleep(20);
    const after = doc.querySelectorAll(".choice-btn").length;
    assert(after > 0, "第 " + (i + 1) + " 次选择后出现下一天选项（无卡死）");
  }

  // 3. 一路点击到结算
  let guard = 0;
  const maxClicks = 250;
  while (doc.getElementById("screen-end").classList.contains("active") === false && guard < maxClicks) {
    const btns = doc.querySelectorAll(".choice-btn");
    if (!btns.length) { failures.push("第 " + guard + " 次点击：无选项按钮但未结算"); break; }
    btns[Math.floor(Math.random() * btns.length)].click();
    await sleep(20);
    guard++;
  }
  assert(doc.getElementById("screen-end").classList.contains("active"), "游戏在 " + guard + " 次选择内到达结算界面");

  // 4. 结算内容完整
  assert(doc.getElementById("end-bars").textContent.includes("德育") && doc.getElementById("end-bars").textContent.includes("劳育"), "结算界面显示五育终值");
  assert(doc.getElementById("end-stats").textContent.includes("天在校"), "结算界面显示统计信息");
  assert(!!doc.getElementById("btn-again"), "结算界面有再来一学期按钮");

  console.log("\n结果：" + (failures.length ? failures.length + " 项失败" : "全部通过"));
  process.exit(failures.length ? 1 : 0);
});
