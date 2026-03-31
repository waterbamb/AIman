import { Command } from "commander"

export const serveCommand = new Command("serve")
  .description("启动 API + Web 界面")
  .option("-p, --port <port>", "指定端口号")
  .action(async (options) => {
    // 动态导入 API 服务，避免启动时加载所有依赖
    const { createServer } = await import("@agilink/api")

    const { app, ctx } = await createServer()
    const port = options.port ? parseInt(options.port) : ctx.config.api.port

    try {
      await app.listen({ port, host: "127.0.0.1" })
      console.log(`\n  AGILink 服务已启动`)
      console.log(`  API:  http://localhost:${port}`)
      console.log(`  Web:  http://localhost:${port}\n`)
    } catch (err) {
      console.error("启动失败:", err)
      process.exit(1)
    }
  })
