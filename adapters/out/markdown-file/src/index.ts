import type { OutboundAdapter } from "@agilink/core"

/**
 * Markdown 文件导出适配器
 * 将记忆导出为结构化 .md 文件
 */
const markdownFileAdapter: OutboundAdapter = {
  id: "markdown-file",
  name: "Markdown 文件",
  description: "导出为 .md 文件",

  async render(memories, profile) {
    const lines: string[] = []

    lines.push("# AGILink 记忆导出")
    lines.push("")
    lines.push(`> 导出时间: ${new Date().toISOString()}`)
    lines.push("")

    // 个人档案
    const profileEntries = Object.entries(profile)
    if (profileEntries.length > 0) {
      lines.push("## 个人档案")
      lines.push("")
      for (const [key, value] of profileEntries) {
        lines.push(`- **${key}**: ${value}`)
      }
      lines.push("")
    }

    // 记忆条目
    lines.push("## 记忆条目")
    lines.push("")

    const sorted = [...memories].sort((a, b) => b.importance - a.importance)
    for (const memory of sorted) {
      lines.push(`### ${memory.summary || "未命名记忆"}`)
      lines.push("")
      lines.push(`- **重要性**: ${memory.importance}/5`)
      lines.push(`- **来源**: ${memory.sourceLabel}`)
      if (memory.tags.length > 0) {
        lines.push(`- **标签**: ${memory.tags.join(", ")}`)
      }
      lines.push("")
      lines.push(memory.content)
      lines.push("")
      lines.push("---")
      lines.push("")
    }

    return {
      type: "file",
      content: lines.join("\n"),
      filename: "agilink-export.md",
      mimeType: "text/markdown",
    }
  },
}

export default markdownFileAdapter
