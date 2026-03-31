import type { FastifyInstance } from "fastify"
import type { AppContext } from "../context.js"

interface UpdateSettingsBody {
  gpulink?: {
    apiKey?: string
    baseUrl?: string
  }
  llm?: { model?: string }
  embedding?: { model?: string }
  imageGen?: { model?: string }
  videoGen?: { model?: string }
  dedup?: { threshold?: number }
}

export function registerSettingsRoutes(app: FastifyInstance, ctx: AppContext): void {
  /** 获取当前设置（隐藏 API Key 中间部分） */
  app.get("/settings", async () => {
    const config = ctx.config
    return {
      gpulink: {
        apiKey: maskApiKey(config.gpulink.apiKey),
        apiKeyConfigured: !!config.gpulink.apiKey,
        baseUrl: config.gpulink.baseUrl,
      },
      llm: config.llm,
      embedding: config.embedding,
      imageGen: config.imageGen,
      videoGen: config.videoGen,
      dedup: config.dedup,
    }
  })

  /** 更新设置 */
  app.put<{ Body: UpdateSettingsBody }>("/settings", async (request, reply) => {
    const updates = request.body

    if (!updates || typeof updates !== "object") {
      return reply.status(400).send({ error: "请求体必须是 JSON 对象" })
    }

    // 校验 dedup.threshold 范围
    if (updates.dedup?.threshold !== undefined) {
      const t = updates.dedup.threshold
      if (typeof t !== "number" || isNaN(t) || t < 0 || t > 1) {
        return reply.status(400).send({ error: "去重阈值必须在 0 到 1 之间" })
      }
    }

    // 校验 baseUrl 格式
    if (updates.gpulink?.baseUrl !== undefined) {
      const url = updates.gpulink.baseUrl
      if (typeof url !== "string" || !url.startsWith("http")) {
        return reply.status(400).send({ error: "API Base URL 格式不正确" })
      }
    }

    // 构建更新对象
    const configUpdates: Record<string, unknown> = {}

    if (updates.gpulink) {
      configUpdates.gpulink = {
        ...ctx.config.gpulink,
        ...updates.gpulink,
      }
    }
    if (updates.llm) {
      configUpdates.llm = { ...ctx.config.llm, ...updates.llm }
    }
    if (updates.embedding) {
      configUpdates.embedding = { ...ctx.config.embedding, ...updates.embedding }
    }
    if (updates.imageGen) {
      configUpdates.imageGen = { ...ctx.config.imageGen, ...updates.imageGen }
    }
    if (updates.videoGen) {
      configUpdates.videoGen = { ...ctx.config.videoGen, ...updates.videoGen }
    }
    if (updates.dedup) {
      configUpdates.dedup = { ...ctx.config.dedup, ...updates.dedup }
    }

    ctx.updateConfig(configUpdates)

    return { success: true }
  })
}

/** 遮蔽 API Key 中间部分 */
function maskApiKey(key: string): string {
  if (!key) return ""
  if (key.length <= 8) return "****"
  return key.slice(0, 4) + "****" + key.slice(-4)
}
