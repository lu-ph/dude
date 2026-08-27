import { BrowserWindow } from "electron"
import { join } from "path"
import icon from "../../../resources/icon.png?asset"
import { setupWindowSession } from "../ipc/session-registry.js"
import { loadRoute } from "./load-route.js"

let settingsWindow: BrowserWindow | null = null

export function showSettingsWindow(parentWindow?: BrowserWindow): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
    title: "设置",
    width: 520,
    height: 500,
    resizable: false,
    show: false,
    alwaysOnTop: true,
    parent: parentWindow,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  })

  settingsWindow.once("ready-to-show", () => settingsWindow?.show())
  settingsWindow.on("closed", () => {
    settingsWindow = null
  })

  loadRoute(settingsWindow, "/settings")
  setupWindowSession(settingsWindow, { createAgent: false })
}
