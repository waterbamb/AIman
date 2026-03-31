#!/usr/bin/env node
import { Command } from "commander"

const program = new Command()

program
  .name("agilink")
  .description("AGILink - 跨应用智能记忆中心 CLI")
  .version("0.1.0")

program
  .command("serve")
  .description("启动 API + Web 界面")
  .action(() => {
    console.log("启动 AGILink 服务...")
    // 后续实现
  })

program
  .command("adapters")
  .description("适配器管理")
  .command("list")
  .description("列出所有适配器")
  .action(() => {
    console.log("适配器列表（待实现）")
  })

program
  .command("search <query>")
  .description("语义搜索记忆")
  .action((query: string) => {
    console.log(`搜索: ${query}（待实现）`)
  })

program
  .command("stats")
  .description("显示统计信息")
  .action(() => {
    console.log("统计信息（待实现）")
  })

program.parse()
