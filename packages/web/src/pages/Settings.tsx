import { useState, useEffect } from "react"
import { api, type Settings as SettingsType } from "../api"
import { useApi } from "../hooks/useApi"
import { useToast } from "../components/Toast"

export default function Settings() {
  const { toast } = useToast()
  const { data: settings, loading, error, reload } = useApi<SettingsType>(() => api.getSettings())

  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [llmModel, setLlmModel] = useState("")
  const [embeddingModel, setEmbeddingModel] = useState("")
  const [imageModel, setImageModel] = useState("")
  const [videoModel, setVideoModel] = useState("")
  const [dedupThreshold, setDedupThreshold] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!settings) return
    setBaseUrl(settings.gpulink.baseUrl)
    setLlmModel(settings.llm.model)
    setEmbeddingModel(settings.embedding.model)
    setImageModel(settings.imageGen.model)
    setVideoModel(settings.videoGen.model)
    setDedupThreshold(String(settings.dedup.threshold))
  }, [settings])

  const handleSave = async () => {
    // 客户端校验
    const threshold = parseFloat(dedupThreshold)
    if (isNaN(threshold) || threshold < 0 || threshold > 1) {
      toast("去重阈值必须在 0 到 1 之间", "error")
      return
    }

    setSaving(true)
    try {
      const updates: Record<string, unknown> = {}

      if (apiKey) {
        updates.gpulink = { apiKey, baseUrl }
      } else if (baseUrl !== settings?.gpulink.baseUrl) {
        updates.gpulink = { baseUrl }
      }

      if (llmModel !== settings?.llm.model) updates.llm = { model: llmModel }
      if (embeddingModel !== settings?.embedding.model) updates.embedding = { model: embeddingModel }
      if (imageModel !== settings?.imageGen.model) updates.imageGen = { model: imageModel }
      if (videoModel !== settings?.videoGen.model) updates.videoGen = { model: videoModel }
      if (threshold !== settings?.dedup.threshold) updates.dedup = { threshold }

      if (Object.keys(updates).length === 0) {
        toast("没有需要更新的内容", "info")
      } else {
        await api.updateSettings(updates)
        toast("设置已保存", "success")
        setApiKey("")
        reload()
      }
    } catch (err) {
      toast(`保存失败: ${err instanceof Error ? err.message : "未知错误"}`, "error")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6 text-gray-500">加载中...</div>
  if (error) return <div className="p-6 text-red-500">加载失败: {error}</div>
  if (!settings) return null

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">设置</h1>

      {/* API Key 配置 */}
      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">零克云 API 配置</h2>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
          <p className="font-medium mb-1">获取 API Key</p>
          <p>
            登录零克云{" "}
            <a
              href="https://gpulink.cc"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              https://gpulink.cc
            </a>
            ，注册申请即可获得 API Key。
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={settings.gpulink.apiKeyConfigured ? `已配置 (${settings.gpulink.apiKey})` : "请输入零克云 API Key"}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            {settings.gpulink.apiKeyConfigured
              ? "如需更新，请输入新的 Key"
              : "所有 AI 功能均需要配置此 Key"}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Base URL</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
          />
        </div>
      </div>

      {/* 模型配置 */}
      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">模型配置</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              语言模型 <span className="text-gray-400 font-normal">(DeepSeek 格式)</span>
            </label>
            <input
              type="text"
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">用于记忆提炼和智能处理</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Embedding 模型</label>
            <input
              type="text"
              value={embeddingModel}
              onChange={(e) => setEmbeddingModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">用于语义搜索和去重</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              图像生成模型 <span className="text-gray-400 font-normal">(Seedream)</span>
            </label>
            <input
              type="text"
              value={imageModel}
              onChange={(e) => setImageModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              视频生成模型 <span className="text-gray-400 font-normal">(Seedance)</span>
            </label>
            <input
              type="text"
              value={videoModel}
              onChange={(e) => setVideoModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono text-sm"
            />
          </div>
        </div>
      </div>

      {/* 去重设置 */}
      <div className="bg-white rounded-lg shadow p-5 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">去重设置</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            相似度阈值 <span className="text-gray-400 font-normal">(0-1，越高越严格)</span>
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="1"
            value={dedupThreshold}
            onChange={(e) => setDedupThreshold(e.target.value)}
            className="w-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            推荐值 0.92。高于此阈值的记忆对将被视为重复。
          </p>
        </div>
      </div>

      {/* 保存按钮 */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
      >
        {saving ? "保存中..." : "保存设置"}
      </button>
    </div>
  )
}
