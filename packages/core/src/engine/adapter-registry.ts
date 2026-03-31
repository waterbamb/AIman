import { existsSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { pathToFileURL } from "node:url"
import type { InboundAdapter, OutboundAdapter } from "../adapters/types.js"

/**
 * 适配器注册中心
 * 管理所有内置和自定义的导入/导出适配器
 */
export class AdapterRegistry {
  private inboundAdapters = new Map<string, InboundAdapter>()
  private outboundAdapters = new Map<string, OutboundAdapter>()

  /** 注册导入适配器 */
  registerInbound(adapter: InboundAdapter): void {
    this.inboundAdapters.set(adapter.id, adapter)
  }

  /** 注册导出适配器 */
  registerOutbound(adapter: OutboundAdapter): void {
    this.outboundAdapters.set(adapter.id, adapter)
  }

  /** 获取导入适配器 */
  getInbound(id: string): InboundAdapter | undefined {
    return this.inboundAdapters.get(id)
  }

  /** 获取导出适配器 */
  getOutbound(id: string): OutboundAdapter | undefined {
    return this.outboundAdapters.get(id)
  }

  /** 列出所有导入适配器 */
  listInbound(): InboundAdapter[] {
    return [...this.inboundAdapters.values()]
  }

  /** 列出所有导出适配器 */
  listOutbound(): OutboundAdapter[] {
    return [...this.outboundAdapters.values()]
  }

  /**
   * 从目录加载自定义适配器
   * 扫描指定目录下的 .js 或 .ts 文件，动态导入并注册
   */
  async loadFromDirectory(dir: string): Promise<number> {
    if (!existsSync(dir)) return 0

    const files = readdirSync(dir).filter(
      (f) => f.endsWith(".js") || f.endsWith(".mjs"),
    )

    let loaded = 0

    for (const file of files) {
      try {
        const filePath = join(dir, file)
        const fileUrl = pathToFileURL(filePath).href
        const mod = (await import(fileUrl)) as {
          default?: InboundAdapter | OutboundAdapter
        }

        if (!mod.default || !mod.default.id) continue

        const adapter = mod.default

        // 根据是否有 parse 方法判断是导入还是导出适配器
        if ("parse" in adapter) {
          this.registerInbound(adapter as InboundAdapter)
        } else if ("render" in adapter) {
          this.registerOutbound(adapter as OutboundAdapter)
        }

        loaded++
      } catch (err) {
        console.warn(`加载自定义适配器 ${file} 失败:`, err)
      }
    }

    return loaded
  }
}
