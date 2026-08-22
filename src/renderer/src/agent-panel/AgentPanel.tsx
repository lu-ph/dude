import React, { useState, useEffect, useRef } from "react"
import ReactMarkdown from "react-markdown"
import { AgentIpcHandler } from "./ipc-handler"
import { AgentBackendToClientMessage } from "@renderer/types/agent-types"
import remarkGfm from "remark-gfm"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"
import { ChatMessage } from "./types"
import { ToolMessageCard } from "./ToolMessageCard"
import { getToolDisplayName } from "./tool-name-map"

export function AgentPanel(): React.JSX.Element {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isWaitingPrompt, setIsWaitingPrompt] = useState(true)

  const handlerRef = useRef<AgentIpcHandler | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const streamingMessageIdRef = useRef<string | null>(null)

  const scrollToBottom = (): void => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    handlerRef.current = new AgentIpcHandler()

    const handleMessage = (msg: AgentBackendToClientMessage): void => {
      switch (msg.type) {
        case "agent:text_delta": {
          const delta = msg.payload.text || ""
          if (!delta) break

          if (!streamingMessageIdRef.current) {
            const newId = `stream-${Date.now()}`
            streamingMessageIdRef.current = newId

            setMessages((prev) => [
              ...prev,
              {
                id: newId,
                role: "agent",
                content: delta,
              },
            ])
          } else {
            const currentId = streamingMessageIdRef.current

            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentId
                  ? {
                      ...m,
                      content: m.content + delta,
                    }
                  : m,
              ),
            )
          }
          break
        }

        case "agent:tool_call":
          streamingMessageIdRef.current = null

          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "tool",
              content: getToolDisplayName(msg.payload.name),
              metadata: msg.payload.input,
            },
          ])
          break

        case "agent:final":
          streamingMessageIdRef.current = null
          setMessages((prev) => [
            ...prev,
            {
              id: Date.now().toString(),
              role: "system",
              content: `[完成] 状态: ${msg.payload.success ? "成功" : "失败 (或被中断)"} | 耗时: ${msg.payload.duration} | 消耗: ${msg.payload.cost}`,
            },
          ])
          setIsWaitingPrompt(true)
          break

        case "agent:error":
          streamingMessageIdRef.current = null
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "error", content: msg.payload.error },
          ])
          setIsWaitingPrompt(true)
          break

        case "agent:system":
          setMessages((prev) => [
            ...prev,
            { id: Date.now().toString(), role: "system", content: msg.payload.message },
          ])
          break

        case "agent:wait_for_prompt":
          setIsWaitingPrompt(true)
          break
      }
    }

    handlerRef.current.onMessage(handleMessage)

    return () => {
      handlerRef.current?.destroy()
      handlerRef.current = null
    }
  }, [])

  const handleSend = (): void => {
    const trimmed = inputValue.trim()
    if (!trimmed || !handlerRef.current || !isWaitingPrompt) return

    setMessages((prev) => [...prev, { id: Date.now().toString(), role: "user", content: trimmed }])
    setInputValue("")
    setIsWaitingPrompt(false)

    handlerRef.current.send({ type: "agent:chat_request", payload: { prompt: trimmed } })
  }

  const handleInterrupt = (): void => {
    if (!handlerRef.current || isWaitingPrompt) return

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), role: "system", content: "正在尝试中断当前操作..." },
    ])

    handlerRef.current.send({
      type: "agent:chat_interrupt",
      payload: { content: "User interrupted" },
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#1e1e1e] text-[#cccccc] font-sans">
      <div className="flex-1 overflow-y-auto p-[16px] [::-webkit-scrollbar]:w-[8px] [::-webkit-scrollbar-track]:bg-[#1e1e1e] [::-webkit-scrollbar-thumb]:bg-[#424242] [::-webkit-scrollbar-thumb]:rounded-[4px]">
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-[10px]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col w-full ${
                msg.role === "user" ? "items-end" : "items-start"
              }`}
            >
              {msg.role === "system" && (
                <div className="text-[12px] text-[#858585] bg-[#2d2d2d] px-[8px] py-[4px] rounded-[4px] self-center my-[4px]">
                  {msg.content}
                </div>
              )}

              {msg.role === "error" && (
                <div className="text-[13px] text-[#f14c4c] bg-[#3a1d1d] px-[12px] py-[8px] rounded-[6px] border border-[#f14c4c]/30 mt-1">
                  {msg.content}
                </div>
              )}

              {msg.role === "tool" && <ToolMessageCard msg={msg} />}

              {msg.role === "user" && (
                <div className="bg-[#2d2d2d] text-[#e1e1e1] px-[14px] py-[10px] rounded-[12px] rounded-br-[4px] max-w-[85%] text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              )}

              {msg.role === "agent" && (
                <div className="w-full text-[14px] leading-relaxed break-words text-[#cccccc] [&>p]:mb-[8px] last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:ml-5 [&>ul]:mb-[8px] [&>ol]:list-decimal [&>ol]:ml-5 [&>ol]:mb-[8px] [&>pre]:bg-[#252526] [&>pre]:p-3 [&>pre]:rounded-md [&>pre]:mb-[8px] [&>code]:bg-[#252526] [&>code]:px-1 [&>code]:rounded [&>table]:w-full [&>table]:border-collapse [&>table]:mb-[8px] [&>table>thead>tr>th]:border [&>table>thead>tr>th]:border-[#3c3c3c] [&>table>thead>tr>th]:px-3 [&>table>thead>tr>th]:py-2 [&>table>thead>tr>th]:bg-[#252526] [&>table>thead>tr>th]:text-left [&>table>tbody>tr>td]:border [&>table>tbody>tr>td]:border-[#3c3c3c] [&>table>tbody>tr>td]:px-3 [&>table>tbody>tr>td]:py-2 [&>hr]:my-[24px] [&>hr]:border-[#3c3c3c] [&>hr]:border-t">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[rehypeKatex]}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} className="h-[10px]" />
        </div>
      </div>

      <div className="shrink-0 bg-transparent p-[16px] pb-[24px]">
        <div className="max-w-3xl mx-auto relative flex items-end bg-[#252526] border border-[#3c3c3c] rounded-[12px] shadow-lg transition-colors">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isWaitingPrompt ? "输入指令 (Enter 发送, Shift+Enter 换行)..." : "Agent 正在处理中..."
            }
            rows={2}
            className="w-full max-h-[150px] min-h-[56px] bg-transparent text-[#cccccc] text-[14px] px-[14px] py-[12px] resize-none outline-none overflow-y-auto [::-webkit-scrollbar]:w-[6px] [::-webkit-scrollbar-thumb]:bg-[#424242] [::-webkit-scrollbar-thumb]:rounded-[3px]"
            disabled={!isWaitingPrompt}
          />

          {isWaitingPrompt ? (
            <button
              onClick={handleSend}
              disabled={!inputValue.trim()}
              title="发送"
              className="p-[12px] text-[#0e639c] hover:text-[#1177bb] disabled:text-[#4d4d4d] transition-colors shrink-0 mb-[2px]"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="w-[20px] h-[20px]"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          ) : (
            <button
              onClick={handleInterrupt}
              title="中断"
              className="p-[12px] text-[#f14c4c] hover:text-[#ff6b6b] transition-colors shrink-0 mb-[2px] animate-pulse hover:animate-none"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-[20px] h-[20px]">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default AgentPanel
