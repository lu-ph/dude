import React, { useEffect, useState } from "react"

export function AgentSettingsPanel(): React.JSX.Element {
  const [apiKey, setApiKey] = useState("")
  const [modelName, setModelName] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [configStatus, setConfigStatus] = useState<string | null>(null)
  const [showApiKey, setShowApiKey] = useState(false)

  useEffect(() => {
    const cleanup = window.api.agent.onMessageFromMain((message) => {
      if (message.type === "agent:env_config") {
        setApiKey(message.payload.config.apiKey)
        setModelName(message.payload.config.modelName)
        setBaseUrl(message.payload.config.baseUrl)
      }

      if (message.type === "agent:env_check_result") {
        setConfigStatus(message.payload.valid ? null : "少了点什么")
      }

      if (message.type === "agent:env_updated" && !message.payload.success) {
        setConfigStatus(message.payload.error || "配置保存失败")
      }

      if (message.type === "agent:env_updated" && message.payload.success) {
        setConfigStatus("配置已保存。")
      }
    })

    window.api.agent.sendToMain({ type: "agent:load_env_from_json", payload: {} })
    window.api.agent.sendToMain({ type: "agent:check_env", payload: {} })

    return cleanup
  }, [])

  const handleApply = (): void => {
    const config = {
      apiKey: apiKey.trim(),
      modelName: modelName.trim(),
      baseUrl: baseUrl.trim(),
    }

    setConfigStatus(null)
    window.api.agent.sendToMain({ type: "agent:set_llm_env_json", payload: { config } })
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#252526] p-6 text-[#cccccc] font-sans">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col">
        <div className="flex items-center justify-between pb-5">
          <h2 className="text-[#e1e1e1] text-[15px] font-semibold tracking-wide">设置</h2>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-[20px]">
          {configStatus && (
            <div className="flex items-start gap-[10px] text-[#34b7f4] text-[13px] leading-relaxed">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="w-[16px] h-[16px] shrink-0 mt-[2px]"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <span>{configStatus}</span>
            </div>
          )}

          {/* API Key */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="apiKey"
              className="text-[#a3a3a3] text-[16px] font-medium cursor-pointer"
            >
              API Key
            </label>
            <div className="relative flex items-center">
              <input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-[#1e1e1e] border border-[#3c3c3c] text-[#cccccc] text-[16px] px-[12px] py-[8px] pr-[36px] rounded-[6px] outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]/50 transition-all placeholder:text-[#555555]"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-[8px] text-[#858585] hover:text-[#cccccc] p-1 rounded transition-colors"
                title={showApiKey ? "隐藏" : "显示"}
              >
                {showApiKey ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-[16px] h-[16px]"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    className="w-[16px] h-[16px]"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Model Name */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="modelName"
              className="text-[#a3a3a3] text-[16px] font-medium cursor-pointer"
            >
              Model Name
            </label>
            <input
              id="modelName"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="model name used by api"
              className="bg-[#1e1e1e] border border-[#3c3c3c] text-[#cccccc] text-[16px] px-[12px] py-[8px] rounded-[6px] outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]/50 transition-all placeholder:text-[#555555]"
            />
          </div>

          {/* Base URL */}
          <div className="flex flex-col gap-[8px]">
            <label
              htmlFor="baseUrl"
              className="text-[#a3a3a3] text-[16px] font-medium cursor-pointer"
            >
              Base URL
            </label>
            <input
              id="baseUrl"
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="e.g. https://openrouter.ai/api"
              className="bg-[#1e1e1e] border border-[#3c3c3c] text-[#cccccc] text-[16px] px-[12px] py-[8px] rounded-[6px] outline-none focus:border-[#007acc] focus:ring-1 focus:ring-[#007acc]/50 transition-all placeholder:text-[#555555]"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto flex justify-end gap-[12px] pt-6">
          <button
            onClick={() => window.close()}
            className="h-9 min-w-[88px] px-4 py-2 text-[13px] font-medium text-[#cccccc] bg-transparent hover:bg-[#3c3c3c] border border-[#4c4c4c] rounded-[6px] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleApply}
            className="h-9 min-w-[88px] px-4 py-2 text-[13px] font-medium text-white bg-[#0e639c] hover:bg-[#1177bb] active:bg-[#0d598c] rounded-[6px] shadow-sm transition-colors flex items-center justify-center"
          >
            应用
          </button>
        </div>
      </div>
    </div>
  )
}
