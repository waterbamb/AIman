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
export type { AGILinkConfig } from "./config.js"

// 引擎
export { MemoryEngineImpl } from "./engine/memory-engine.js"
export { AdapterRegistry } from "./engine/adapter-registry.js"
export {
  createEmbeddingService,
  OllamaEmbeddingService,
  OpenAIEmbeddingService,
} from "./engine/embedding-service.js"
export type { EmbeddingService } from "./engine/embedding-service.js"
export {
  createLLMService,
  OllamaLLMService,
  OpenAILLMService,
} from "./engine/llm-service.js"
export type { LLMService } from "./engine/llm-service.js"
