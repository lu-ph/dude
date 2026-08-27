import { BrowserWindow } from "electron"
import { PDFViewerSession } from "../sessions/pdf-viewer-session.js"
import type { BaseSession } from "../types/session.js"
import { AgentSession } from "../sessions/agent-session.js"

export const sessions = new Map<number, BaseSession[]>()

export function setupWindowSession(
  window: BrowserWindow,
  options: { createAgent?: boolean } = {},
): void {
  const agentSession = new AgentSession(
    {
      send: (message) => {
        if (!window.isDestroyed()) {
          window.webContents.send("agent:main-to-renderer", message)
        }
      },
    },
    options.createAgent ?? true,
  )

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

export function getSession<T extends BaseSession>(
  window: BrowserWindow,
  SessionClass: new (...args: never[]) => T,
): T | undefined {
  const winSessions = sessions.get(window.id)
  if (!winSessions) return undefined
  return winSessions.find((s): s is T => s instanceof SessionClass)
}
