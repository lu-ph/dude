import { BrowserWindow } from "electron"
import { join } from "path"
import { is } from "@electron-toolkit/utils"
import icon from "../../resources/icon.png?asset"
import { setupWindowSession, sessions } from "./window-manager.js"
import { PDFViewerSession } from "./bridge/pdf-viewer-session.js"

let pdfViewerWindow: BrowserWindow | null = null

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

function getPdfSession(window: BrowserWindow): PDFViewerSession | undefined {
  const winSessions = sessions.get(window.id)
  if (!winSessions) return undefined
  return winSessions.find((s): s is PDFViewerSession => s instanceof PDFViewerSession)
}

export function showPdfViewer(filePath: string): Promise<void> {
  if (pdfViewerWindow && !pdfViewerWindow.isDestroyed()) {
    if (!pdfViewerWindow.isVisible()) {
      pdfViewerWindow.show()
    }
    if (pdfViewerWindow.isMinimized()) {
      pdfViewerWindow.restore()
    }
    pdfViewerWindow.focus()
    const pdfSession = getPdfSession(pdfViewerWindow)
    if (!pdfSession) {
      return Promise.reject(new Error("PDFViewerSession not found"))
    }
    return pdfSession.loadFile(filePath)
  }

  pdfViewerWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    show: true,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  })

  loadRoute(pdfViewerWindow, "/pdfviewer")
  setupWindowSession(pdfViewerWindow)

  return new Promise<void>((resolve, reject) => {
    const consoleErrors: string[] = []

    const onConsoleMessage = (_event: Electron.Event, level: number, message: string): void => {
      if (level === 3) {
        consoleErrors.push(message)
      }
    }
    pdfViewerWindow!.webContents.on("console-message", onConsoleMessage)

    const cleanup = (): void => {
      pdfViewerWindow!.webContents.removeListener("console-message", onConsoleMessage)
      pdfViewerWindow!.webContents.removeListener("did-finish-load", onLoad)
      pdfViewerWindow!.webContents.removeListener("did-fail-load", onFail)
    }

    const onLoad = (): void => {
      const pdfSession = getPdfSession(pdfViewerWindow!)
      if (!pdfSession) {
        cleanup()
        reject(new Error("PDFViewerSession not found"))
        return
      }

      pdfSession
        .loadFile(filePath)
        .then(() => {
          cleanup()
          if (consoleErrors.length > 0) {
            reject(new Error(`PDF viewer console errors: ${consoleErrors.join("; ")}`))
          } else {
            resolve()
          }
        })
        .catch((err) => {
          cleanup()
          reject(err)
        })
    }

    const onFail = (_event: Electron.Event, errorCode: number, errorDescription: string): void => {
      cleanup()
      reject(new Error(`Failed to load PDF viewer: ${errorDescription} (code: ${errorCode})`))
    }

    pdfViewerWindow!.webContents.on("did-finish-load", onLoad)
    pdfViewerWindow!.webContents.on("did-fail-load", onFail)
  })
}
