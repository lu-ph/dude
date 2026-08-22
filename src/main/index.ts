import { app, shell, BrowserWindow } from "electron"
import { join } from "path"
import { electronApp, optimizer, is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import { setupIpcRoutes } from "./ipc-router.js"
import { setupWindowSession } from "./window/window-manager.js"

function createWindow(): void {
  const mainWindow = new BrowserWindow({
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

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron")

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcRoutes()
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
