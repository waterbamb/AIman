import { useState, useRef } from "react"
import { api } from "../api"
import { useToast } from "../components/Toast"

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
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState("1024x1024")
  const [generating, setGenerating] = useState(false)
  const [images, setImages] = useState<Array<{ b64Data?: string; url?: string }>>([])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setImages([])

    try {
      const result = await api.generateImage(prompt, { size })
      setImages(result.images)
      toast("图像生成完成", "success")
    } catch (err) {
      toast(err instanceof Error ? err.message : "图像生成失败，请检查 API Key 配置", "error")
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

      <div className="flex flex-wrap gap-4 items-end">
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
                    toast("开始下载", "info")
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
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [size, setSize] = useState("1280x720")
  const [generating, setGenerating] = useState(false)
  const [taskId, setTaskId] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const pollingRef = useRef(false)

  const handleSubmit = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setTaskId(null)
    setVideoUrl(null)
    setStatus(null)

    try {
      const result = await api.submitVideoTask(prompt, { size })
      setTaskId(result.taskId)
      setStatus("pending")
      toast("视频任务已提交，正在排队处理", "info")
      pollStatus(result.taskId)
    } catch (err) {
      toast(err instanceof Error ? err.message : "提交失败，请检查 API Key 配置", "error")
      setGenerating(false)
    }
  }

  const pollStatus = async (id: string) => {
    if (pollingRef.current) return
    pollingRef.current = true

    const maxAttempts = 120
    let attempts = 0
    let baseDelay = 5000 // 起始 5 秒

    const poll = async () => {
      if (!pollingRef.current) return
      attempts++
      try {
        const result = await api.queryVideoTask(id)
        setStatus(result.status)

        if (result.status === "completed" && result.videoUrl) {
          setVideoUrl(result.videoUrl)
          setGenerating(false)
          pollingRef.current = false
          toast("视频生成完成", "success")
          return
        }

        if (result.status === "failed") {
          setGenerating(false)
          pollingRef.current = false
          toast(result.error ?? "视频生成失败", "error")
          return
        }

        if (attempts < maxAttempts) {
          // 逐步增加间隔：5s, 5s, 5s, 8s, 8s, 10s... 最大 15s
          const delay = Math.min(baseDelay + Math.floor(attempts / 3) * 1000, 15000)
          setTimeout(poll, delay)
        } else {
          setGenerating(false)
          pollingRef.current = false
          toast("查询超时，请刷新页面后重试", "error")
        }
      } catch (err) {
        // 网络错误时重试几次
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000)
        } else {
          setGenerating(false)
          pollingRef.current = false
          toast(err instanceof Error ? err.message : "查询失败", "error")
        }
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

      <div className="flex flex-wrap gap-4 items-end">
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

      {taskId && status && (
        <div className="bg-white rounded-lg shadow p-4 space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-500 truncate">任务 ID: {taskId}</span>
            <span className={`px-2 py-0.5 rounded text-xs ${
              status === "completed" ? "bg-green-100 text-green-700" :
              status === "failed" ? "bg-red-100 text-red-700" :
              "bg-yellow-100 text-yellow-700"
            }`}>
              {statusLabels[status] ?? status}
            </span>
          </div>

          {(status === "processing" || status === "pending") && (
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`h-2 rounded-full animate-pulse ${
                status === "processing" ? "bg-blue-500 w-2/3" : "bg-yellow-500 w-1/4"
              }`} />
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
