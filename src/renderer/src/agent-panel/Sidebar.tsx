import React from "react"

interface AgentSidebarProps {
  isExpanded: boolean
  onToggle: () => void
}

export function AgentSidebar({ isExpanded, onToggle }: AgentSidebarProps): React.JSX.Element {
  return (
    <div
      className={`flex flex-col bg-[#252526] border-r border-[#3c3c3c] transition-all duration-300 ease-in-out shrink-0 ${
        isExpanded ? "w-[260px]" : "w-[48px]"
      }`}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden"></div>

      <div
        className={`flex p-[8px] ${
          isExpanded ? "flex-row items-center justify-between" : "flex-col items-center gap-[8px]"
        }`}
      >
        <button
          onClick={() => window.api.common.openSettings()}
          title="设置"
          className="p-[6px] text-[#858585] hover:text-[#cccccc] hover:bg-[#3a3d41] rounded-[4px] transition-colors flex shrink-0"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-[18px] h-[18px]"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
          </svg>
        </button>

        <button
          onClick={onToggle}
          title={isExpanded ? "收起侧边栏" : "展开侧边栏"}
          className="p-[6px] text-[#858585] hover:text-[#cccccc] hover:bg-[#3a3d41] rounded-[4px] transition-colors flex shrink-0"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="w-[18px] h-[18px]"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="9" y1="3" x2="9" y2="21"></line>
            {isExpanded ? (
              <polyline points="15 9 12 12 15 15"></polyline>
            ) : (
              <polyline points="13 9 16 12 13 15"></polyline>
            )}
          </svg>
        </button>
      </div>
    </div>
  )
}
