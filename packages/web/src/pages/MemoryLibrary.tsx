import { useState } from "react"
import { api, type Memory } from "../api"
import { useApi } from "../hooks/useApi"

export default function MemoryLibrary() {
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword")
  const [filterSource, setFilterSource] = useState("")
  const [filterImportance, setFilterImportance] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)

  const { data: memories, loading, error, reload } = useApi<Memory[]>(
    () => api.getMemories({
      q: searchMode === "keyword" ? query || undefined : undefined,
      source: filterSource || undefined,
      minImportance: filterImportance || undefined,
      limit: 50,
    }),
    [query, filterSource, filterImportance, searchMode],
  )

  const [semanticResults, setSemanticResults] = useState<Memory[] | null>(null)
  const [searching, setSearching] = useState(false)

  const handleSemanticSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const results = await api.searchMemories(query, { limit: 20 })
      setSemanticResults(results)
    } catch {
      setSemanticResults(null)
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("确定删除这条记忆吗？")) return
    await api.deleteMemory(id)
    reload()
  }

  const handleDeduplicate = async () => {
    const result = await api.deduplicate()
    alert(`去重完成: 合并 ${result.merged} 对, 删除 ${result.removed} 条`)
    reload()
  }

  const displayMemories = searchMode === "semantic" && semanticResults ? semanticResults : memories

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">记忆库</h1>
        <button
          onClick={handleDeduplicate}
          className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
        >
          去重整理
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="flex gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchMode === "semantic" && handleSemanticSearch()}
            placeholder={searchMode === "keyword" ? "关键词搜索..." : "语义搜索（自然语言）..."}
            className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={searchMode}
            onChange={(e) => { setSearchMode(e.target.value as "keyword" | "semantic"); setSemanticResults(null) }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="keyword">关键词</option>
            <option value="semantic">语义</option>
          </select>
          {searchMode === "semantic" && (
            <button
              onClick={handleSemanticSearch}
              disabled={searching}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              {searching ? "搜索中..." : "搜索"}
            </button>
          )}
        </div>
      </div>

      {/* 筛选器 */}
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1">
          来源:
          <input
            type="text"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            placeholder="全部"
            className="w-32 px-2 py-1 border rounded"
          />
        </label>
        <label className="flex items-center gap-1">
          最低重要性:
          <select
            value={filterImportance}
            onChange={(e) => setFilterImportance(Number(e.target.value))}
            className="px-2 py-1 border rounded"
          >
            <option value={0}>全部</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
            <option value={5}>5</option>
          </select>
        </label>
      </div>

      {/* 记忆列表 */}
      {loading ? (
        <p className="text-gray-500">加载中...</p>
      ) : error ? (
        <p className="text-red-500">加载失败: {error}</p>
      ) : !displayMemories || displayMemories.length === 0 ? (
        <p className="text-gray-400">暂无记忆</p>
      ) : (
        <div className="space-y-3">
          {displayMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              isEditing={editingId === memory.id}
              onEdit={() => setEditingId(editingId === memory.id ? null : memory.id)}
              onDelete={() => handleDelete(memory.id)}
              onSave={async (updates) => {
                await api.updateMemory(memory.id, updates)
                setEditingId(null)
                reload()
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function MemoryCard({
  memory,
  isEditing,
  onEdit,
  onDelete,
  onSave,
}: {
  memory: Memory
  isEditing: boolean
  onEdit: () => void
  onDelete: () => void
  onSave: (updates: Partial<Memory>) => Promise<void>
}) {
  const [editContent, setEditContent] = useState(memory.content)
  const [editSummary, setEditSummary] = useState(memory.summary)
  const [editImportance, setEditImportance] = useState(memory.importance)
  const [editTags, setEditTags] = useState(memory.tags.join(", "))

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-yellow-500 text-sm">{"★".repeat(memory.importance)}</span>
            <span className="text-xs text-gray-400">{memory.sourceLabel}</span>
            <span className="text-xs text-gray-400">
              {new Date(memory.updatedAt).toLocaleString()}
            </span>
          </div>

          {isEditing ? (
            <div className="space-y-2 mt-2">
              <input
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm"
                placeholder="摘要"
              />
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-2 py-1 border rounded text-sm h-24"
                placeholder="内容"
              />
              <div className="flex gap-2">
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded text-sm"
                  placeholder="标签（逗号分隔）"
                />
                <select
                  value={editImportance}
                  onChange={(e) => setEditImportance(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>重要性 {n}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSave({
                    content: editContent,
                    summary: editSummary,
                    importance: editImportance,
                    tags: editTags.split(",").map((t) => t.trim()).filter(Boolean),
                  })}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  保存
                </button>
                <button
                  onClick={onEdit}
                  className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="font-medium text-gray-800">{memory.summary || memory.content.slice(0, 100)}</p>
              {memory.summary && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-3">{memory.content}</p>
              )}
              {memory.tags.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {memory.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <div className="flex gap-1 ml-2">
            <button onClick={onEdit} className="px-2 py-1 text-xs text-gray-500 hover:text-blue-500">
              编辑
            </button>
            <button onClick={onDelete} className="px-2 py-1 text-xs text-gray-500 hover:text-red-500">
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
