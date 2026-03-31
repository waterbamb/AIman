#!/usr/bin/env node
import { Command } from "commander"
import { serveCommand } from "./commands/serve.js"
import { importCommand } from "./commands/import.js"
import { exportCommand } from "./commands/export.js"
import { searchCommand } from "./commands/search.js"
import { adaptersCommand } from "./commands/adapters.js"
import { deduplicateCommand } from "./commands/deduplicate.js"
import { statsCommand } from "./commands/stats.js"

const program = new Command()

program
  .name("agilink")
  .description("AGILink - 跨应用智能记忆中心 CLI")
  .version("0.1.0")

program.addCommand(serveCommand)
program.addCommand(importCommand)
program.addCommand(exportCommand)
program.addCommand(searchCommand)
program.addCommand(adaptersCommand)
program.addCommand(deduplicateCommand)
program.addCommand(statsCommand)

program.parse()
