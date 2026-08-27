import { ipcMain, BrowserWindow } from "electron"
import { sessions } from "./session-registry.js"
import { PDFViewerSession } from "../sessions/pdf-viewer-session.js"
import { AgentSession } from "../sessions/agent-session.js"
import { showSettingsWindow } from "../windows/settings-window.js"

export function setupIpcRoutes(): void {
  ipcMain.on("common:renderer-to-main", (event, message) => {
    handleCommonMessage(event, message)
  })

  ipcMain.on("agent:renderer-to-main", (event, message) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const agentSession = sessions
      .get(win.id)
      ?.find((s): s is AgentSession => s instanceof AgentSession)
    agentSession?.handleMessage(message)
  })

  ipcMain.on("pdf:renderer-to-main", (event, message) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win) return
    const pdfSession = sessions
      .get(win.id)
      ?.find((s): s is PDFViewerSession => s instanceof PDFViewerSession)
    pdfSession?.handleMessage(message)
  })

  ipcMain.on("ping", () => console.log("pong"))
  ipcMain.on("settings:open", (event) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined
    showSettingsWindow(parentWindow)
  })
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
