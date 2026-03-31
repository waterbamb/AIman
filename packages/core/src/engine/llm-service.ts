import type { AGILinkConfig } from "../config.js"

/**
 * LLM 服务接口
 */
export interface LLMService {
  /** 发送提示词并获取文本响应 */
  generate(prompt: string, systemPrompt?: string): Promise<string>
}

/**
 * 零克云 LLM 服务实现
 * 使用 DeepSeek 兼容的 chat/completions 格式
 * 默认模型: kimi-k2.5
 */
export class GPULinkLLMService implements LLMService {
  private baseUrl: string
  private apiKey: string
  private model: string

  constructor(config: AGILinkConfig) {
    this.baseUrl = config.gpulink.baseUrl
    this.apiKey = config.gpulink.apiKey
    this.model = config.llm.model
  }

  async generate(prompt: string, systemPrompt?: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error("请先在设置中配置零克云 API Key。获取方式: 登录零克云 https://gpulink.cc，注册申请即可。")
    }

    const messages: Array<{ role: string; content: string }> = []

    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt })
    }
    messages.push({ role: "user", content: prompt })

    // DeepSeek 兼容格式: /chat/completions
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        stream: false,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`零克云 LLM 请求失败: ${res.status} ${errText}`)
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
    }
    return data.choices[0].message.content
  }
}

/** 根据配置创建 LLM 服务 */
export function createLLMService(config: AGILinkConfig): LLMService {
  return new GPULinkLLMService(config)
}
