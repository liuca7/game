/**
 * 《我的奇葩一学期》- Cloudflare Workers 后端
 *
 * 职责：
 *  - 提供排行榜 API（GET/POST /api/scores），数据持久化到 D1
 *  - 其余请求交由 Workers Assets 返回前端静态资源
 *
 * 技术栈：Cloudflare Workers + D1（full-stack）
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/** 返回 JSON 响应 */
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...CORS_HEADERS },
  });
}

/** 校验并规整提交的分数记录 */
function sanitizeScore(body) {
  const name = String(body.name ?? "")
    .trim()
    .replace(/[\r\n<>]/g, "")
    .slice(0, 16);
  const score = Math.round(Number(body.score));
  const grade = String(body.grade ?? "").slice(0, 40);
  const weeks = Math.min(99, Math.max(1, Math.round(Number(body.weeks) || 18)));

  if (!name || !Number.isFinite(score)) return null;
  return {
    name,
    score: Math.max(0, Math.min(9999, score)),
    grade,
    weeks,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 预检
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    // 健康检查（部署后可用于确认 Worker 在线）
    if (path === "/api/health") {
      return json({ ok: true, service: "my-weird-semester" });
    }

    // 排行榜：获取前 10
    if (path === "/api/scores" && request.method === "GET") {
      try {
        const { results } = await env.DB.prepare(
          `SELECT name, score, grade, weeks, created_at
             FROM scores
            ORDER BY score DESC, created_at ASC
            LIMIT 10`
        ).all();
        return json({ scores: results });
      } catch (err) {
        console.error("GET /api/scores failed:", err);
        return json({ error: "database_unavailable" }, 500);
      }
    }

    // 排行榜：提交新成绩
    if (path === "/api/scores" && request.method === "POST") {
      try {
        const body = await request.json();
        const record = sanitizeScore(body);
        if (!record) return json({ error: "invalid_input" }, 400);

        await env.DB.prepare(
          `INSERT INTO scores (name, score, grade, weeks)
           VALUES (?, ?, ?, ?)`
        )
          .bind(record.name, record.score, record.grade, record.weeks)
          .run();

        const { results } = await env.DB.prepare(
          `SELECT name, score, grade, weeks, created_at
             FROM scores
            ORDER BY score DESC, created_at ASC
            LIMIT 10`
        ).all();
        return json({ ok: true, scores: results }, 201);
      } catch (err) {
        console.error("POST /api/scores failed:", err);
        return json({ error: "bad_request" }, 400);
      }
    }

    // 其余请求：交给 Workers Assets 静态资源
    return env.ASSETS.fetch(request);
  },
};
