import type { InboundAdapter, RawMemoryChunk } from "@agilink/core"

/**
 * Claude 对话导出 JSON 导入适配器
 */
const claudeJsonAdapter: InboundAdapter = {
  id: "claude-json",
  name: "Claude 对话导出",
  description: "解析 Claude 导出格式",

  accepts: {
    fileExtensions: [".json"],
    mimeTypes: ["application/json"],
  },

  async parse(input) {
    const text = typeof input.content === "string"
      ? input.content
      : input.content.toString("utf-8")

    const data = JSON.parse(text) as ClaudeExport[]
    const chunks: RawMemoryChunk[] = []

    for (const conversation of data) {
      const messages = conversation.chat_messages ?? []
      if (messages.length === 0) continue

      const content = messages
        .map((m) => `[${m.sender}]: ${m.text}`)
        .filter((line) => line.trim())
        .join("\n\n")

      if (content.trim()) {
        chunks.push({
          content,
          hint: "请从这段 Claude 对话中提炼出有价值的记忆条目",
          timestamp: conversation.created_at
            ? new Date(conversation.created_at)
            : undefined,
          sourceLabel: `Claude / ${conversation.name ?? "未命名对话"}`,
          tags: ["claude"],
        })
      }
    }

    return chunks
  },
}

/** Claude 导出格式类型 */
interface ClaudeExport {
  name?: string
  created_at?: string
  chat_messages?: Array<{
    sender: string
    text: string
  }>
}

export default claudeJsonAdapter
