import { BrowserWindow } from "electron"
import { join } from "path"
import { is } from "@electron-toolkit/utils"
import icon from "../../../resources/icon.png?asset"
import { setupWindowSession } from "./window-manager.js"

let settingsWindow: BrowserWindow | null = null

function loadSettingsRoute(window: BrowserWindow): void {
  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}#/settings`)
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"), { hash: "/settings" })
  }
}

export function showSettingsWindow(parentWindow?: BrowserWindow): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show()
    settingsWindow.focus()
    return
  }

  settingsWindow = new BrowserWindow({
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

  loadSettingsRoute(settingsWindow)
  setupWindowSession(settingsWindow, { createAgent: false })
}
