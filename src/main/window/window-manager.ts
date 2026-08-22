import { BrowserWindow } from "electron"
import { AgentSession } from "../bridge/agent-session.js"
import { PDFViewerSession } from "../bridge/pdf-viewer-session.js"
import type { BaseSession } from "../types/interface/session.js"

export const sessions = new Map<number, BaseSession[]>()

export function setupWindowSession(window: BrowserWindow): void {
  const agentSession = new AgentSession({
    send: (message) => {
      if (!window.isDestroyed()) {
        window.webContents.send("agent:main-to-renderer", message)
      }
    },
  })

  const pdfSession = new PDFViewerSession({
    send: (message) => {
      if (!window.isDestroyed()) {
        window.webContents.send("pdf:main-to-renderer", message)
      }
    },
  })

  sessions.set(window.id, [agentSession, pdfSession])

  window.on("closed", () => {
    const winSessions = sessions.get(window.id)
    if (winSessions) {
      winSessions.forEach((s) => s.destroy())
      sessions.delete(window.id)
    }
  })
}
