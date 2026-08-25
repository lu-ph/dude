import React, { useEffect } from "react"

interface MessagePopupProps {
  message: string | null
  onClose: () => void
}

export function MessagePopup({ message, onClose }: MessagePopupProps): React.JSX.Element | null {
  useEffect(() => {
    if (!message) return

    const timer = window.setTimeout(onClose, 5000)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  return (
    <div className="fixed bottom-4 right-4 z-100 w-[min(420px,calc(100vw-32px))] border border-[#f14c4c]/60 bg-[#3a1d1d] px-4 py-3 pr-10 text-[14px] leading-relaxed text-[#f8caca] shadow-2xl">
      <button
        type="button"
        aria-label="关闭错误消息"
        onClick={onClose}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center text-[18px] leading-none text-[#f8caca] transition-colors hover:text-white"
      >
        ×
      </button>
      <div className="wrap-break-word whitespace-pre-wrap">{message}</div>
    </div>
  )
}
