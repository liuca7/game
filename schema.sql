-- 《我的奇葩一学期》D1 数据库初始化脚本
-- 使用方式：
--   本地开发：  npm run db:init          （写入本地 D1）
--   生产环境：  npm run db:init:remote   （写入云端 D1）

CREATE TABLE IF NOT EXISTS scores (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT    NOT NULL,
  score      INTEGER NOT NULL,
  grade      TEXT    NOT NULL DEFAULT '',
  weeks      INTEGER NOT NULL DEFAULT 18,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_scores_score
  ON scores (score DESC);
