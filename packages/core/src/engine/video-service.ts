import type { AGILinkConfig } from "../config.js"

/**
 * 视频生成服务接口
 */
export interface VideoService {
  /** 提交视频生成任务，返回任务 ID */
  submit(prompt: string, options?: VideoGenOptions): Promise<VideoGenSubmitResult>
  /** 查询视频生成任务状态 */
  query(taskId: string): Promise<VideoGenQueryResult>
}

export interface VideoGenOptions {
  /** 视频时长（秒） */
  duration?: number
  /** 视频分辨率，如 "1280x720" */
  size?: string
  /** 参考图像（Base64） */
  imageBase64?: string
}

export interface VideoGenSubmitResult {
  /** 任务 ID，用于后续查询 */
  taskId: string
}

export interface VideoGenQueryResult {
  /** 任务状态 */
  status: "pending" | "processing" | "completed" | "failed"
  /** 生成完成时的视频 URL */
  videoUrl?: string
  /** 失败时的错误信息 */
  error?: string
}

/**
 * 零克云视频生成服务
 * 使用 Seedance 格式调用 doubao-seedance-1-5-pro-251215 模型
 * Seedance 采用异步任务模式：先提交任务，再轮询查询结果
 */
export class GPULinkVideoService implements VideoService {
  private baseUrl: string
  private apiKey: string
  private model: string

  constructor(config: AGILinkConfig) {
    this.baseUrl = config.gpulink.baseUrl
    this.apiKey = config.gpulink.apiKey
    this.model = config.videoGen.model
  }

  async submit(prompt: string, options?: VideoGenOptions): Promise<VideoGenSubmitResult> {
    if (!this.apiKey) {
      throw new Error("请先在设置中配置零克云 API Key。获取方式: 登录零克云 https://gpulink.cc，注册申请即可。")
    }

    // Seedance 格式: /video/generations
    const body: Record<string, unknown> = {
      model: this.model,
      prompt,
    }

    if (options?.duration) body.duration = options.duration
    if (options?.size) body.size = options.size
    if (options?.imageBase64) body.image = options.imageBase64

    const res = await fetch(`${this.baseUrl}/video/generations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`零克云视频生成请求失败: ${res.status} ${errText}`)
    }

    const data = (await res.json()) as { id: string; task_id?: string }
    return { taskId: data.task_id ?? data.id }
  }

  async query(taskId: string): Promise<VideoGenQueryResult> {
    if (!this.apiKey) {
      throw new Error("请先在设置中配置零克云 API Key。")
    }

    // 查询任务状态
    const res = await fetch(`${this.baseUrl}/video/generations/${taskId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`零克云视频任务查询失败: ${res.status} ${errText}`)
    }

    const data = (await res.json()) as {
      status: string
      video_url?: string
      output?: { video_url?: string }
      error?: { message?: string }
    }

    const statusMap: Record<string, VideoGenQueryResult["status"]> = {
      pending: "pending",
      queued: "pending",
      processing: "processing",
      running: "processing",
      completed: "completed",
      succeeded: "completed",
      success: "completed",
      failed: "failed",
      error: "failed",
    }

    return {
      status: statusMap[data.status] ?? "processing",
      videoUrl: data.video_url ?? data.output?.video_url,
      error: data.error?.message,
    }
  }
}

/** 根据配置创建视频生成服务 */
export function createVideoService(config: AGILinkConfig): VideoService {
  return new GPULinkVideoService(config)
}
