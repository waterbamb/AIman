import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

/**
 * 零克云 API 配置
 */
export interface GPULinkConfig {
  /** 零克云 API Key（用户在设置界面输入） */
  apiKey: string
  /** API 基础地址 */
  baseUrl: string
}

/**
 * AGILink 全局配置
 */
export interface AGILinkConfig {
  /** 零克云 API 配置 */
  gpulink: GPULinkConfig
  /** 语言模型（DeepSeek 格式） */
  llm: {
    model: string
  }
  /** Embedding 模型 */
  embedding: {
    model: string
  }
  /** 图像生成模型（Seedream 格式） */
  imageGen: {
    model: string
  }
  /** 视频生成模型（Seedance 格式） */
  videoGen: {
    model: string
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
  gpulink: {
    apiKey: "",
    baseUrl: "https://gpulink.cc/v1",
  },
  llm: {
    model: "kimi-k2.5",
  },
  embedding: {
    model: "text-embedding-3-small",
  },
  imageGen: {
    model: "doubao-seedream-4-5-251128",
  },
  videoGen: {
    model: "doubao-seedance-1-5-pro-251215",
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
    try {
      const raw = readFileSync(configPath, "utf-8")
      const userConfig = JSON.parse(raw) as Partial<AGILinkConfig>
      // 深度合并配置，确保嵌套对象也被正确合并
      return deepMerge(DEFAULT_CONFIG, userConfig)
    } catch (err) {
      console.warn("配置文件解析失败，使用默认配置:", err)
      // 备份损坏的配置文件
      const backupPath = configPath + ".bak"
      try {
        const { copyFileSync } = require("node:fs")
        copyFileSync(configPath, backupPath)
        console.warn(`损坏的配置已备份到 ${backupPath}`)
      } catch { /* 忽略备份失败 */ }
    }
  }

  // 首次运行，写入默认配置
  writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf-8")
  return { ...DEFAULT_CONFIG }
}

/**
 * 保存配置
 */
export function saveConfig(config: AGILinkConfig): void {
  const configDir = getConfigDir()
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true })
  }
  const configPath = getConfigPath()
  writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8")
}

/** 深度合并对象 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(base: any, override: any): any {
  const result = { ...base }
  for (const key of Object.keys(override)) {
    const val = override[key]
    if (val !== undefined && val !== null && typeof val === "object" && !Array.isArray(val)) {
      result[key] = deepMerge(result[key] ?? {}, val)
    } else if (val !== undefined) {
      result[key] = val
    }
  }
  return result
}
