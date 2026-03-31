/**
 * 适配器输入类型
 */
export interface AdapterInput {
  type: "file" | "text" | "url"
  content: Buffer | string
  filename?: string
  metadata?: Record<string, unknown>
}

/**
 * 原始记忆片段 —— 由导入适配器解析产出
 */
export interface RawMemoryChunk {
  content: string
  /** 给 LLM 的提炼提示 */
  hint?: string
  timestamp?: Date
  /** 人类可读的来源标签，如 "ChatGPT / 2024-03" */
  sourceLabel?: string
  tags?: string[]
}

/**
 * 记忆条目 —— 存储在数据库中的标准化记忆
 */
export interface Memory {
  id: string
  content: string
  summary: string
  sourceAdapter: string
  sourceLabel: string
  tags: string[]
  /** 重要性评分 1-5 */
  importance: number
  embedding: Float64Array | null
  createdAt: Date
  updatedAt: Date
}

/**
 * 个人档案键值对
 */
export interface Profile {
  [key: string]: string
}

/**
 * 适配器元信息，在导入时传递
 */
export interface AdapterMeta {
  adapterId: string
  filename?: string
}

/**
 * 导入适配器 —— 将外部数据解析为标准记忆片段
 */
export interface InboundAdapter {
  id: string
  name: string
  description: string

  accepts: {
    fileExtensions?: string[]
    mimeTypes?: string[]
    /** 是否支持纯文本粘贴 */
    text?: boolean
  }

  /** 将任意原始输入解析为标准记忆片段列表 */
  parse(input: AdapterInput): Promise<RawMemoryChunk[]>
}

/**
 * 导出适配器输出
 */
export interface AdapterOutput {
  type: "text" | "file" | "clipboard"
  content: string
  filename?: string
  mimeType?: string
}

/**
 * 导出适配器 —— 将记忆渲染为目标格式
 */
export interface OutboundAdapter {
  id: string
  name: string
  description: string

  /** 将记忆列表 + 个人档案渲染为目标格式 */
  render(
    memories: Memory[],
    profile: Profile,
    options?: unknown,
  ): Promise<AdapterOutput>
}
