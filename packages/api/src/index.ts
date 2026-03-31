import Fastify from "fastify"
import cors from "@fastify/cors"
import { createAppContext } from "./context.js"
import { registerHealthRoutes } from "./routes/health.js"
import { registerAdapterRoutes } from "./routes/adapters.js"
import { registerImportRoutes } from "./routes/import.js"
import { registerMemoryRoutes } from "./routes/memories.js"
import { registerExportRoutes } from "./routes/export.js"
import { registerProfileRoutes } from "./routes/profile.js"
import { registerStatsRoutes } from "./routes/stats.js"
import { registerSettingsRoutes } from "./routes/settings.js"
import { registerGenerateRoutes } from "./routes/generate.js"

export async function createServer() {
  const app = Fastify({ logger: true })

  // 注册 CORS（允许本地 Web 界面访问）
  await app.register(cors, { origin: true })

  // 初始化应用上下文
  const ctx = await createAppContext()

  // 注册所有路由
  registerHealthRoutes(app)
  registerAdapterRoutes(app, ctx)
  registerImportRoutes(app, ctx)
  registerMemoryRoutes(app, ctx)
  registerExportRoutes(app, ctx)
  registerProfileRoutes(app, ctx)
  registerStatsRoutes(app, ctx)
  registerSettingsRoutes(app, ctx)
  registerGenerateRoutes(app, ctx)

  // 关闭时清理数据库
  app.addHook("onClose", () => {
    ctx.db.close()
  })

  return { app, ctx }
}

/** 直接运行时启动服务 */
const start = async () => {
  const { app, ctx } = await createServer()

  try {
    await app.listen({ port: ctx.config.api.port, host: "127.0.0.1" })
    console.log(`AGILink API 已启动: http://localhost:${ctx.config.api.port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
