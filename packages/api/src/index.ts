import Fastify from "fastify"

const app = Fastify({ logger: true })

app.get("/health", async () => {
  return { status: "ok", version: "0.1.0" }
})

const start = async () => {
  try {
    await app.listen({ port: 43210, host: "127.0.0.1" })
    console.log("AGILink API 已启动: http://localhost:43210")
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
