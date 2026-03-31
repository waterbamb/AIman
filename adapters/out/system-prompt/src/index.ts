import type { OutboundAdapter } from "@agilink/core"

/**
 * System Prompt 导出适配器
 * 生成可注入任意 AI 工具的 System Prompt 块
 */
const systemPromptAdapter: OutboundAdapter = {
  id: "system-prompt",
  name: "System Prompt",
  description: "生成可注入任意 AI 的 System Prompt 块",

  async render(memories, profile) {
    const lines: string[] = []

    lines.push("# 用户个人记忆上下文")
    lines.push("")

    // 个人档案部分
    const profileEntries = Object.entries(profile)
    if (profileEntries.length > 0) {
      lines.push("## 个人档案")
      for (const [key, value] of profileEntries) {
        lines.push(`- ${key}: ${value}`)
      }
      lines.push("")
    }

    // 记忆部分，按重要性降序排列
    if (memories.length > 0) {
      lines.push("## 相关记忆")
      const sorted = [...memories].sort((a, b) => b.importance - a.importance)
      for (const memory of sorted) {
        lines.push(`- [重要性${memory.importance}] ${memory.summary || memory.content}`)
      }
      lines.push("")
    }

    return {
      type: "text",
      content: lines.join("\n"),
    }
  },
}

export default systemPromptAdapter
