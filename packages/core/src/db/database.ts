import Database from "better-sqlite3"
import { existsSync, mkdirSync } from "node:fs"
import { dirname, join } from "node:path"
import { SCHEMA_SQL } from "./schema.js"

/**
 * 数据库管理器
 * 负责 SQLite 数据库的初始化、连接管理
 */
export class DatabaseManager {
  private db: Database.Database

  constructor(dataDir: string) {
    // 确保数据目录存在
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }

    const dbPath = join(dataDir, "agilink.db")
    this.db = new Database(dbPath)

    // 启用 WAL 模式，提升并发读写性能
    this.db.pragma("journal_mode = WAL")
    this.db.pragma("foreign_keys = ON")

    // 初始化 schema
    this.db.exec(SCHEMA_SQL)
  }

  /** 获取底层数据库实例 */
  getDb(): Database.Database {
    return this.db
  }

  /** 关闭数据库连接 */
  close(): void {
    this.db.close()
  }
}
