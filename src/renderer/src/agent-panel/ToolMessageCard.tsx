import { JSX, useState } from "react"
import { ChatMessage } from "./types"

export function ToolMessageCard({ msg }: { msg: ChatMessage }): JSX.Element {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="flex flex-col w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[13px] text-[#c586c0] hover:text-[#d197d1] transition-colors w-fit font-mono focus:outline-none"
      >
        <span className="font-semibold">{msg.content}</span>
        <svg
          className={`w-[14px] h-[14px] transition-transform duration-200 ${
            expanded ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <pre className="mt-1 text-[12px] bg-[#1e1e1e] p-[10px] rounded-[6px] border border-[#3c3c3c] whitespace-pre-wrap break-all text-[#9cdcfe] font-mono">
          {typeof msg.metadata === "object" ? JSON.stringify(msg.metadata, null, 2) : msg.metadata}
        </pre>
      )}
    </div>
  )
}
