import { app, BrowserWindow } from "electron"
import { electronApp, optimizer } from "@electron-toolkit/utils"
import { setupIpcRoutes } from "./ipc/router.js"
import { createMainWindow } from "./windows/main-window.js"

app.whenReady().then(() => {
  electronApp.setAppUserModelId("com.electron")

  app.on("browser-window-created", (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  setupIpcRoutes()
  createMainWindow()

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})
