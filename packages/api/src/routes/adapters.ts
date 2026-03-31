import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

export function registerAdapterRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 列出所有可用导入适配器 */
  app.get("/adapters/in", async () => {
    return ctx.registry.listInbound().map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      accepts: a.accepts,
    }))
  })

  /** 列出所有可用导出适配器 */
  app.get("/adapters/out", async () => {
    return ctx.registry.listOutbound().map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
    }))
  })
}
