import { BrowserWindow } from "electron"
import { join } from "path"
import { is } from "@electron-toolkit/utils"

export function loadRoute(window: BrowserWindow, hashRoute: string = "/"): void {
  const formattedHash = hashRoute.startsWith("/") ? `#${hashRoute}` : `#/${hashRoute}`

  if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    window.loadURL(`${process.env["ELECTRON_RENDERER_URL"]}${formattedHash}`)
  } else {
    window.loadFile(join(__dirname, "../renderer/index.html"), {
      hash: hashRoute,
    })
  }
}
