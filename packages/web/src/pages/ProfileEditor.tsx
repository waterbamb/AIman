import { useState } from "react"
import { api } from "../api"
import { useApi } from "../hooks/useApi"
import { useToast } from "../components/Toast"
import { useConfirm } from "../components/ConfirmDialog"
import { EmptyState } from "../components/EmptyState"

export default function ProfileEditor() {
  const { toast } = useToast()
  const { confirm, dialog } = useConfirm()
  const { data: profile, loading, error, reload } = useApi<Record<string, string>>(() => api.getProfile())
  const [newKey, setNewKey] = useState("")
  const [newValue, setNewValue] = useState("")
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleAdd = async () => {
    if (!newKey.trim() || !newValue.trim()) {
      toast("请填写键名和值", "error")
      return
    }
    try {
      await api.updateProfile(newKey.trim(), newValue.trim())
      toast("已添加", "success")
      setNewKey("")
      setNewValue("")
      reload()
    } catch {
      toast("添加失败", "error")
    }
  }

  const handleUpdate = async (key: string) => {
    if (!editValue.trim()) {
      toast("值不能为空", "error")
      return
    }
    try {
      await api.updateProfile(key, editValue)
      toast("已更新", "success")
      setEditingKey(null)
      reload()
    } catch {
      toast("更新失败", "error")
    }
  }

  const handleDelete = async (key: string) => {
    const ok = await confirm("删除档案条目", `确定删除 "${key}" 吗？删除后无法恢复。`, true)
    if (!ok) return
    try {
      await api.deleteProfileKey(key)
      toast("已删除", "success")
      reload()
    } catch {
      toast("删除失败", "error")
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">个人档案</h1>
        <div className="bg-white rounded-lg shadow animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 border-b last:border-0">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) return <div className="p-6 text-red-500">加载失败: {error}</div>

  const entries = Object.entries(profile ?? {})

  return (
    <div className="p-6 space-y-6">
      {dialog}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">个人档案</h1>
        <p className="text-sm text-gray-500 mt-1">
          个人档案是关于你的 key-value 信息，会在导出时附带到上下文中
        </p>
      </div>

      {/* 现有条目 */}
      <div className="bg-white rounded-lg shadow">
        {entries.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="暂无档案信息"
              description="添加一些关于你的信息，如姓名、职业、兴趣等，AI 导出时会自动附带"
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]">
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
                          className="w-full px-2 py-1 border rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
                          autoFocus
                        />
                      ) : (
                        <span className="text-gray-600 break-words">{value}</span>
                      )}
                    </td>
                    <td className="p-3">
                      {editingKey === key ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleUpdate(key)}
                            className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1 text-xs bg-gray-200 rounded hover:bg-gray-300"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={() => { setEditingKey(key); setEditValue(value) }}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(key)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
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
          </div>
        )}
      </div>

      {/* 新增条目 */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">添加新条目</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder="键名（如：职业、姓名）"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <input
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            placeholder="值"
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 shrink-0"
          >
            添加
          </button>
        </div>
      </div>
    </div>
  )
}
