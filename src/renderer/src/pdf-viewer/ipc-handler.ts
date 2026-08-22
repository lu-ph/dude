import { PDFBackendToClientMessage, PDFClientToBackendMessage } from "@renderer/types/pdf-types"

export class PDFViewerIpcHandler {
  private onMessageCallback: ((msg: PDFBackendToClientMessage) => void) | null = null
  private cleanup: (() => void) | null = null

  constructor() {
    if (window.api?.pdf?.onMessageFromMain) {
      this.cleanup = window.api.pdf.onMessageFromMain((msg: unknown) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(msg as PDFBackendToClientMessage)
        }
      })
    }
  }

  send(msg: PDFClientToBackendMessage): void {
    if (window.api?.pdf?.sendToMain) {
      window.api.pdf.sendToMain(msg)
    }
  }

  onMessage(callback: (msg: PDFBackendToClientMessage) => void): void {
    this.onMessageCallback = callback
  }

  destroy(): void {
    this.cleanup?.()
    this.cleanup = null
    this.onMessageCallback = null
  }
}
