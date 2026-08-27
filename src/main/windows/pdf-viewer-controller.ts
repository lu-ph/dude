import type { BrowserWindow } from "electron"
import type { PDFViewerSession } from "../sessions/pdf-viewer-session.js"
import { getPdfViewerSession, getPdfViewerWindow } from "./pdf-viewer-window.js"

function checkPdfViewerAvailable(): { window: BrowserWindow; session: PDFViewerSession } {
  const window = getPdfViewerWindow()
  const session = getPdfViewerSession()

  if (!window || !session) {
    throw new Error("PDF Viewer window is not available")
  }

  return { window, session }
}

export async function captureScreenshot(): Promise<string> {
  const { window, session } = checkPdfViewerAvailable()

  await session.waitForPageReady(1)

  const image = await window.webContents.capturePage()
  return image.toPNG().toString("base64")
}

export async function jumpToPage(pageNum: number): Promise<string> {
  const { window, session } = checkPdfViewerAvailable()

  const pageReady = session.waitForPageReady(pageNum)
  session.jumpToPage(pageNum)
  await pageReady

  const image = await window.webContents.capturePage()
  return image.toPNG().toString("base64")
}

export async function nextPage(): Promise<string> {
  const { window, session } = checkPdfViewerAvailable()

  const pageReady = session.waitForPageReady()
  session.nextPage()
  await pageReady

  const image = await window.webContents.capturePage()
  return image.toPNG().toString("base64")
}

export async function previousPage(): Promise<string> {
  const { window, session } = checkPdfViewerAvailable()

  const pageReady = session.waitForPageReady()
  session.previousPage()
  await pageReady

  const image = await window.webContents.capturePage()
  return image.toPNG().toString("base64")
}
