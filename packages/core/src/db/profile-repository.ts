import type Database from "better-sqlite3"
import type { Profile } from "../adapters/types.js"

/**
 * 个人档案数据访问层
 */
export class ProfileRepository {
  private db: Database.Database

  constructor(db: Database.Database) {
    this.db = db
  }

  /** 获取所有档案 */
  getAll(): Profile {
    const rows = this.db.prepare("SELECT key, value FROM profiles").all() as Array<{ key: string; value: string }>
    const profile: Profile = {}
    for (const row of rows) {
      profile[row.key] = row.value
    }
    return profile
  }

  /** 获取单个键 */
  get(key: string): string | null {
    const row = this.db.prepare("SELECT value FROM profiles WHERE key = ?").get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  /** 设置键值 */
  set(key: string, value: string, sourceAdapter: string = ""): void {
    this.db.prepare(
      "INSERT OR REPLACE INTO profiles (key, value, source_adapter) VALUES (?, ?, ?)"
    ).run(key, value, sourceAdapter)
  }

  /** 删除键 */
  delete(key: string): boolean {
    const result = this.db.prepare("DELETE FROM profiles WHERE key = ?").run(key)
    return result.changes > 0
  }
}
