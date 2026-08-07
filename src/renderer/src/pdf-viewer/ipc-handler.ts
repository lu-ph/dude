import { PDFBackendToClientMessage, PDFClientToBackendMessage } from "../types/types"

export class PDFViewerIpcHandler {
  private onMessageCallback: ((msg: PDFBackendToClientMessage) => void) | null = null
  private cleanup: (() => void) | null = null

  constructor() {
    if (window.api?.pdfClientToBackendMessage) {
      this.cleanup = window.api.pdfClientToBackendMessage((msg: unknown) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(msg as PDFBackendToClientMessage)
        }
      })
    }
  }

  send(msg: PDFClientToBackendMessage): void {
    if (window.api?.pdfBackendToClientMessage) {
      window.api.pdfBackendToClientMessage(msg as unknown as PDFBackendToClientMessage)
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
