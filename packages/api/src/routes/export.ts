import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

interface ExportBody {
  adapterId: string
  query?: string
  options?: unknown
}

export function registerExportRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 导出记忆 */
  app.post<{ Body: ExportBody }>("/export", async (request, reply) => {
    const { adapterId, query, options } = request.body

    const adapter = ctx.registry.getOutbound(adapterId)
    if (!adapter) {
      return reply.status(404).send({ error: `导出适配器 '${adapterId}' 不存在` })
    }

    // 构建上下文
    const context = query
      ? await ctx.engine.buildContext(query)
      : { memories: ctx.memoryRepo.findAll({ limit: 100 }), profile: ctx.profileRepo.getAll() }

    // 渲染输出
    const output = await adapter.render(context.memories, context.profile, options)

    return output
  })
}
