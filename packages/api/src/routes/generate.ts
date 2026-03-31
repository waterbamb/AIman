import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

interface ImageGenBody {
  prompt: string
  size?: string
  n?: number
}

interface VideoGenSubmitBody {
  prompt: string
  duration?: number
  size?: string
  imageBase64?: string
}

interface VideoGenQueryParams {
  taskId: string
}

export function registerGenerateRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 生成图像（Seedream 格式） */
  app.post<{ Body: ImageGenBody }>("/generate/image", async (request, reply) => {
    const { prompt, size, n } = request.body

    if (!prompt) {
      return reply.status(400).send({ error: "prompt 不能为空" })
    }

    try {
      const result = await ctx.imageService.generate(prompt, { size, n })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "图像生成失败"
      return reply.status(500).send({ error: message })
    }
  })

  /** 提交视频生成任务（Seedance 格式） */
  app.post<{ Body: VideoGenSubmitBody }>("/generate/video", async (request, reply) => {
    const { prompt, duration, size, imageBase64 } = request.body

    if (!prompt) {
      return reply.status(400).send({ error: "prompt 不能为空" })
    }

    try {
      const result = await ctx.videoService.submit(prompt, { duration, size, imageBase64 })
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "视频生成任务提交失败"
      return reply.status(500).send({ error: message })
    }
  })

  /** 查询视频生成任务状态 */
  app.get<{ Params: VideoGenQueryParams }>("/generate/video/:taskId", async (request, reply) => {
    const { taskId } = request.params

    try {
      const result = await ctx.videoService.query(taskId)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : "查询失败"
      return reply.status(500).send({ error: message })
    }
  })
}
