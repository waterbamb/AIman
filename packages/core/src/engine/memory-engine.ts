import type { Memory, Profile, RawMemoryChunk, AdapterMeta } from "../adapters/types.js"
import type { MemoryEngine, IngestResult, SearchOptions } from "./types.js"
import type { EmbeddingService } from "./embedding-service.js"
import type { LLMService } from "./llm-service.js"
import type { MemoryRepository } from "../db/memory-repository.js"
import type { ProfileRepository } from "../db/profile-repository.js"
import type { ImportLogRepository } from "../db/import-log-repository.js"

/** LLM 提炼后的结构化记忆条目 */
interface RefinedMemory {
  content: string
  summary: string
  tags: string[]
  importance: number
}

/**
 * 记忆引擎核心实现
 * 负责：原始片段提炼 → 语义去重 → 存储 → 检索 → 上下文构建
 */
export class MemoryEngineImpl implements MemoryEngine {
  constructor(
    private memoryRepo: MemoryRepository,
    private profileRepo: ProfileRepository,
    private importLogRepo: ImportLogRepository,
    private embeddingService: EmbeddingService,
    private llmService: LLMService,
    private dedupThreshold: number = 0.92,
  ) {}

  /**
   * 导入流程：原始片段 → LLM 提炼 → 生成 embedding → 语义去重 → 存储
   */
  async ingest(chunks: RawMemoryChunk[], meta: AdapterMeta): Promise<IngestResult> {
    const result: IngestResult = { total: 0, stored: 0, merged: 0, skipped: 0 }

    for (const chunk of chunks) {
      // 1. LLM 提炼：将原始文本拆分为独立的记忆条目
      const refined = await this.refineChunk(chunk)
      result.total += refined.length

      for (const item of refined) {
        // 2. 生成 embedding
        const embedding = await this.embeddingService.embed(item.content)

        // 3. 语义去重
        const dedupResult = await this.checkDuplicate(embedding)

        if (dedupResult.action === "skip") {
          result.skipped++
          continue
        }

        if (dedupResult.action === "merge" && dedupResult.existingId) {
          // 合并：用更完整的内容更新已有记忆
          const existing = this.memoryRepo.findById(dedupResult.existingId)
          if (existing) {
            const mergedContent = item.content.length > existing.content.length
              ? item.content
              : existing.content
            const mergedSummary = item.summary.length > existing.summary.length
              ? item.summary
              : existing.summary

            this.memoryRepo.update(dedupResult.existingId, {
              content: mergedContent,
              summary: mergedSummary,
              importance: Math.max(item.importance, existing.importance),
              tags: [...new Set([...existing.tags, ...item.tags])],
            })
          }
          result.merged++
          continue
        }

        // 4. 直接存储
        this.memoryRepo.insert({
          content: item.content,
          summary: item.summary,
          sourceAdapter: meta.adapterId,
          sourceLabel: chunk.sourceLabel ?? meta.adapterId,
          tags: item.tags,
          importance: item.importance,
          embedding: new Float64Array(embedding),
        })
        result.stored++
      }
    }

    // 记录导入日志
    this.importLogRepo.create({
      adapterId: meta.adapterId,
      filename: meta.filename ?? null,
      chunkCount: result.total,
      status: result.total === result.skipped ? "partial" : "success",
    })

    return result
  }

  /**
   * 语义搜索
   */
  async search(query: string, options?: SearchOptions): Promise<Memory[]> {
    // 先获取候选集（关键词预筛）
    const candidates = this.memoryRepo.findAll({
      tags: options?.tags,
      source: options?.source,
      minImportance: options?.minImportance,
      limit: 500,
    })

    if (candidates.length === 0) return []

    // 生成查询的 embedding
    const queryEmbedding = await this.embeddingService.embed(query)

    // 计算相似度并排序
    const scored = candidates
      .filter((m) => m.embedding !== null)
      .map((m) => ({
        memory: m,
        score: this.embeddingService.cosineSimilarity(
          queryEmbedding,
          Array.from(m.embedding!),
        ),
      }))
      .sort((a, b) => b.score - a.score)

    const limit = options?.limit ?? 20
    return scored.slice(0, limit).map((s) => s.memory)
  }

  /**
   * 构建上下文：语义检索相关记忆 + 个人档案
   */
  async buildContext(query: string): Promise<{ memories: Memory[]; profile: Profile }> {
    const memories = await this.search(query, { limit: 10 })
    const profile = this.profileRepo.getAll()
    return { memories, profile }
  }

  /**
   * 全局去重整理
   */
  async deduplicate(): Promise<{ merged: number; removed: number }> {
    const allMemories = this.memoryRepo.findAllWithEmbeddings()
    const toRemove: string[] = []
    const processed = new Set<string>()
    let merged = 0

    for (let i = 0; i < allMemories.length; i++) {
      if (processed.has(allMemories[i].id)) continue

      const memA = allMemories[i]
      if (!memA.embedding) continue

      for (let j = i + 1; j < allMemories.length; j++) {
        if (processed.has(allMemories[j].id)) continue

        const memB = allMemories[j]
        if (!memB.embedding) continue

        const similarity = this.embeddingService.cosineSimilarity(
          Array.from(memA.embedding),
          Array.from(memB.embedding),
        )

        if (similarity > this.dedupThreshold) {
          // 高度重复，保留内容更完整的，删除另一个
          const keepId = memA.content.length >= memB.content.length ? memA.id : memB.id
          const removeId = keepId === memA.id ? memB.id : memA.id

          toRemove.push(removeId)
          processed.add(removeId)
          merged++
        }
      }
    }

    const removed = this.memoryRepo.deleteMany(toRemove)
    return { merged, removed }
  }

  /**
   * 使用 LLM 将原始文本片段提炼为结构化记忆条目
   */
  private async refineChunk(chunk: RawMemoryChunk): Promise<RefinedMemory[]> {
    const systemPrompt = `你是一个记忆提炼助手。你的任务是从用户提供的文本中提取有价值的记忆条目。

规则：
1. 将文本拆分为独立的记忆条目，每条聚焦一个知识点或偏好
2. 为每条记忆写一个简短摘要（一句话）
3. 为每条记忆打重要性分（1-5）：
   - 5：核心身份信息（职业、长期目标、价值观）
   - 4：重要偏好和工作习惯
   - 3：有价值的知识结论
   - 2：一般性讨论内容
   - 1：临时性或已过时内容
4. 为每条记忆添加相关标签
5. 过滤掉纯粹的寒暄、无信息量的内容

请严格以 JSON 数组格式返回，不要添加其他文本：
[
  {
    "content": "完整的记忆内容",
    "summary": "一句话摘要",
    "tags": ["标签1", "标签2"],
    "importance": 3
  }
]`

    const hint = chunk.hint ? `\n提示：${chunk.hint}` : ""
    const prompt = `请从以下文本中提炼记忆条目：${hint}\n\n---\n${chunk.content}\n---`

    try {
      const response = await this.llmService.generate(prompt, systemPrompt)
      // 提取 JSON 部分
      const jsonMatch = response.match(/\[[\s\S]*\]/)
      if (!jsonMatch) {
        // LLM 未返回有效 JSON，将整个文本作为单条记忆
        return [{
          content: chunk.content,
          summary: chunk.content.slice(0, 100),
          tags: chunk.tags ?? [],
          importance: 3,
        }]
      }

      const parsed = JSON.parse(jsonMatch[0]) as RefinedMemory[]
      return parsed.map((m) => ({
        content: m.content || chunk.content,
        summary: m.summary || m.content?.slice(0, 100) || "",
        tags: [...(m.tags ?? []), ...(chunk.tags ?? [])],
        importance: Math.min(5, Math.max(1, m.importance ?? 3)),
      }))
    } catch {
      // LLM 调用失败，降级为直接存储
      return [{
        content: chunk.content,
        summary: chunk.content.slice(0, 100),
        tags: chunk.tags ?? [],
        importance: 3,
      }]
    }
  }

  /**
   * 检查与已有记忆的重复度
   * 返回: skip（>0.92）| merge（0.80~0.92）| store（<0.80）
   */
  private async checkDuplicate(
    newEmbedding: number[],
  ): Promise<{ action: "skip" | "merge" | "store"; existingId?: string }> {
    const allMemories = this.memoryRepo.findAllWithEmbeddings()

    let maxSimilarity = 0
    let mostSimilarId: string | undefined

    for (const memory of allMemories) {
      if (!memory.embedding) continue

      const similarity = this.embeddingService.cosineSimilarity(
        newEmbedding,
        Array.from(memory.embedding),
      )

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
        mostSimilarId = memory.id
      }
    }

    if (maxSimilarity > this.dedupThreshold) {
      return { action: "skip", existingId: mostSimilarId }
    }

    if (maxSimilarity > 0.80) {
      return { action: "merge", existingId: mostSimilarId }
    }

    return { action: "store" }
  }
}
