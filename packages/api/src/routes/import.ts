import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"
import type { AdapterInput } from "@agilink/core"

interface ImportBody {
  adapterId: string
  input: {
    type: "file" | "text" | "url"
    content: string
    filename?: string
    metadata?: Record<string, unknown>
  }
}

export function registerImportRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 导入数据 */
  app.post<{ Body: ImportBody }>("/import", async (request, reply) => {
    const { adapterId, input } = request.body

    if (!adapterId || typeof adapterId !== "string") {
      return reply.status(400).send({ error: "adapterId 不能为空" })
    }
    if (!input || !input.content || typeof input.content !== "string" || !input.content.trim()) {
      return reply.status(400).send({ error: "导入内容不能为空" })
    }

    const adapter = ctx.registry.getInbound(adapterId)
    if (!adapter) {
      return reply.status(404).send({ error: `导入适配器 '${adapterId}' 不存在` })
    }

    const adapterInput: AdapterInput = {
      type: input.type,
      content: input.content,
      filename: input.filename,
      metadata: input.metadata,
    }

    // 解析原始片段
    const chunks = await adapter.parse(adapterInput)

    // 通过记忆引擎处理
    const result = await ctx.engine.ingest(chunks, {
      adapterId,
      filename: input.filename,
    })

    return result
  })
}
