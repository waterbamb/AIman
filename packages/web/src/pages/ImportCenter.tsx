import { useState } from "react"
import { api, type AdapterInfo, type IngestResult } from "../api"
import { useApi } from "../hooks/useApi"

export default function ImportCenter() {
  const { data: adapters } = useApi<AdapterInfo[]>(() => api.getInboundAdapters())
  const [selectedAdapter, setSelectedAdapter] = useState<string | null>(null)
  const [textInput, setTextInput] = useState("")
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [fileName, setFileName] = useState("")
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<IngestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const adapter = adapters?.find((a) => a.id === selectedAdapter)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      setFileContent(reader.result as string)
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!selectedAdapter) return

    const content = fileContent || textInput
    if (!content.trim()) {
      setError("请输入内容或上传文件")
      return
    }

    setImporting(true)
    setError(null)
    setResult(null)

    try {
      const res = await api.importData(selectedAdapter, {
        type: fileContent ? "file" : "text",
        content,
        filename: fileName || undefined,
      })
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : "导入失败")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">导入中心</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 左侧：适配器列表 */}
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-gray-500 uppercase">选择导入适配器</h2>
          {adapters?.map((a) => (
            <button
              key={a.id}
              onClick={() => { setSelectedAdapter(a.id); setResult(null); setError(null) }}
              className={`w-full text-left p-3 rounded-lg border transition ${
                selectedAdapter === a.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p className="font-medium text-gray-800">{a.name}</p>
              <p className="text-sm text-gray-500">{a.description}</p>
              {a.accepts?.fileExtensions && (
                <p className="text-xs text-gray-400 mt-1">
                  支持: {a.accepts.fileExtensions.join(", ")}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* 右侧：输入区域 */}
        <div className="md:col-span-2 space-y-4">
          {!selectedAdapter ? (
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-gray-400">请先选择一个导入适配器</p>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-semibold">{adapter?.name}</h2>

              {/* 文件上传 */}
              {adapter?.accepts?.fileExtensions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">上传文件</label>
                  <input
                    type="file"
                    accept={adapter.accepts.fileExtensions.join(",")}
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {fileName && <p className="text-sm text-gray-500 mt-1">已选择: {fileName}</p>}
                </div>
              )}

              {/* 文本粘贴 */}
              {(adapter?.accepts?.text || !adapter?.accepts?.fileExtensions) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">或粘贴文本</label>
                  <textarea
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="w-full h-48 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono"
                    placeholder="在此粘贴文本内容..."
                  />
                </div>
              )}

              {/* 导入按钮 */}
              <button
                onClick={handleImport}
                disabled={importing}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {importing ? "导入中..." : "开始导入"}
              </button>

              {/* 错误提示 */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 导入结果 */}
              {result && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">导入完成</h3>
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-2xl font-bold text-gray-800">{result.total}</p>
                      <p className="text-xs text-gray-500">总计</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{result.stored}</p>
                      <p className="text-xs text-gray-500">新增</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{result.merged}</p>
                      <p className="text-xs text-gray-500">合并</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-400">{result.skipped}</p>
                      <p className="text-xs text-gray-500">跳过</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
