import type { FastifyInstance } from "fastify"

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/health", async () => {
    return { status: "ok", version: "0.1.0", timestamp: new Date().toISOString() }
  })
}
