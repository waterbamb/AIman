/**
 * 首次使用引导横幅
 * 当未配置 API Key 时显示
 */
export function SetupBanner({ onGoSettings }: { onGoSettings: () => void }) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-amber-600 text-xl">!</span>
        <div className="text-sm">
          <p className="font-medium text-amber-800">尚未配置 API Key</p>
          <p className="text-amber-600">
            请先配置零克云 API Key 才能使用导入、搜索和 AI 生成功能。
            <a href="https://gpulink.cc" target="_blank" rel="noopener noreferrer" className="underline ml-1">
              前往零克云注册
            </a>
          </p>
        </div>
      </div>
      <button
        onClick={onGoSettings}
        className="px-4 py-1.5 text-sm bg-amber-500 text-white rounded-lg hover:bg-amber-600 whitespace-nowrap"
      >
        前往设置
      </button>
    </div>
  )
}
