import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

interface MemoryQuery {
  q?: string
  limit?: string
  offset?: string
  tags?: string
  source?: string
  minImportance?: string
}

interface MemoryBody {
  content: string
  summary?: string
  tags?: string[]
  importance?: number
  sourceLabel?: string
}

interface SearchBody {
  query: string
  limit?: number
  tags?: string[]
  source?: string
  minImportance?: number
}

export function registerMemoryRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 查询记忆列表 */
  app.get<{ Querystring: MemoryQuery }>("/memories", async (request) => {
    const { q, limit, offset, tags, source, minImportance } = request.query

    return ctx.memoryRepo.findAll({
      query: q,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      tags: tags ? tags.split(",") : undefined,
      source,
      minImportance: minImportance ? parseInt(minImportance) : undefined,
    })
  })

  /** 手动新增记忆 */
  app.post<{ Body: MemoryBody }>("/memories", async (request) => {
    const { content, summary, tags, importance, sourceLabel } = request.body

    // 手动添加的记忆直接存储，不经过 LLM 提炼
    const id = ctx.memoryRepo.insert({
      content,
      summary: summary ?? content.slice(0, 100),
      sourceAdapter: "manual",
      sourceLabel: sourceLabel ?? "手动添加",
      tags: tags ?? [],
      importance: importance ?? 3,
      embedding: null,
    })

    // 异步生成 embedding（不阻塞响应）
    ctx.embeddingService.embed(content).then((emb) => {
      ctx.memoryRepo.update(id, {})
      // 直接更新 embedding 需要用底层 db
      const db = ctx.db.getDb()
      db.prepare("UPDATE memories SET embedding = ? WHERE id = ?").run(
        Buffer.from(new Float64Array(emb).buffer),
        id,
      )
    }).catch(() => {
      // embedding 生成失败不影响记忆存储
    })

    return { id }
  })

  /** 更新记忆 */
  app.put<{ Params: { id: string }; Body: Partial<MemoryBody> }>("/memories/:id", async (request, reply) => {
    const { id } = request.params
    const updated = ctx.memoryRepo.update(id, request.body)

    if (!updated) {
      return reply.status(404).send({ error: "记忆不存在" })
    }

    return { success: true }
  })

  /** 删除记忆 */
  app.delete<{ Params: { id: string } }>("/memories/:id", async (request, reply) => {
    const deleted = ctx.memoryRepo.delete(request.params.id)

    if (!deleted) {
      return reply.status(404).send({ error: "记忆不存在" })
    }

    return { success: true }
  })

  /** 语义搜索 */
  app.post<{ Body: SearchBody }>("/memories/search", async (request) => {
    const { query, limit, tags, source, minImportance } = request.body

    return ctx.engine.search(query, { limit, tags, source, minImportance })
  })

  /** 触发去重整理 */
  app.post("/memories/deduplicate", async () => {
    return ctx.engine.deduplicate()
  })
}
