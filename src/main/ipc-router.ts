import { ipcMain, BrowserWindow } from "electron"
import { sessions } from "./window/window-manager.js"
import { AgentSession } from "./bridge/agent-session.js"
import { PDFViewerSession } from "./bridge/pdf-viewer-session.js"

export function setupIpcRoutes(): void {
  ipcMain.on("common:renderer-to-main", (event, message) => {
    handleCommonMessage(event, message)
  })

  ipcMain.on("agent:renderer-to-main", (event, message) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const winSessions = sessions.get(win.id)
    if (!winSessions) return
    const agentSession = winSessions.find((s) => s instanceof AgentSession) as
      AgentSession | undefined
    if (agentSession) {
      agentSession.handleMessage(message)
    }
  })

  ipcMain.on("pdf:renderer-to-main", (event, message) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const winSessions = sessions.get(win.id)
    if (!winSessions) return
    const pdfSession = winSessions.find((s) => s instanceof PDFViewerSession) as
      PDFViewerSession | undefined
    if (pdfSession) {
      pdfSession.handleMessage(message)
    }
  })

  ipcMain.on("ping", () => console.log("pong"))
}

function handleCommonMessage(event: Electron.IpcMainEvent, message: unknown): void {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (!win) return

  const winSessions = sessions.get(win.id)
  if (!winSessions) return

  for (const session of winSessions) {
    if (session.handleMessage(message)) {
      break
    }
  }
}
