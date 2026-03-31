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
 * Ollama Embedding 实现
 */
export class OllamaEmbeddingService implements EmbeddingService {
  private baseUrl: string
  private model: string

  constructor(config: AGILinkConfig["embedding"]) {
    this.baseUrl = config.ollamaBaseUrl ?? "http://localhost:11434"
    this.model = config.model
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: text }),
    })

    if (!res.ok) {
      throw new Error(`Ollama embedding 请求失败: ${res.status} ${await res.text()}`)
    }

    const data = (await res.json()) as { embeddings: number[][] }
    return data.embeddings[0]
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: this.model, input: texts }),
    })

    if (!res.ok) {
      throw new Error(`Ollama embedding 批量请求失败: ${res.status} ${await res.text()}`)
    }

    const data = (await res.json()) as { embeddings: number[][] }
    return data.embeddings
  }

  cosineSimilarity(a: number[], b: number[]): number {
    return cosineSimilarity(a, b)
  }
}

/**
 * OpenAI Embedding 实现
 */
export class OpenAIEmbeddingService implements EmbeddingService {
  private apiKey: string
  private model: string

  constructor(config: AGILinkConfig["embedding"]) {
    this.apiKey = config.openaiApiKey ?? ""
    this.model = config.model || "text-embedding-3-small"
  }

  async embed(text: string): Promise<number[]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: text }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI embedding 请求失败: ${res.status} ${await res.text()}`)
    }

    const data = (await res.json()) as { data: Array<{ embedding: number[] }> }
    return data.data[0].embedding
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const res = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI embedding 批量请求失败: ${res.status} ${await res.text()}`)
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
export function createEmbeddingService(config: AGILinkConfig["embedding"]): EmbeddingService {
  switch (config.provider) {
    case "openai":
      return new OpenAIEmbeddingService(config)
    case "ollama":
    default:
      return new OllamaEmbeddingService(config)
  }
}
