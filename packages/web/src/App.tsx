import { useState } from "react"
import Dashboard from "./pages/Dashboard"
import MemoryLibrary from "./pages/MemoryLibrary"
import ImportCenter from "./pages/ImportCenter"
import ExportCenter from "./pages/ExportCenter"
import ProfileEditor from "./pages/ProfileEditor"
import AdapterManager from "./pages/AdapterManager"
import AIGenerate from "./pages/AIGenerate"
import Settings from "./pages/Settings"

type Page = "dashboard" | "memories" | "import" | "export" | "profile" | "adapters" | "generate" | "settings"

const NAV_ITEMS: Array<{ id: Page; label: string; section?: string }> = [
  { id: "dashboard", label: "Dashboard" },
  { id: "memories", label: "记忆库" },
  { id: "import", label: "导入中心" },
  { id: "export", label: "导出/注入" },
  { id: "generate", label: "AI 生成", section: "AI" },
  { id: "profile", label: "个人档案", section: "管理" },
  { id: "adapters", label: "适配器管理" },
  { id: "settings", label: "设置" },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard />
      case "memories": return <MemoryLibrary />
      case "import": return <ImportCenter />
      case "export": return <ExportCenter />
      case "profile": return <ProfileEditor />
      case "adapters": return <AdapterManager />
      case "generate": return <AIGenerate />
      case "settings": return <Settings />
    }
  }

  // 渲染带分组的导航
  let lastSection: string | undefined
  const navElements = NAV_ITEMS.map((item) => {
    const elements = []
    if (item.section && item.section !== lastSection) {
      elements.push(
        <div key={`section-${item.section}`} className="px-4 pt-4 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {item.section}
        </div>
      )
      lastSection = item.section
    }
    elements.push(
      <button
        key={item.id}
        onClick={() => setCurrentPage(item.id)}
        className={`w-full text-left px-4 py-2.5 text-sm transition ${
          currentPage === item.id
            ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500 font-medium"
            : "text-gray-600 hover:bg-gray-50"
        }`}
      >
        {item.label}
      </button>
    )
    return elements
  })

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 侧边栏 */}
      <nav className="w-56 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">AGILink</h1>
          <p className="text-xs text-gray-500 mt-0.5">智能记忆中心</p>
        </div>

        <div className="flex-1 py-2">
          {navElements}
        </div>

        <div className="p-3 border-t border-gray-200 text-xs text-gray-400">
          v0.1.0 | localhost:43210
        </div>
      </nav>

      {/* 主内容区 */}
      <main className="flex-1 overflow-y-auto">
        {renderPage()}
      </main>
    </div>
  )
}
