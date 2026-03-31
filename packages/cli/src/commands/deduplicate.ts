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

export const deduplicateCommand = new Command("deduplicate")
  .description("触发记忆去重整理")
  .action(async () => {
    const config = loadConfig()
    const db = new DatabaseManager(config.dataDir)

    try {
      const memoryRepo = new MemoryRepository(db.getDb())
      const profileRepo = new ProfileRepository(db.getDb())
      const importLogRepo = new ImportLogRepository(db.getDb())
      const embeddingService = createEmbeddingService(config.embedding)
      const llmService = createLLMService(config.llm)

      const engine = new MemoryEngineImpl(
        memoryRepo, profileRepo, importLogRepo,
        embeddingService, llmService, config.dedup.threshold,
      )

      console.log("正在分析记忆库中的重复内容...")

      const result = await engine.deduplicate()

      console.log("\n去重完成:")
      console.log(`  合并: ${result.merged} 对`)
      console.log(`  删除: ${result.removed} 条`)
    } finally {
      db.close()
    }
  })
