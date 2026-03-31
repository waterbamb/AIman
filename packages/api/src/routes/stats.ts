import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

export function registerStatsRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 获取统计信息 */
  app.get("/stats", async () => {
    const memoryStats = ctx.memoryRepo.getStats()
    const recentLogs = ctx.importLogRepo.getRecent(10)

    return {
      ...memoryStats,
      recentImports: recentLogs,
      adapters: {
        inbound: ctx.registry.listInbound().length,
        outbound: ctx.registry.listOutbound().length,
      },
    }
  })
}
