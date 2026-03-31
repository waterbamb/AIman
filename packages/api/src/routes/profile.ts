import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

export function registerProfileRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 获取完整个人档案 */
  app.get("/profile", async () => {
    return ctx.profileRepo.getAll()
  })

  /** 更新个人档案某个键 */
  app.put<{ Params: { key: string }; Body: { value: string } }>("/profile/:key", async (request) => {
    const { key } = request.params
    const { value } = request.body

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
