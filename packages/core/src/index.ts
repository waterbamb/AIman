// 适配器类型定义
export type {
  AdapterInput,
  RawMemoryChunk,
  Memory,
  Profile,
  AdapterMeta,
  InboundAdapter,
  OutboundAdapter,
  AdapterOutput,
} from "./adapters/types.js"

// 引擎类型定义
export type {
  IngestResult,
  SearchOptions,
  MemoryEngine,
} from "./engine/types.js"

// 数据库
export { SCHEMA_SQL } from "./db/schema.js"
export { DatabaseManager } from "./db/database.js"
export { MemoryRepository } from "./db/memory-repository.js"
export { ProfileRepository } from "./db/profile-repository.js"
export { ImportLogRepository } from "./db/import-log-repository.js"
export type { ImportLog } from "./db/import-log-repository.js"

// 配置
export { loadConfig, saveConfig, getConfigDir, getConfigPath } from "./config.js"
export type { AGILinkConfig, GPULinkConfig } from "./config.js"

// 引擎
export { MemoryEngineImpl } from "./engine/memory-engine.js"
export { AdapterRegistry } from "./engine/adapter-registry.js"

// AI 服务 —— 全部基于零克云 API
export { createEmbeddingService, GPULinkEmbeddingService } from "./engine/embedding-service.js"
export type { EmbeddingService } from "./engine/embedding-service.js"

export { createLLMService, GPULinkLLMService } from "./engine/llm-service.js"
export type { LLMService } from "./engine/llm-service.js"

export { createImageService, GPULinkImageService } from "./engine/image-service.js"
export type { ImageService, ImageGenOptions, ImageGenResult } from "./engine/image-service.js"

export { createVideoService, GPULinkVideoService } from "./engine/video-service.js"
export type { VideoService, VideoGenOptions, VideoGenSubmitResult, VideoGenQueryResult } from "./engine/video-service.js"
