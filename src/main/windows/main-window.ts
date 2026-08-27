import { BrowserWindow, shell } from "electron"
import { join } from "path"
import icon from "../../../resources/icon.png?asset"
import { setupWindowSession } from "../ipc/session-registry.js"
import { loadRoute } from "./load-route.js"

let mainWindow: BrowserWindow | null = null

export function getMainWindow(): BrowserWindow | null {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow
  }
  return null
}

export function createMainWindow(): BrowserWindow {
  mainWindow = new BrowserWindow({
    title: "兄弟",
    width: 900,
    height: 670,
    show: false,
    alwaysOnTop: true,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  })

  mainWindow.on("ready-to-show", () => {
    mainWindow?.show()
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: "deny" }
  })

  loadRoute(mainWindow)
  setupWindowSession(mainWindow)

  return mainWindow
}
