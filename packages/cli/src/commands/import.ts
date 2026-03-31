import { Command } from "commander"
import { readFileSync } from "node:fs"
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

export const importCommand = new Command("import")
  .description("导入数据到记忆库")
  .requiredOption("-a, --adapter <id>", "指定导入适配器 ID")
  .argument("[file]", "输入文件路径（可选，不指定则从标准输入读取）")
  .option("-m, --metadata <json>", "附加元信息（JSON 格式）")
  .action(async (file: string | undefined, options) => {
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

      const registry = new AdapterRegistry()

      // 注册内置适配器
      const builtins = [
        "@agilink/adapter-in-plain-text",
        "@agilink/adapter-in-markdown-file",
        "@agilink/adapter-in-chatgpt-json",
        "@agilink/adapter-in-claude-json",
        "@agilink/adapter-in-json-generic",
      ]
      for (const name of builtins) {
        try {
          const mod = await import(name)
          registry.registerInbound(mod.default)
        } catch { /* 忽略 */ }
      }

      // 加载自定义适配器
      await registry.loadFromDirectory(config.adaptersDir)

      const adapter = registry.getInbound(options.adapter)
      if (!adapter) {
        console.error(`错误: 导入适配器 '${options.adapter}' 不存在`)
        console.error("可用适配器:", registry.listInbound().map((a) => a.id).join(", "))
        process.exit(1)
      }

      // 读取输入内容
      let content: string
      if (file) {
        content = readFileSync(file, "utf-8")
      } else {
        // 从标准输入读取
        const chunks: Buffer[] = []
        for await (const chunk of process.stdin) {
          chunks.push(chunk as Buffer)
        }
        content = Buffer.concat(chunks).toString("utf-8")
      }

      const metadata = options.metadata ? JSON.parse(options.metadata) : undefined

      console.log(`使用适配器 '${adapter.name}' 解析中...`)

      const rawChunks = await adapter.parse({
        type: file ? "file" : "text",
        content,
        filename: file,
        metadata,
      })

      console.log(`解析完成，共 ${rawChunks.length} 个原始片段`)
      console.log("正在提炼、去重、存储...")

      const result = await engine.ingest(rawChunks, {
        adapterId: adapter.id,
        filename: file,
      })

      console.log("\n导入完成:")
      console.log(`  总计: ${result.total} 条`)
      console.log(`  新增: ${result.stored} 条`)
      console.log(`  合并: ${result.merged} 条`)
      console.log(`  跳过: ${result.skipped} 条`)
    } finally {
      db.close()
    }
  })
