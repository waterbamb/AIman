import { Command } from "commander"
import { writeFileSync } from "node:fs"
import {
  loadConfig,
  DatabaseManager,
  MemoryRepository,
  ProfileRepository,
  ImportLogRepository,
  MemoryEngineImpl,
  AdapterRegistry,
  createEmbeddingService,
  createLLMService,
} from "@agilink/core"

export const exportCommand = new Command("export")
  .description("导出记忆")
  .requiredOption("-a, --adapter <id>", "指定导出适配器 ID")
  .option("-q, --query <query>", "按话题/关键词筛选")
  .option("-o, --output <file>", "输出到文件（不指定则打印到终端）")
  .action(async (options) => {
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

      const registry = new AdapterRegistry()

      // 注册内置导出适配器
      const builtins = [
        "@agilink/adapter-out-system-prompt",
        "@agilink/adapter-out-context-snippet",
        "@agilink/adapter-out-markdown-file",
        "@agilink/adapter-out-json-export",
      ]
      for (const name of builtins) {
        try {
          const mod = await import(name)
          registry.registerOutbound(mod.default)
        } catch { /* 忽略 */ }
      }

      await registry.loadFromDirectory(config.adaptersDir)

      const adapter = registry.getOutbound(options.adapter)
      if (!adapter) {
        console.error(`错误: 导出适配器 '${options.adapter}' 不存在`)
        console.error("可用适配器:", registry.listOutbound().map((a) => a.id).join(", "))
        process.exit(1)
      }

      // 构建上下文
      const context = options.query
        ? await engine.buildContext(options.query)
        : { memories: memoryRepo.findAll({ limit: 100 }), profile: profileRepo.getAll() }

      console.log(`使用适配器 '${adapter.name}' 导出中...`)
      console.log(`包含 ${context.memories.length} 条记忆\n`)

      const output = await adapter.render(context.memories, context.profile)

      if (options.output) {
        writeFileSync(options.output, output.content, "utf-8")
        console.log(`已导出到: ${options.output}`)
      } else {
        console.log(output.content)
      }
    } finally {
      db.close()
    }
  })
