import type { Memory, Profile, RawMemoryChunk, AdapterMeta } from "../adapters/types.js"

/**
 * 导入结果统计
 */
export interface IngestResult {
  total: number
  /** 新增存储 */
  stored: number
  /** 与已有记忆合并 */
  merged: number
  /** 重复跳过 */
  skipped: number
}

/**
 * 语义搜索选项
 */
export interface SearchOptions {
  limit?: number
  tags?: string[]
  source?: string
  minImportance?: number
}

/**
 * 记忆引擎核心接口
 */
export interface MemoryEngine {
  /** 接收原始片段 → 提炼 → 去重 → 存储 */
  ingest(chunks: RawMemoryChunk[], meta: AdapterMeta): Promise<IngestResult>

  /** 语义检索 */
  search(query: string, options?: SearchOptions): Promise<Memory[]>

  /** 构建上下文（供导出适配器调用） */
  buildContext(query: string): Promise<{ memories: Memory[]; profile: Profile }>

  /** 去重整理 */
  deduplicate(): Promise<{ merged: number; removed: number }>
}
