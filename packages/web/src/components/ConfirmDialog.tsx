import { useState, type ReactNode } from "react"

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string | ReactNode
  confirmText?: string
  cancelText?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确定",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && onCancel()}
      >
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <div className="mt-2 text-sm text-gray-600">{message}</div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm text-white rounded-lg ${
              danger
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Hook 式确认对话框
 */
export function useConfirm() {
  const [state, setState] = useState<{
    open: boolean
    title: string
    message: string
    danger: boolean
    resolve: ((value: boolean) => void) | null
  }>({ open: false, title: "", message: "", danger: false, resolve: null })

  const confirm = (title: string, message: string, danger = false): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ open: true, title, message, danger, resolve })
    })
  }

  const dialog = (
    <ConfirmDialog
      open={state.open}
      title={state.title}
      message={state.message}
      danger={state.danger}
      confirmText={state.danger ? "删除" : "确定"}
      onConfirm={() => { state.resolve?.(true); setState((s) => ({ ...s, open: false })) }}
      onCancel={() => { state.resolve?.(false); setState((s) => ({ ...s, open: false })) }}
    />
  )

  return { confirm, dialog }
}
