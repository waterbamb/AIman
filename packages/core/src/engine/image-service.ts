import type { AGILinkConfig } from "../config.js"

/**
 * 图像生成服务接口
 */
export interface ImageService {
  /** 根据文本提示生成图像，返回 Base64 编码或 URL */
  generate(prompt: string, options?: ImageGenOptions): Promise<ImageGenResult>
}

export interface ImageGenOptions {
  /** 图像尺寸，如 "1024x1024" */
  size?: string
  /** 生成数量 */
  n?: number
}

export interface ImageGenResult {
  images: Array<{
    /** Base64 编码的图像数据 */
    b64Data?: string
    /** 图像 URL */
    url?: string
  }>
}

/**
 * 零克云图像生成服务
 * 使用 Seedream 格式调用 doubao-seedream-4-5-251128 模型
 */
export class GPULinkImageService implements ImageService {
  private baseUrl: string
  private apiKey: string
  private model: string

  constructor(config: AGILinkConfig) {
    this.baseUrl = config.gpulink.baseUrl
    this.apiKey = config.gpulink.apiKey
    this.model = config.imageGen.model
  }

  async generate(prompt: string, options?: ImageGenOptions): Promise<ImageGenResult> {
    if (!this.apiKey) {
      throw new Error("请先在设置中配置零克云 API Key。获取方式: 登录零克云 https://gpulink.cc，注册申请即可。")
    }

    // Seedream 格式: /images/generations
    const res = await fetch(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        prompt,
        size: options?.size ?? "1024x1024",
        n: options?.n ?? 1,
        response_format: "b64_json",
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`零克云图像生成请求失败: ${res.status} ${errText}`)
    }

    const data = (await res.json()) as {
      data: Array<{ b64_json?: string; url?: string }>
    }

    return {
      images: data.data.map((item) => ({
        b64Data: item.b64_json,
        url: item.url,
      })),
    }
  }
}

/** 根据配置创建图像生成服务 */
export function createImageService(config: AGILinkConfig): ImageService {
  return new GPULinkImageService(config)
}
