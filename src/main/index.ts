import { app, shell, BrowserWindow, ipcMain } from "electron"
import { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import { AgentSession } from "./bridge/agent-session.js"
import { PDFViewerSession } from "./bridge/pdf-viewer-session.js"
import { sessions, setupWindowSession } from "./window-manager.js"

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: true,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  })
  loadRoute(mainWindow, "/")

  mainWindow.on("ready-to-show", () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"])
  } else {
    mainWindow.loadFile(join(__dirname, "../renderer/index.html"))
  }

  setupWindowSession(mainWindow)
}

function loadRoute(window: BrowserWindow, hashRoute: string = "/"): void {
  const formattedHash = hashRoute.startsWith("/") ? `#${hashRoute}` : `#/${hashRoute}`

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}${formattedHash}`)
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: hashRoute,
    })
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron")

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.on("backend-message", (event, message) => {
    handleBackendMessage(event, message)
  })

  ipcMain.on("agent:message", (event, message) => {
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

  ipcMain.on("pdfviewer:message", (event, message) => {
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

  createWindow()

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

function handleBackendMessage(event: Electron.IpcMainEvent, message: unknown): void {
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
