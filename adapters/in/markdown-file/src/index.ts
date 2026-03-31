import type { InboundAdapter } from "@agilink/core"

/**
 * Markdown 文件导入适配器
 * 按标题拆分为记忆片段
 */
const markdownFileAdapter: InboundAdapter = {
  id: "markdown-file",
  name: "Markdown 文件",
  description: "解析 .md 文件，按标题拆分为记忆片段",

  accepts: {
    fileExtensions: [".md", ".markdown"],
    mimeTypes: ["text/markdown"],
  },

  async parse(input) {
    const text = typeof input.content === "string"
      ? input.content
      : input.content.toString("utf-8")

    // 按一级或二级标题拆分
    const sections = text.split(/^(?=#{1,2}\s)/m).filter((s) => s.trim())

    return sections.map((section) => ({
      content: section.trim(),
      hint: "请从这段 Markdown 内容中提炼记忆要点",
      sourceLabel: input.filename ?? "Markdown 文件",
    }))
  },
}

export default markdownFileAdapter
