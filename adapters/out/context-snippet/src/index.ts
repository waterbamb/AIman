import type { OutboundAdapter } from "@agilink/core"

/**
 * 上下文片段导出适配器
 * 生成简短的对话开头片段
 */
const contextSnippetAdapter: OutboundAdapter = {
  id: "context-snippet",
  name: "上下文片段",
  description: "生成简短的对话开头片段",

  async render(memories, profile) {
    const lines: string[] = []

    lines.push("以下是关于我的一些背景信息，请在回答时参考：")
    lines.push("")

    // 附加关键档案信息
    const profileEntries = Object.entries(profile)
    if (profileEntries.length > 0) {
      for (const [key, value] of profileEntries) {
        lines.push(`- ${key}: ${value}`)
      }
      lines.push("")
    }

    // 仅取高重要性记忆
    const topMemories = [...memories]
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 5)

    if (topMemories.length > 0) {
      for (const memory of topMemories) {
        lines.push(`- ${memory.summary || memory.content}`)
      }
    }

    return {
      type: "text",
      content: lines.join("\n"),
    }
  },
}

export default contextSnippetAdapter
