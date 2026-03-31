import { useState } from "react"
import { api, type Memory } from "../api"
import { useApi } from "../hooks/useApi"
import { useToast } from "../components/Toast"
import { useConfirm } from "../components/ConfirmDialog"
import { EmptyState } from "../components/EmptyState"

const PAGE_SIZE = 20

export default function MemoryLibrary() {
  const { toast } = useToast()
  const { confirm, dialog } = useConfirm()
  const [query, setQuery] = useState("")
  const [searchMode, setSearchMode] = useState<"keyword" | "semantic">("keyword")
  const [filterSource, setFilterSource] = useState("")
  const [filterImportance, setFilterImportance] = useState(0)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [isDeduplicating, setIsDeduplicating] = useState(false)

  const { data: memories, loading, error, reload } = useApi<Memory[]>(
    () => api.getMemories({
      q: searchMode === "keyword" ? query || undefined : undefined,
      source: filterSource || undefined,
      minImportance: filterImportance || undefined,
      limit: PAGE_SIZE,
    }),
    [query, filterSource, filterImportance, searchMode, page],
  )

  const [semanticResults, setSemanticResults] = useState<Memory[] | null>(null)
  const [searching, setSearching] = useState(false)

  const handleSemanticSearch = async () => {
    if (!query.trim()) return
    setSearching(true)
    try {
      const results = await api.searchMemories(query, { limit: 20 })
      setSemanticResults(results)
    } catch (err) {
      toast(err instanceof Error ? err.message : "语义搜索失败，请检查 API Key 配置", "error")
      setSemanticResults(null)
    } finally {
      setSearching(false)
    }
  }

  const handleDelete = async (id: string) => {
    const ok = await confirm("删除记忆", "删除后无法恢复，确定要删除这条记忆吗？", true)
    if (!ok) return
    try {
      await api.deleteMemory(id)
      toast("已删除", "success")
      reload()
    } catch {
      toast("删除失败", "error")
    }
  }

  const handleDeduplicate = async () => {
    setIsDeduplicating(true)
    try {
      const result = await api.deduplicate()
      toast(`去重完成: 合并 ${result.merged} 对, 删除 ${result.removed} 条`, "success")
      reload()
    } catch (err) {
      toast(err instanceof Error ? err.message : "去重失败", "error")
    } finally {
      setIsDeduplicating(false)
    }
  }

  const displayMemories = searchMode === "semantic" && semanticResults ? semanticResults : memories
  const resultCount = displayMemories?.length ?? 0

  return (
    <div className="p-6 space-y-4">
      {dialog}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold text-gray-900">记忆库</h1>
        <button
          onClick={handleDeduplicate}
          disabled={isDeduplicating}
          className="px-3 py-1.5 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50"
        >
          {isDeduplicating ? "整理中..." : "去重整理"}
        </button>
      </div>

      {/* 搜索栏 */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSemanticResults(null) }}
            onKeyDown={(e) => e.key === "Enter" && searchMode === "semantic" && handleSemanticSearch()}
            placeholder={searchMode === "keyword" ? "关键词搜索..." : "输入自然语言查询..."}
            className="flex-1 min-w-0 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <select
            value={searchMode}
            onChange={(e) => { setSearchMode(e.target.value as "keyword" | "semantic"); setSemanticResults(null) }}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="keyword">关键词</option>
            <option value="semantic">语义</option>
          </select>
        </div>
        {searchMode === "semantic" && (
          <button
            onClick={handleSemanticSearch}
            disabled={searching || !query.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {searching ? "搜索中..." : "搜索"}
          </button>
        )}
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-3 text-sm">
        <label className="flex items-center gap-1">
          来源:
          <input
            type="text"
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            placeholder="全部"
            className="w-28 px-2 py-1 border rounded"
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
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n}+ {"★".repeat(n)}</option>
            ))}
          </select>
        </label>
        {!loading && (
          <span className="text-gray-400 self-center">
            共 {resultCount} 条{resultCount === PAGE_SIZE ? "（可能有更多）" : ""}
          </span>
        )}
      </div>

      {/* 记忆列表 */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          加载失败: {error}
        </div>
      ) : !displayMemories || displayMemories.length === 0 ? (
        <EmptyState
          title={query ? "未找到匹配的记忆" : "记忆库为空"}
          description={query ? "尝试换个关键词搜索，或切换到语义搜索模式" : "通过导入中心添加你的第一条记忆"}
        />
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
                try {
                  await api.updateMemory(memory.id, updates)
                  setEditingId(null)
                  toast("记忆已更新", "success")
                  reload()
                } catch {
                  toast("更新失败", "error")
                }
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
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-yellow-500 text-sm shrink-0" title={`重要性 ${memory.importance}/5`}>
              {"★".repeat(memory.importance)}{"☆".repeat(5 - memory.importance)}
            </span>
            <span className="text-xs text-gray-400 truncate">{memory.sourceLabel}</span>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {new Date(memory.updatedAt).toLocaleDateString()}
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
              <div className="flex flex-wrap gap-2">
                <input
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="flex-1 min-w-[150px] px-2 py-1 border rounded text-sm"
                  placeholder="标签（逗号分隔，如：工作, 学习）"
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
              <p className="font-medium text-gray-800 break-words">
                {memory.summary || memory.content.slice(0, 100)}
              </p>
              {memory.summary && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-3 break-words">{memory.content}</p>
              )}
              {memory.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
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
          <div className="flex gap-1 shrink-0">
            <button onClick={onEdit} className="px-2 py-1 text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded">
              编辑
            </button>
            <button onClick={onDelete} className="px-2 py-1 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded">
              删除
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
