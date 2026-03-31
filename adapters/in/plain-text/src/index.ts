import type { InboundAdapter } from "@agilink/core"

/**
 * 纯文本导入适配器
 * 接受任意纯文本粘贴，由 LLM 自动提炼为记忆片段
 */
const plainTextAdapter: InboundAdapter = {
  id: "plain-text",
  name: "纯文本",
  description: "接受任意纯文本粘贴，LLM 自动提炼",

  accepts: {
    text: true,
    fileExtensions: [".txt"],
    mimeTypes: ["text/plain"],
  },

  async parse(input) {
    const text = typeof input.content === "string"
      ? input.content
      : input.content.toString("utf-8")

    return [{
      content: text,
      hint: "请从这段文本中提炼出有价值的记忆条目",
      sourceLabel: input.filename ?? "纯文本粘贴",
    }]
  },
}

export default plainTextAdapter
