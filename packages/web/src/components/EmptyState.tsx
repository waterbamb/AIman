/**
 * 空状态占位组件
 */
export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-2xl text-gray-400">?</span>
      </div>
      <h3 className="text-lg font-medium text-gray-700">{title}</h3>
      <p className="text-sm text-gray-500 mt-1 text-center max-w-md">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
