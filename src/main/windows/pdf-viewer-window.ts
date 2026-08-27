import { BrowserWindow, screen } from "electron"
import { join } from "path"
import icon from "../../../resources/icon.png?asset"
import { getSession, setupWindowSession } from "../ipc/session-registry.js"
import { PDFViewerSession } from "../sessions/pdf-viewer-session.js"
import { loadRoute } from "./load-route.js"
import { getMainWindow } from "./main-window.js"

let pdfViewerWindow: BrowserWindow | null = null
let hasArrangedWindows = false

export function getPdfViewerWindow(): BrowserWindow | null {
  if (pdfViewerWindow && !pdfViewerWindow.isDestroyed()) {
    return pdfViewerWindow
  }
  return null
}

export function getPdfViewerSession(): PDFViewerSession | undefined {
  const window = getPdfViewerWindow()
  if (!window) return undefined
  return getSession(window, PDFViewerSession)
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

    const pdfSession = getPdfViewerSession()
    if (!pdfSession) {
      return Promise.reject(new Error("PDFViewerSession not found"))
    }
    return pdfSession.loadFile(filePath)
  }

  pdfViewerWindow = new BrowserWindow({
    title: "PDF Viewer",
    width: 1000,
    height: 1400,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === "linux" ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, "../preload/index.js"),
      sandbox: false,
    },
  })

  pdfViewerWindow.on("closed", () => {
    pdfViewerWindow = null
  })

  if (!hasArrangedWindows) {
    arrangeWindows(pdfViewerWindow)
    hasArrangedWindows = true
  }

  loadRoute(pdfViewerWindow, "/pdfviewer")
  setupWindowSession(pdfViewerWindow)

  pdfViewerWindow.once("ready-to-show", () => pdfViewerWindow?.show())

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
      const pdfSession = getPdfViewerSession()
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

function arrangeWindows(pdfWindow: BrowserWindow): void {
  const agentWindow = getMainWindow()
  if (!agentWindow || agentWindow.isDestroyed()) return

  const agentBounds = agentWindow.getBounds()
  const display = screen.getDisplayMatching(agentBounds)

  const { x, y, width, height } = display.workArea

  // Windows 10/11 invisible shadow border offset. unit: pixels
  const winBorderMargin = process.platform === "win32" ? 7 : 0
  const winTopGap = process.platform === "win32" ? 2 : 0

  const leftWidth = Math.floor(width / 2)
  const rightWidth = width - leftWidth

  for (const win of [pdfWindow, agentWindow]) {
    if (win.isMaximized()) win.unmaximize()
  }

  // For the left window, expand to the left and down, 
  // and extend further to the right by the margin amount 
  // to offset the gap.
  pdfWindow.setBounds({
    x: x - winBorderMargin,
    y: y,
    width: leftWidth + winBorderMargin * 2,
    height: height + winBorderMargin + winTopGap
  })

  // For the right window, shift left to cover the gap; 
  // expand right and down.
  agentWindow.setBounds({
    x: x + leftWidth - winBorderMargin,
    y: y,
    width: rightWidth + winBorderMargin * 2,
    height: height + winBorderMargin + winTopGap
  })
}
