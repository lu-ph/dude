import { JSX, useState } from "react"
import { ChatMessage } from "./types"

function formatToolMetadata(metadata: Record<string, unknown> | undefined): string | undefined {
  if (!metadata) return undefined

  const serialized = JSON.stringify(metadata, null, 2)
  return serialized.startsWith("{") && serialized.endsWith("}")
    ? serialized.slice(1, -1).trim()
    : serialized
}

export function ToolMessageCard({ msg }: { msg: ChatMessage }): JSX.Element {
  const [expanded, setExpanded] = useState(false)
  const formattedMetadata = formatToolMetadata(msg.metadata)

  return (
    <div className="flex flex-col w-full">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-[14px] text-[#6b6a6a] hover:text-[#999999] transition-colors w-fit font-sans focus:outline-none"
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
        <pre className="mt-1 text-[13px] bg-[#1e1e1e] p-[10px] rounded-[6px] border border-[#3c3c3c] whitespace-pre-wrap break-all text-[#b8b8b8] font-sans leading-relaxed">
          {formattedMetadata}
        </pre>
      )}
    </div>
  )
}
