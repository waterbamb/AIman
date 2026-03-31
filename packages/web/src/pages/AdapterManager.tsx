import { api, type AdapterInfo } from "../api"
import { useApi } from "../hooks/useApi"

export default function AdapterManager() {
  const { data: inbound } = useApi<AdapterInfo[]>(() => api.getInboundAdapters())
  const { data: outbound } = useApi<AdapterInfo[]>(() => api.getOutboundAdapters())

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">适配器管理</h1>

      {/* 导入适配器 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">导入适配器</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {inbound?.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{a.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                </div>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">导入</span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>ID: {a.id}</p>
                {a.accepts?.fileExtensions && (
                  <p>文件类型: {a.accepts.fileExtensions.join(", ")}</p>
                )}
                {a.accepts?.text && <p>支持文本粘贴</p>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 导出适配器 */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-3">导出适配器</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {outbound?.map((a) => (
            <div key={a.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">{a.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{a.description}</p>
                </div>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">导出</span>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                <p>ID: {a.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 自定义适配器提示 */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-700 mb-2">自定义适配器</h3>
        <p className="text-sm text-gray-500">
          将自定义适配器文件放置在 <code className="bg-gray-200 px-1 rounded">~/.agilink/adapters/</code> 目录下，
          AGILink 启动时会自动扫描加载。支持 .js 和 .mjs 文件。
        </p>
      </div>
    </div>
  )
}
