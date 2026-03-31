import type { InboundAdapter, RawMemoryChunk } from "@agilink/core"

/**
 * 通用 JSON 导入适配器
 * 用户可通过 metadata 配置字段映射规则
 */
const jsonGenericAdapter: InboundAdapter = {
  id: "json-generic",
  name: "通用 JSON",
  description: "通用 JSON 导入，支持用户配置字段映射规则",

  accepts: {
    fileExtensions: [".json"],
    mimeTypes: ["application/json"],
  },

  async parse(input) {
    const text = typeof input.content === "string"
      ? input.content
      : input.content.toString("utf-8")

    const data = JSON.parse(text)
    const mapping = (input.metadata?.fieldMapping ?? {}) as FieldMapping

    // 若输入是数组则逐项处理，否则作为单条处理
    const items = Array.isArray(data) ? data : [data]
    const chunks: RawMemoryChunk[] = []

    for (const item of items) {
      const content = getField(item, mapping.content ?? "content")
      if (!content) continue

      chunks.push({
        content: String(content),
        hint: "请从这段 JSON 数据中提炼出有价值的记忆条目",
        sourceLabel: input.filename ?? "JSON 导入",
        timestamp: mapping.timestamp
          ? new Date(getField(item, mapping.timestamp) as string)
          : undefined,
        tags: mapping.tags
          ? (getField(item, mapping.tags) as string[] | undefined)
          : undefined,
      })
    }

    return chunks
  },
}

/** 字段映射配置 */
interface FieldMapping {
  content?: string
  timestamp?: string
  tags?: string
}

/** 根据点分路径获取嵌套字段值 */
function getField(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>(
    (acc, key) => (acc as Record<string, unknown>)?.[key],
    obj,
  )
}

export default jsonGenericAdapter
