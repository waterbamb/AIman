const BASE_URL = "/api"

/** 通用请求封装 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error((err as { error: string }).error || res.statusText)
  }
  return res.json() as Promise<T>
}

/** 适配器信息 */
export interface AdapterInfo {
  id: string
  name: string
  description: string
  accepts?: {
    fileExtensions?: string[]
    mimeTypes?: string[]
    text?: boolean
  }
}

/** 记忆条目 */
export interface Memory {
  id: string
  content: string
  summary: string
  sourceAdapter: string
  sourceLabel: string
  tags: string[]
  importance: number
  createdAt: string
  updatedAt: string
}

/** 导入结果 */
export interface IngestResult {
  total: number
  stored: number
  merged: number
  skipped: number
}

/** 统计信息 */
export interface Stats {
  totalMemories: number
  bySource: Record<string, number>
  byImportance: Record<string, number>
  avgImportance: number
  recentImports: Array<{
    id: string
    adapterId: string
    filename: string | null
    importedAt: string
    chunkCount: number
    status: string
  }>
  adapters: { inbound: number; outbound: number }
}

/** 导出输出 */
export interface ExportOutput {
  type: "text" | "file" | "clipboard"
  content: string
  filename?: string
  mimeType?: string
}

// API 方法
export const api = {
  // 健康检查
  health: () => request<{ status: string }>("/health"),

  // 适配器
  getInboundAdapters: () => request<AdapterInfo[]>("/adapters/in"),
  getOutboundAdapters: () => request<AdapterInfo[]>("/adapters/out"),

  // 导入
  importData: (adapterId: string, input: { type: string; content: string; filename?: string; metadata?: Record<string, unknown> }) =>
    request<IngestResult>("/import", {
      method: "POST",
      body: JSON.stringify({ adapterId, input }),
    }),

  // 记忆
  getMemories: (params?: { q?: string; limit?: number; tags?: string; source?: string; minImportance?: number }) => {
    const search = new URLSearchParams()
    if (params?.q) search.set("q", params.q)
    if (params?.limit) search.set("limit", String(params.limit))
    if (params?.tags) search.set("tags", params.tags)
    if (params?.source) search.set("source", params.source)
    if (params?.minImportance) search.set("minImportance", String(params.minImportance))
    const qs = search.toString()
    return request<Memory[]>(`/memories${qs ? `?${qs}` : ""}`)
  },

  createMemory: (body: { content: string; summary?: string; tags?: string[]; importance?: number }) =>
    request<{ id: string }>("/memories", { method: "POST", body: JSON.stringify(body) }),

  updateMemory: (id: string, body: Partial<{ content: string; summary: string; tags: string[]; importance: number }>) =>
    request<{ success: boolean }>(`/memories/${id}`, { method: "PUT", body: JSON.stringify(body) }),

  deleteMemory: (id: string) =>
    request<{ success: boolean }>(`/memories/${id}`, { method: "DELETE" }),

  searchMemories: (query: string, options?: { limit?: number; tags?: string[]; source?: string }) =>
    request<Memory[]>("/memories/search", {
      method: "POST",
      body: JSON.stringify({ query, ...options }),
    }),

  deduplicate: () =>
    request<{ merged: number; removed: number }>("/memories/deduplicate", { method: "POST" }),

  // 导出
  exportData: (adapterId: string, query?: string, options?: unknown) =>
    request<ExportOutput>("/export", {
      method: "POST",
      body: JSON.stringify({ adapterId, query, options }),
    }),

  // 个人档案
  getProfile: () => request<Record<string, string>>("/profile"),
  updateProfile: (key: string, value: string) =>
    request<{ success: boolean }>(`/profile/${encodeURIComponent(key)}`, {
      method: "PUT",
      body: JSON.stringify({ value }),
    }),
  deleteProfileKey: (key: string) =>
    request<{ success: boolean }>(`/profile/${encodeURIComponent(key)}`, { method: "DELETE" }),

  // 统计
  getStats: () => request<Stats>("/stats"),
}
