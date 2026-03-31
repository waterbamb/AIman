/**
 * SQLite 数据库建表语句
 */
export const SCHEMA_SQL = `
  -- 记忆表
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    summary TEXT NOT NULL DEFAULT '',
    source_adapter TEXT NOT NULL,
    source_label TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    importance INTEGER NOT NULL DEFAULT 3,
    embedding BLOB,
    created_at DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at DATETIME NOT NULL DEFAULT (datetime('now'))
  );

  -- 个人档案表
  CREATE TABLE IF NOT EXISTS profiles (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    source_adapter TEXT NOT NULL DEFAULT ''
  );

  -- 导入日志表
  CREATE TABLE IF NOT EXISTS import_logs (
    id TEXT PRIMARY KEY,
    adapter_id TEXT NOT NULL,
    filename TEXT,
    imported_at DATETIME NOT NULL DEFAULT (datetime('now')),
    chunk_count INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'success'
  );

  -- 索引
  CREATE INDEX IF NOT EXISTS idx_memories_source ON memories(source_adapter);
  CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance);
  CREATE INDEX IF NOT EXISTS idx_memories_created ON memories(created_at);
  CREATE INDEX IF NOT EXISTS idx_import_logs_adapter ON import_logs(adapter_id);
`
