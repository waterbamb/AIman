import { useState, useEffect } from "react"
import { ToastProvider } from "./components/Toast"
import { SetupBanner } from "./components/SetupBanner"
import { api, type Settings } from "./api"
import Dashboard from "./pages/Dashboard"
import MemoryLibrary from "./pages/MemoryLibrary"
import ImportCenter from "./pages/ImportCenter"
import ExportCenter from "./pages/ExportCenter"
import ProfileEditor from "./pages/ProfileEditor"
import AdapterManager from "./pages/AdapterManager"
import AIGenerate from "./pages/AIGenerate"
import SettingsPage from "./pages/Settings"

type Page = "dashboard" | "memories" | "import" | "export" | "profile" | "adapters" | "generate" | "settings"

const NAV_ITEMS: Array<{ id: Page; label: string; group: string }> = [
  { id: "dashboard", label: "Dashboard", group: "概览" },
  { id: "memories", label: "记忆库", group: "概览" },
  { id: "import", label: "导入中心", group: "数据" },
  { id: "export", label: "导出", group: "数据" },
  { id: "generate", label: "AI 生成", group: "AI" },
  { id: "profile", label: "个人档案", group: "管理" },
  { id: "adapters", label: "适配器", group: "管理" },
  { id: "settings", label: "设置", group: "管理" },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [apiKeyConfigured, setApiKeyConfigured] = useState<boolean | null>(null)

  // 检查 API Key 配置状态
  useEffect(() => {
    api.getSettings()
      .then((s: Settings) => setApiKeyConfigured(s.gpulink.apiKeyConfigured))
      .catch(() => setApiKeyConfigured(false))
  }, [currentPage])

  const navigate = (page: Page) => {
    setCurrentPage(page)
    setSidebarOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard": return <Dashboard onNavigate={navigate} />
      case "memories": return <MemoryLibrary />
      case "import": return <ImportCenter />
      case "export": return <ExportCenter />
      case "profile": return <ProfileEditor />
      case "adapters": return <AdapterManager />
      case "generate": return <AIGenerate />
      case "settings": return <SettingsPage />
    }
  }

  // 分组渲染导航
  const groups = [...new Set(NAV_ITEMS.map((i) => i.group))]

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-100 flex">
        {/* 移动端遮罩 */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 侧边栏 */}
        <nav className={`
          fixed md:static inset-y-0 left-0 z-40
          w-56 bg-white shadow-sm border-r border-gray-200 flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}>
          <div className="p-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">AGILink</h1>
            <p className="text-xs text-gray-500 mt-0.5">智能记忆中心</p>
          </div>

          <div className="flex-1 py-2 overflow-y-auto">
            {groups.map((group) => (
              <div key={group}>
                <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  {group}
                </div>
                {NAV_ITEMS.filter((i) => i.group === group).map((item) => (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.id)}
                    className={`w-full text-left px-4 py-2 text-sm transition ${
                      currentPage === item.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-500 font-medium"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            ))}
          </div>

          <div className="p-3 border-t border-gray-200 text-xs text-gray-400">
            v0.1.0
          </div>
        </nav>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* 移动端顶栏 */}
          <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 text-gray-600"
              aria-label="打开菜单"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <span className="font-semibold text-gray-800">AGILink</span>
          </div>

          {/* API Key 未配置引导 */}
          {apiKeyConfigured === false && (
            <SetupBanner onGoSettings={() => navigate("settings")} />
          )}

          {/* 页面内容 */}
          <main className="flex-1 overflow-y-auto">
            {renderPage()}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
