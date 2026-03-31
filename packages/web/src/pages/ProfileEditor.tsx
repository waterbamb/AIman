import { useState } from "react"
import { api } from "../api"
import { useApi } from "../hooks/useApi"

export default function ProfileEditor() {
  const { data: profile, loading, error, reload } = useApi<Record<string, string>>(() => api.getProfile())
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) return
    await api.updateProfile(newKey.trim(), newValue.trim())
    setNewKey("")
    setNewValue("")
    reload()
  }

  const handleUpdate = async (key: string) => {
    await api.updateProfile(key, editValue)
    setEditingKey(null)
    reload()
  }

  const handleDelete = async (key: string) => {
    if (!confirm(`确定删除 "${key}" 吗？`)) return
    await api.deleteProfileKey(key)
    reload()
  }

  if (loading) return <div className="p-6 text-gray-500">加载中...</div>
  if (error) return <div className="p-6 text-red-500">加载失败: {error}</div>

  const entries = Object.entries(profile ?? {})

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">个人档案</h1>
      <p className="text-sm text-gray-500">
        个人档案是关于你的 key-value 信息，会在导出时附带到上下文中
      </p>

      {/* 现有条目 */}
      <div className="bg-white rounded-lg shadow">
        {entries.length === 0 ? (
          <p className="p-4 text-gray-400">暂无档案信息</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="p-3">键</th>
                <th className="p-3">值</th>
                <th className="p-3 w-32">操作</th>
              </tr>
            </thead>
            <tbody>
              {entries.map(([key, value]) => (
                <tr key={key} className="border-b last:border-0">
                  <td className="p-3 font-medium text-gray-800">{key}</td>
                  <td className="p-3">
                    {editingKey === key ? (
                      <input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleUpdate(key)}
                        className="w-full px-2 py-1 border rounded"
                        autoFocus
                      />
                    ) : (
                      <span className="text-gray-600">{value}</span>
                    )}
                  </td>
                  <td className="p-3">
                    {editingKey === key ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleUpdate(key)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded"
                        >
                          保存
                        </button>
                        <button
                          onClick={() => setEditingKey(null)}
                          className="px-2 py-1 text-xs bg-gray-200 rounded"
                        >
                          取消
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setEditingKey(key); setEditValue(value) }}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-blue-500"
                        >
                          编辑
                        </button>
                        <button
                          onClick={() => handleDelete(key)}
                          className="px-2 py-1 text-xs text-gray-500 hover:text-red-500"
                        >
                          删除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 新增条目 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">添加新条目</h2>
        <div className="flex gap-2">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="键名（如：职业、姓名）"
            className="flex-1 px-3 py-2 border rounded-lg"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="值"
            className="flex-1 px-3 py-2 border rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
