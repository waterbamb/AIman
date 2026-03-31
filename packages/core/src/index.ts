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

// 数据库 schema
export { SCHEMA_SQL } from "./db/schema.js"
