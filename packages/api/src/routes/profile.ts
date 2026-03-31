import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

export function registerProfileRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 获取完整个人档案 */
  app.get("/profile", async () => {
    return ctx.profileRepo.getAll()
  })

  /** 更新个人档案某个键 */
  app.put<{ Params: { key: string }; Body: { value: string } }>("/profile/:key", async (request, reply) => {
    const { key } = request.params
    const { value } = request.body

    if (!key || !key.trim()) {
      return reply.status(400).send({ error: "键名不能为空" })
    }
    if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
      return reply.status(400).send({ error: "值不能为空" })
    }

    ctx.profileRepo.set(key, value, "api")

    return { success: true }
  })

  /** 删除个人档案某个键 */
  app.delete<{ Params: { key: string } }>("/profile/:key", async (request, reply) => {
    const deleted = ctx.profileRepo.delete(request.params.key)

    if (!deleted) {
      return reply.status(404).send({ error: "档案键不存在" })
    }

    return { success: true }
  })
}
