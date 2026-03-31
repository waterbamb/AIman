import { Command } from "commander"
import { loadConfig, AdapterRegistry } from "@agilink/core"

export const adaptersCommand = new Command("adapters")
  .description("适配器管理")

adaptersCommand
  .command("list")
  .description("列出所有可用适配器")
  .action(async () => {
    const config = loadConfig()
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
      } catch { /* 忽略 */ }
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
      } catch { /* 忽略 */ }
    }

    // 加载自定义适配器
    const customCount = await registry.loadFromDirectory(config.adaptersDir)

    console.log("导入适配器:")
    for (const adapter of registry.listInbound()) {
      console.log(`  ${adapter.id.padEnd(20)} ${adapter.name} - ${adapter.description}`)
    }

    console.log("\n导出适配器:")
    for (const adapter of registry.listOutbound()) {
      console.log(`  ${adapter.id.padEnd(20)} ${adapter.name} - ${adapter.description}`)
    }

    if (customCount > 0) {
      console.log(`\n已加载 ${customCount} 个自定义适配器`)
    }
  })
