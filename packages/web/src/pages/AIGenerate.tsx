import { useState } from "react"
import { api } from "../api"

type TabType = "image" | "video"

export default function AIGenerate() {
  const [activeTab, setActiveTab] = useState<TabType>("image")

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">AI 生成</h1>

      {/* Tab 切换 */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("image")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "image"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          图像生成 (Seedream)
        </button>
        <button
          onClick={() => setActiveTab("video")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
            activeTab === "video"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          视频生成 (Seedance)
        </button>
      </div>

      {activeTab === "image" ? <ImageGenerator /> : <VideoGenerator />}
    </div>
  )
}

function ImageGenerator() {
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState("1024x1024")
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<Array<{ b64Data?: string; url?: string }>>([])
  const [error, setError] = useState<string | null>(null)

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    setImages([])

    try {
      const result = await api.generateImage(prompt, { size })
      setImages(result.images)
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败")
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">图像描述</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要生成的图像..."
          className="w-full h-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">尺寸</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="512x512">512x512</option>
            <option value="1024x1024">1024x1024</option>
            <option value="1024x576">1024x576 (横版)</option>
            <option value="576x1024">576x1024 (竖版)</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !prompt.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {generating ? "生成中..." : "生成图像"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {images.map((img, i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              {img.b64Data ? (
                <img
                  src={`data:image/png;base64,${img.b64Data}`}
                  alt={`生成图像 ${i + 1}`}
                  className="w-full"
                />
              ) : img.url ? (
                <img src={img.url} alt={`生成图像 ${i + 1}`} className="w-full" />
              ) : null}
              <div className="p-2 flex gap-2">
                <button
                  onClick={() => {
                    const link = document.createElement("a")
                    if (img.b64Data) {
                      link.href = `data:image/png;base64,${img.b64Data}`
                    } else if (img.url) {
                      link.href = img.url
                    }
                    link.download = `agilink-image-${Date.now()}.png`
                    link.click()
                  }}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
                >
                  下载
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function VideoGenerator() {
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState("1280x720")
  const [generating, setGenerating] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError(null)
    setTaskId(null)
    setVideoUrl(null)
    setStatus(null)

    try {
      const result = await api.submitVideoTask(prompt, { size })
      setTaskId(result.taskId)
      setStatus("pending")
      // 开始轮询
      pollStatus(result.taskId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "提交失败")
      setGenerating(false)
    }
  }

  const pollStatus = async (id: string) => {
    const maxAttempts = 120 // 最多轮询 10 分钟（每 5 秒一次）
    let attempts = 0

    const poll = async () => {
      attempts++
      try {
        const result = await api.queryVideoTask(id)
        setStatus(result.status)

        if (result.status === "completed" && result.videoUrl) {
          setVideoUrl(result.videoUrl)
          setGenerating(false)
          return
        }

        if (result.status === "failed") {
          setError(result.error ?? "视频生成失败")
          setGenerating(false)
          return
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 5000)
        } else {
          setError("查询超时，请稍后重试")
          setGenerating(false)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "查询失败")
        setGenerating(false)
      }
    }

    setTimeout(poll, 5000)
  }

  const statusLabels: Record<string, string> = {
    pending: "排队中...",
    processing: "生成中...",
    completed: "已完成",
    failed: "失败",
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">视频描述</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="描述你想要生成的视频内容..."
          className="w-full h-24 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分辨率</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="1280x720">1280x720 (720p)</option>
            <option value="1920x1080">1920x1080 (1080p)</option>
            <option value="720x1280">720x1280 (竖版)</option>
          </select>
        </div>

        <button
          onClick={handleSubmit}
          disabled={generating || !prompt.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {generating ? "处理中..." : "生成视频"}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {taskId && status && (
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">任务 ID: {taskId}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              status === "completed" ? "bg-green-100 text-green-700" :
              status === "failed" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {statusLabels[status] ?? status}
            </span>
          </div>

          {status === "processing" && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full animate-pulse w-2/3" />
            </div>
          )}

          {videoUrl && (
            <div>
              <video controls className="w-full rounded-lg" src={videoUrl} />
              <a
                href={videoUrl}
                download
                className="inline-block mt-2 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                下载视频
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
