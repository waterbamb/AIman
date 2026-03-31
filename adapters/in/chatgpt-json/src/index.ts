import type { InboundAdapter, RawMemoryChunk } from "@agilink/core"

/**
 * ChatGPT 对话导出 JSON 导入适配器
 * 解析 ChatGPT 官方导出的 conversations.json
 */
const chatgptJsonAdapter: InboundAdapter = {
  id: "chatgpt-json",
  name: "ChatGPT 对话导出",
  description: "解析 ChatGPT 官方导出的 conversations.json",

  accepts: {
    fileExtensions: [".json"],
    mimeTypes: ["application/json"],
  },

  async parse(input) {
    const text = typeof input.content === "string"
      ? input.content
      : input.content.toString("utf-8")

    const data = JSON.parse(text) as ChatGPTExport[]
    const chunks: RawMemoryChunk[] = []

    for (const conversation of data) {
      const messages = extractMessages(conversation)
      if (messages.length === 0) continue

      chunks.push({
        content: messages.join("\n\n"),
        hint: "请从这段 ChatGPT 对话中提炼出有价值的记忆条目",
        timestamp: conversation.create_time
          ? new Date(conversation.create_time * 1000)
          : undefined,
        sourceLabel: `ChatGPT / ${conversation.title ?? "未命名对话"}`,
        tags: ["chatgpt"],
      })
    }

    return chunks
  },
}

/** ChatGPT 导出格式类型 */
interface ChatGPTExport {
  title?: string
  create_time?: number
  mapping?: Record<string, {
    message?: {
      author?: { role?: string }
      content?: { parts?: string[] }
    }
  }>
}

/** 从 ChatGPT 对话数据中提取消息文本 */
function extractMessages(conversation: ChatGPTExport): string[] {
  if (!conversation.mapping) return []

  const messages: string[] = []
  for (const node of Object.values(conversation.mapping)) {
    const msg = node.message
    if (!msg?.content?.parts) continue
    const role = msg.author?.role ?? "unknown"
    const text = msg.content.parts.filter((p) => typeof p === "string").join("")
    if (text.trim()) {
      messages.push(`[${role}]: ${text}`)
    }
  }
  return messages
}

export default chatgptJsonAdapter
