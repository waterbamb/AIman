import type { AGILinkConfig } from "../config.js"

/**
 * LLM 服务接口
 */
export interface LLMService {
  /** 发送提示词并获取文本响应 */
  generate(prompt: string, systemPrompt?: string): Promise<string>
}

/**
 * Ollama LLM 实现
 */
export class OllamaLLMService implements LLMService {
  private baseUrl: string
  private model: string

  constructor(config: AGILinkConfig["llm"]) {
    this.baseUrl = config.ollamaBaseUrl ?? "http://localhost:11434"
    this.model = config.model
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages,
        stream: false,
      }),
    })

    if (!res.ok) {
      throw new Error(`Ollama LLM 请求失败: ${res.status} ${await res.text()}`)
    }

    const data = (await res.json()) as { message: { content: string } }
    return data.message.content
  }
}

/**
 * OpenAI LLM 实现
 */
export class OpenAILLMService implements LLMService {
  private apiKey: string
  private model: string

  constructor(config: AGILinkConfig["llm"]) {
    this.apiKey = config.openaiApiKey ?? ""
    this.model = config.model || "gpt-4o-mini"
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
      }),
    })

    if (!res.ok) {
      throw new Error(`OpenAI LLM 请求失败: ${res.status} ${await res.text()}`)
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
    }
    return data.choices[0].message.content
  }
}

/** 根据配置创建 LLM 服务 */
export function createLLMService(config: AGILinkConfig["llm"]): LLMService {
  switch (config.provider) {
    case "openai":
      return new OpenAILLMService(config)
    case "ollama":
    default:
      return new OllamaLLMService(config)
  }
}
