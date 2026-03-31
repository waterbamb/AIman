import type { OutboundAdapter } from "@agilink/core"

/**
 * JSON 导出适配器
 * 完整 JSON 备份
 */
const jsonExportAdapter: OutboundAdapter = {
  id: "json-export",
  name: "JSON 备份",
  description: "完整 JSON 备份",

  async render(memories, profile) {
    const exportData = {
      version: "0.1.0",
      exportedAt: new Date().toISOString(),
      profile,
      memories: memories.map((m) => ({
        id: m.id,
        content: m.content,
        summary: m.summary,
        sourceAdapter: m.sourceAdapter,
        sourceLabel: m.sourceLabel,
        tags: m.tags,
        importance: m.importance,
        createdAt: m.createdAt.toISOString(),
        updatedAt: m.updatedAt.toISOString(),
      })),
    }

    return {
      type: "file",
      content: JSON.stringify(exportData, null, 2),
      filename: "agilink-backup.json",
      mimeType: "application/json",
    }
  },
}

export default jsonExportAdapter
