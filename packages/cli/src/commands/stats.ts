import { Command } from "commander"
import {
  loadConfig,
  DatabaseManager,
  MemoryRepository,
  ImportLogRepository,
} from "@agilink/core"

export const statsCommand = new Command("stats")
  .description("显示记忆库统计信息")
  .action(async () => {
    const config = loadConfig()
    const db = new DatabaseManager(config.dataDir)

    try {
      const memoryRepo = new MemoryRepository(db.getDb())
      const importLogRepo = new ImportLogRepository(db.getDb())

      const stats = memoryRepo.getStats()
      const recentLogs = importLogRepo.getRecent(5)

      console.log("AGILink 记忆库统计")
      console.log("=".repeat(40))
      console.log(`  记忆总量: ${stats.totalMemories} 条`)
      console.log(`  平均重要性: ${stats.avgImportance.toFixed(1)}`)

      if (Object.keys(stats.bySource).length > 0) {
        console.log("\n  按来源分布:")
        for (const [source, count] of Object.entries(stats.bySource)) {
          console.log(`    ${source}: ${count} 条`)
        }
      }

      if (Object.keys(stats.byImportance).length > 0) {
        console.log("\n  按重要性分布:")
        for (const [level, count] of Object.entries(stats.byImportance)) {
          console.log(`    ★${level}: ${count} 条`)
        }
      }

      if (recentLogs.length > 0) {
        console.log("\n  最近导入:")
        for (const log of recentLogs) {
          const filename = log.filename ?? "无文件名"
          console.log(`    ${log.importedAt.toLocaleString()} | ${log.adapterId} | ${filename} | ${log.chunkCount} 条 | ${log.status}`)
        }
      }
    } finally {
      db.close()
    }
  })
