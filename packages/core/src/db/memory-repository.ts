import type Database from "better-sqlite3"
import type { Memory, Profile } from "../adapters/types.js"
import { v4 as uuid } from "uuid"

/**
 * 记忆数据访问层
 */
export class MemoryRepository {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /** 插入一条记忆 */
  insert(memory: Omit<Memory, "id" | "createdAt" | "updatedAt">): string {
    const id = uuid()
    const now = new Date().toISOString()

    this.db.prepare(`
      INSERT INTO memories (id, content, summary, source_adapter, source_label, tags, importance, embedding, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      memory.content,
      memory.summary,
      memory.sourceAdapter,
      memory.sourceLabel,
      JSON.stringify(memory.tags),
      memory.importance,
      memory.embedding ? Buffer.from(new Float64Array(memory.embedding).buffer) : null,
      now,
      now,
    )

    return id
  }

  /** 根据 ID 获取记忆 */
  findById(id: string): Memory | null {
    const row = this.db.prepare("SELECT * FROM memories WHERE id = ?").get(id) as MemoryRow | undefined
    return row ? this.rowToMemory(row) : null
  }

  /** 查询记忆列表 */
  findAll(options?: {
    limit?: number
    offset?: number
    tags?: string[]
    source?: string
    minImportance?: number
    query?: string
  }): Memory[] {
    const conditions: string[] = []
    const params: unknown[] = []

    if (options?.source) {
      conditions.push("source_adapter = ?")
      params.push(options.source)
    }

    if (options?.minImportance) {
      conditions.push("importance >= ?")
      params.push(options.minImportance)
    }

    if (options?.query) {
      conditions.push("(content LIKE ? OR summary LIKE ?)")
      const q = `%${options.query}%`
      params.push(q, q)
    }

    if (options?.tags && options.tags.length > 0) {
      // 检查 tags JSON 数组中是否包含指定标签
      const tagConditions = options.tags.map(() => "tags LIKE ?")
      conditions.push(`(${tagConditions.join(" OR ")})`)
      for (const tag of options.tags) {
        params.push(`%"${tag}"%`)
      }
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : ""
    const limit = options?.limit ?? 100
    const offset = options?.offset ?? 0

    const rows = this.db.prepare(
      `SELECT * FROM memories ${where} ORDER BY importance DESC, updated_at DESC LIMIT ? OFFSET ?`
    ).all(...params, limit, offset) as MemoryRow[]

    return rows.map((r) => this.rowToMemory(r))
  }

  /** 获取所有记忆（含 embedding），用于去重 */
  findAllWithEmbeddings(): Array<Memory & { embedding: Float64Array | null }> {
    const rows = this.db.prepare("SELECT * FROM memories ORDER BY created_at ASC").all() as MemoryRow[]
    return rows.map((r) => this.rowToMemory(r))
  }

  /** 更新记忆 */
  update(id: string, fields: Partial<Pick<Memory, "content" | "summary" | "tags" | "importance">>): boolean {
    const sets: string[] = []
    const params: unknown[] = []

    if (fields.content !== undefined) {
      sets.push("content = ?")
      params.push(fields.content)
    }
    if (fields.summary !== undefined) {
      sets.push("summary = ?")
      params.push(fields.summary)
    }
    if (fields.tags !== undefined) {
      sets.push("tags = ?")
      params.push(JSON.stringify(fields.tags))
    }
    if (fields.importance !== undefined) {
      sets.push("importance = ?")
      params.push(fields.importance)
    }

    if (sets.length === 0) return false

    sets.push("updated_at = ?")
    params.push(new Date().toISOString())
    params.push(id)

    const result = this.db.prepare(
      `UPDATE memories SET ${sets.join(", ")} WHERE id = ?`
    ).run(...params)

    return result.changes > 0
  }

  /** 删除记忆 */
  delete(id: string): boolean {
    const result = this.db.prepare("DELETE FROM memories WHERE id = ?").run(id)
    return result.changes > 0
  }

  /** 批量删除 */
  deleteMany(ids: string[]): number {
    const placeholders = ids.map(() => "?").join(",")
    const result = this.db.prepare(`DELETE FROM memories WHERE id IN (${placeholders})`).run(...ids)
    return result.changes
  }

  /** 获取统计信息 */
  getStats(): {
    totalMemories: number
    bySource: Record<string, number>
    byImportance: Record<number, number>
    avgImportance: number
  } {
    const total = this.db.prepare("SELECT COUNT(*) as count FROM memories").get() as { count: number }

    const bySourceRows = this.db.prepare(
      "SELECT source_adapter, COUNT(*) as count FROM memories GROUP BY source_adapter"
    ).all() as Array<{ source_adapter: string; count: number }>

    const byImportanceRows = this.db.prepare(
      "SELECT importance, COUNT(*) as count FROM memories GROUP BY importance"
    ).all() as Array<{ importance: number; count: number }>

    const avgRow = this.db.prepare(
      "SELECT AVG(importance) as avg FROM memories"
    ).get() as { avg: number | null }

    const bySource: Record<string, number> = {}
    for (const row of bySourceRows) {
      bySource[row.source_adapter] = row.count
    }

    const byImportance: Record<number, number> = {}
    for (const row of byImportanceRows) {
      byImportance[row.importance] = row.count
    }

    return {
      totalMemories: total.count,
      bySource,
      byImportance,
      avgImportance: avgRow.avg ?? 0,
    }
  }

  /** 数据库行 → Memory 对象 */
  private rowToMemory(row: MemoryRow): Memory {
    let embedding: Float64Array | null = null
    if (row.embedding) {
      const buf = row.embedding as Buffer
      embedding = new Float64Array(buf.buffer, buf.byteOffset, buf.byteLength / 8)
    }

    return {
      id: row.id,
      content: row.content,
      summary: row.summary,
      sourceAdapter: row.source_adapter,
      sourceLabel: row.source_label,
      tags: JSON.parse(row.tags) as string[],
      importance: row.importance,
      embedding,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    }
  }
}

/** 数据库行类型 */
interface MemoryRow {
  id: string
  content: string
  summary: string
  source_adapter: string
  source_label: string
  tags: string
  importance: number
  embedding: Buffer | null
  created_at: string
  updated_at: string
}
