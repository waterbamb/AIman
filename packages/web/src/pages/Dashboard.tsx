import { api, type Stats } from "../api"
import { useApi } from "../hooks/useApi"
import { EmptyState } from "../components/EmptyState"

export default function Dashboard({ onNavigate }: { onNavigate: (page: string) => void }) {
  const { data: stats, loading, error } = useApi<Stats>(() => api.getStats())

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
              <div className="h-8 bg-gray-200 rounded w-12" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) return <div className="p-6 text-red-500">加载失败: {error}</div>
  if (!stats) return null

  // 首次使用空状态
  if (stats.totalMemories === 0) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
        <EmptyState
          title="欢迎使用 AGILink"
          description="你的记忆库还是空的。从导入中心开始，将 ChatGPT 对话、Markdown 笔记或纯文本导入为结构化记忆。"
          actionLabel="前往导入中心"
          onAction={() => onNavigate("import")}
        />
      </div>
    )
  }

  const sourceEntries = Object.entries(stats.bySource)
  const importanceEntries = Object.entries(stats.byImportance).sort(([a], [b]) => Number(b) - Number(a))

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* 概览卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="记忆总量" value={stats.totalMemories} />
        <StatCard title="平均重要性" value={stats.avgImportance.toFixed(1)} />
        <StatCard title="导入适配器" value={stats.adapters.inbound} />
        <StatCard title="导出适配器" value={stats.adapters.outbound} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 来源分布 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">来源分布</h2>
          {sourceEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无来源数据</p>
          ) : (
            <div className="space-y-2">
              {sourceEntries.map(([source, count]) => (
                <div key={source} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate mr-2">{source}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 md:w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${(count / stats.totalMemories) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 重要性分布 */}
        <div className="bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-3">重要性分布</h2>
          {importanceEntries.length === 0 ? (
            <p className="text-gray-400 text-sm">暂无重要性数据</p>
          ) : (
            <div className="space-y-2">
              {importanceEntries.map(([level, count]) => (
                <div key={level} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600" title={`重要性 ${level}/5`}>
                    {"★".repeat(Number(level))}{"☆".repeat(5 - Number(level))}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-24 md:w-32 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full"
                        style={{ width: `${(count / stats.totalMemories) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 最近导入 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3">最近导入</h2>
        {stats.recentImports.length === 0 ? (
          <p className="text-gray-400 text-sm">暂无导入记录</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[500px]">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2">时间</th>
                  <th className="pb-2">适配器</th>
                  <th className="pb-2">文件</th>
                  <th className="pb-2">条数</th>
                  <th className="pb-2">状态</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentImports.map((log) => (
                  <tr key={log.id} className="border-b last:border-0">
                    <td className="py-2 whitespace-nowrap">{new Date(log.importedAt).toLocaleString()}</td>
                    <td className="py-2">{log.adapterId}</td>
                    <td className="py-2 text-gray-500 max-w-[200px] truncate">{log.filename ?? "-"}</td>
                    <td className="py-2">{log.chunkCount}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        log.status === "success" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {log.status === "success" ? "成功" : log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
