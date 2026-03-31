import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/**
 * AGILink 全局配置
 */
export interface AGILinkConfig {
  embedding: {
    provider: "ollama" | "openai"
    model: string
    openaiApiKey?: string
    /** Ollama 服务地址 */
    ollamaBaseUrl?: string
  }
  llm: {
    provider: "ollama" | "openai"
    model: string
    openaiApiKey?: string
    ollamaBaseUrl?: string
  }
  api: {
    port: number
  }
  dedup: {
    /** 相似度阈值，高于此值视为重复 */
    threshold: number
  }
  /** 自定义适配器目录 */
  adaptersDir: string
  /** 数据存储目录 */
  dataDir: string
}

/** 默认配置 */
const DEFAULT_CONFIG: AGILinkConfig = {
  embedding: {
    provider: "ollama",
    model: "nomic-embed-text",
    ollamaBaseUrl: "http://localhost:11434",
  },
  llm: {
    provider: "ollama",
    model: "llama3.2",
    ollamaBaseUrl: "http://localhost:11434",
  },
  api: {
    port: 43210,
  },
  dedup: {
    threshold: 0.92,
  },
  adaptersDir: join(homedir(), ".agilink", "adapters"),
  dataDir: join(homedir(), ".agilink"),
}

/**
 * 获取 AGILink 配置目录路径
 */
export function getConfigDir(): string {
  return join(homedir(), ".agilink")
}

/**
 * 获取配置文件路径
 */
export function getConfigPath(): string {
  return join(getConfigDir(), "config.json")
}

/**
 * 加载配置文件，不存在则创建默认配置
 */
export function loadConfig(): AGILinkConfig {
  const configDir = getConfigDir()
  const configPath = getConfigPath()

  // 确保配置目录存在
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }

  // 读取或创建配置文件
  if (existsSync(configPath)) {
    const raw = readFileSync(configPath, "utf-8")
    const userConfig = JSON.parse(raw) as Partial<AGILinkConfig>
    return { ...DEFAULT_CONFIG, ...userConfig }
  }

  // 首次运行，写入默认配置
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8")
  return { ...DEFAULT_CONFIG }
}

/**
 * 保存配置
 */
export function saveConfig(config: AGILinkConfig): void {
  const configPath = getConfigPath()
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8")
}
