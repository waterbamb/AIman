import { useState } from "react"
import { api, type AdapterInfo, type ExportOutput } from "../api"
import { useApi } from "../hooks/useApi"

export default function ExportCenter() {
  const { data: adapters } = useApi<AdapterInfo[]>(() => api.getOutboundAdapters())
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [exporting, setExporting] = useState(false)
  const [output, setOutput] = useState<ExportOutput | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleExport = async () => {
    if (!selectedAdapter) return

    setExporting(true)
    setError(null)
    setOutput(null)

    try {
      const res = await api.exportData(selectedAdapter, query || undefined)
      setOutput(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "导出失败")
    } finally {
      setExporting(false)
    }
  }

  const handleCopy = async () => {
    if (!output) return
    await navigator.clipboard.writeText(output.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    if (!output) return
    const blob = new Blob([output.content], { type: output.mimeType || "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = output.filename || "agilink-export"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">导出 / 注入</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：适配器列表 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">选择导出适配器</h2>
          {adapters?.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedAdapter(a.id); setOutput(null); setError(null) }}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selectedAdapter === a.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-gray-800">{a.name}</p>
              <p className="text-sm text-gray-500">{a.description}</p>
            </button>
          ))}
        </div>

        {/* 右侧：导出操作 */}
        <div className="md:col-span-2 space-y-4">
          {!selectedAdapter ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-400">请先选择一个导出适配器</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  话题/关键词（可选，用于筛选相关记忆）
                </label>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="例如: React 项目开发"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                onClick={handleExport}
                disabled={exporting}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {exporting ? "生成中..." : "生成导出"}
              </button>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {output && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(output.type === "text" || output.type === "clipboard") && (
                      <button
                        onClick={handleCopy}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        {copied ? "已复制" : "复制到剪贴板"}
                      </button>
                    )}
                    {output.type === "file" && (
                      <button
                        onClick={handleDownload}
                        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                      >
                        下载文件
                      </button>
                    )}
                  </div>

                  <pre className="p-4 bg-gray-50 rounded-lg border text-sm font-mono whitespace-pre-wrap max-h-96 overflow-y-auto">
                    {output.content}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
