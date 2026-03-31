import { Command } from "commander"
import {
  loadConfig,
  DatabaseManager,
  MemoryRepository,
  ProfileRepository,
  ImportLogRepository,
  MemoryEngineImpl,
  createEmbeddingService,
  createLLMService,
} from "@agilink/core"

export const searchCommand = new Command("search")
  .description("语义搜索记忆")
  .argument("<query>", "搜索关键词或自然语言查询")
  .option("-l, --limit <n>", "最大返回条数", "10")
  .option("-t, --tags <tags>", "按标签筛选（逗号分隔）")
  .option("-s, --source <source>", "按来源筛选")
  .action(async (query: string, options) => {
    const config = loadConfig()
    const db = new DatabaseManager(config.dataDir)

    try {
      const memoryRepo = new MemoryRepository(db.getDb())
      const profileRepo = new ProfileRepository(db.getDb())
      const importLogRepo = new ImportLogRepository(db.getDb())
      const embeddingService = createEmbeddingService(config)
      const llmService = createLLMService(config)

      const engine = new MemoryEngineImpl(
        memoryRepo, profileRepo, importLogRepo,
        embeddingService, llmService, config.dedup.threshold,
      )

      const results = await engine.search(query, {
        limit: parseInt(options.limit),
        tags: options.tags ? options.tags.split(",") : undefined,
        source: options.source,
      })

      if (results.length === 0) {
        console.log("未找到相关记忆")
        return
      }

      console.log(`找到 ${results.length} 条相关记忆:\n`)

      for (const memory of results) {
        console.log(`[★${memory.importance}] ${memory.summary || memory.content.slice(0, 80)}`)
        console.log(`  来源: ${memory.sourceLabel} | 标签: ${memory.tags.join(", ") || "无"}`)
        console.log(`  时间: ${memory.updatedAt.toLocaleString()}`)
        console.log()
      }
    } finally {
      db.close()
    }
  })
