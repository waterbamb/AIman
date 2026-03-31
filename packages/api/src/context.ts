import {
  loadConfig,
  saveConfig,
  DatabaseManager,
  MemoryRepository,
  ProfileRepository,
  ImportLogRepository,
  MemoryEngineImpl,
  AdapterRegistry,
  createEmbeddingService,
  createLLMService,
  createImageService,
  createVideoService,
  type AGILinkConfig,
  type EmbeddingService,
  type LLMService,
  type ImageService,
  type VideoService,
} from "@agilink/core"

/**
 * 应用上下文 —— 持有所有核心服务实例
 */
export interface AppContext {
  config: AGILinkConfig
  db: DatabaseManager
  memoryRepo: MemoryRepository
  profileRepo: ProfileRepository
  importLogRepo: ImportLogRepository
  engine: MemoryEngineImpl
  registry: AdapterRegistry
  embeddingService: EmbeddingService
  llmService: LLMService
  imageService: ImageService
  videoService: VideoService
  /** 更新配置并重建 AI 服务 */
  updateConfig: (newConfig: Partial<AGILinkConfig>) => void
}

/**
 * 初始化应用上下文，注册所有内置适配器
 */
export async function createAppContext(): Promise<AppContext> {
  let config = loadConfig()

  // 初始化数据库
  const db = new DatabaseManager(config.dataDir)
  const memoryRepo = new MemoryRepository(db.getDb())
  const profileRepo = new ProfileRepository(db.getDb())
  const importLogRepo = new ImportLogRepository(db.getDb())

  // 初始化 AI 服务（全部基于零克云 API）
  let embeddingService = createEmbeddingService(config)
  let llmService = createLLMService(config)
  let imageService = createImageService(config)
  let videoService = createVideoService(config)

  // 初始化记忆引擎
  let engine = new MemoryEngineImpl(
    memoryRepo,
    profileRepo,
    importLogRepo,
    embeddingService,
    llmService,
    config.dedup.threshold,
  )

  // 初始化适配器注册中心
  const registry = new AdapterRegistry()

  // 注册内置导入适配器
  const inAdapters = [
    "@agilink/adapter-in-plain-text",
    "@agilink/adapter-in-markdown-file",
    "@agilink/adapter-in-chatgpt-json",
    "@agilink/adapter-in-claude-json",
    "@agilink/adapter-in-json-generic",
  ]

  for (const name of inAdapters) {
    try {
      const mod = await import(name)
      registry.registerInbound(mod.default)
    } catch (err) {
      console.warn(`加载内置导入适配器 ${name} 失败:`, err)
    }
  }

  // 注册内置导出适配器
  const outAdapters = [
    "@agilink/adapter-out-system-prompt",
    "@agilink/adapter-out-context-snippet",
    "@agilink/adapter-out-markdown-file",
    "@agilink/adapter-out-json-export",
  ]

  for (const name of outAdapters) {
    try {
      const mod = await import(name)
      registry.registerOutbound(mod.default)
    } catch (err) {
      console.warn(`加载内置导出适配器 ${name} 失败:`, err)
    }
  }

  // 加载自定义适配器
  const customLoaded = await registry.loadFromDirectory(config.adaptersDir)
  if (customLoaded > 0) {
    console.log(`已加载 ${customLoaded} 个自定义适配器`)
  }

  /** 更新配置后重建 AI 服务实例 */
  const updateConfig = (newConfig: Partial<AGILinkConfig>) => {
    config = { ...config, ...newConfig }
    if (newConfig.gpulink) {
      config.gpulink = { ...config.gpulink, ...newConfig.gpulink }
    }
    saveConfig(config)

    // 重建所有 AI 服务
    embeddingService = createEmbeddingService(config)
    llmService = createLLMService(config)
    imageService = createImageService(config)
    videoService = createVideoService(config)

    engine = new MemoryEngineImpl(
      memoryRepo, profileRepo, importLogRepo,
      embeddingService, llmService, config.dedup.threshold,
    )

    // 更新上下文引用
    ctx.config = config
    ctx.embeddingService = embeddingService
    ctx.llmService = llmService
    ctx.imageService = imageService
    ctx.videoService = videoService
    ctx.engine = engine
  }

  const ctx: AppContext = {
    config,
    db,
    memoryRepo,
    profileRepo,
    importLogRepo,
    engine,
    registry,
    embeddingService,
    llmService,
    imageService,
    videoService,
    updateConfig,
  }

  return ctx
}
