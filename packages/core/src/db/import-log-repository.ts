import type Database from "better-sqlite3"
import { v4 as uuid } from "uuid"

/**
 * 导入日志记录
 */
export interface ImportLog {
  id: string
  adapterId: string
  filename: string | null
  importedAt: Date
  chunkCount: number
  status: "success" | "partial" | "failed"
}

/**
 * 导入日志数据访问层
 */
export class ImportLogRepository {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /** 记录一次导入 */
  create(log: Omit<ImportLog, "id" | "importedAt">): string {
    const id = uuid()
    this.db.prepare(
      "INSERT INTO import_logs (id, adapter_id, filename, chunk_count, status) VALUES (?, ?, ?, ?, ?)"
    ).run(id, log.adapterId, log.filename, log.chunkCount, log.status)
    return id
  }

  /** 获取最近的导入日志 */
  getRecent(limit: number = 20): ImportLog[] {
    const rows = this.db.prepare(
      "SELECT * FROM import_logs ORDER BY imported_at DESC LIMIT ?"
    ).all(limit) as ImportLogRow[]

    return rows.map((r) => ({
      id: r.id,
      adapterId: r.adapter_id,
      filename: r.filename,
      importedAt: new Date(r.imported_at),
      chunkCount: r.chunk_count,
      status: r.status as ImportLog["status"],
    }))
  }
}

interface ImportLogRow {
  id: string
  adapter_id: string
  filename: string | null
  imported_at: string
  chunk_count: number
  status: string
}
