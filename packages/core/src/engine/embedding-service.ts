import type { AGILinkConfig } from "../config.js"

/**
 * Embedding 服务接口
 */
export interface EmbeddingService {
  /** 将文本转为嵌入向量 */
  embed(text: string): Promise<number[]>
  /** 批量嵌入 */
  embedBatch(texts: string[]): Promise<number[][]>
  /** 计算两个向量的余弦相似度 */
  cosineSimilarity(a: number[], b: number[]): number
}

/**
 * 零克云 Embedding 服务实现
 * 使用 OpenAI 兼容的 /embeddings 端点
 */
export class GPULinkEmbeddingService implements EmbeddingService {
  private baseUrl: string
  private apiKey: string
  private model: string

  constructor(config: AGILinkConfig) {
    this.baseUrl = config.gpulink.baseUrl
    this.apiKey = config.gpulink.apiKey
    this.model = config.embedding.model
  }

  async embed(text: string): Promise<number[]> {
    if (!this.apiKey) {
      throw new Error("请先在设置中配置零克云 API Key。获取方式: 登录零克云 https://gpulink.cc，注册申请即可。")
    }

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: text }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`零克云 Embedding 请求失败: ${res.status} ${errText}`)
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
    return data.data[0].embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    if (!this.apiKey) {
      throw new Error("请先在设置中配置零克云 API Key。获取方式: 登录零克云 https://gpulink.cc，注册申请即可。")
    }

    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`零克云 Embedding 批量请求失败: ${res.status} ${errText}`)
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
    return data.data.map((d) => d.embedding)
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return cosineSimilarity(a, b)
  }
}

/** 余弦相似度计算 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

/** 根据配置创建 Embedding 服务 */
export function createEmbeddingService(config: AGILinkConfig): EmbeddingService {
  return new GPULinkEmbeddingService(config)
}
