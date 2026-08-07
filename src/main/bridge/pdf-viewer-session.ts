import { readFile } from "node:fs/promises"
import { BaseSession } from "../types/interface/session"

interface IpcClient {
  send(message: unknown): void
}

export class PDFViewerSession implements BaseSession {
  private client: IpcClient

  constructor(client: IpcClient) {
    this.client = client
  }

  public async loadFile(filePath: string): Promise<void> {
    try {
      const buffer = await this.getPDFBuffer(filePath)
      this.sendPdfBuffer(buffer)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      this.sendError(message)
      throw error
    }
  }

  public async handleMessage(data: any): Promise<boolean> {
    return false
  }

  private sendToClient(content: unknown): void {
    this.client.send(content)
  }

  private sendPdfBuffer(buffer: Buffer): void {
    this.client.send({ type: "pdf:buffer", payload: { buffer: buffer.toString("base64") } })
  }

  private async getPDFBuffer(path: string): Promise<Buffer> {
    try {
      const pdfBuffer: Buffer = await readFile(path)
      return pdfBuffer
    } catch (error) {
      console.log(`Error getting PDF buffer: ${error}`)
      throw new Error(`Error getting PDF buffer: ${error}`)
    }
  }

  public jumpToPage(pageNum: number): void {
    this.sendToClient({
      type: "pdf:jump_to_page",
      payload: { pageNum: pageNum },
    })
  }

  public nextPage(): void {
    this.sendToClient({
      type: "pdf:next_page",
      payload: {},
    })
  }

  public previousPage(): void {
    this.sendToClient({
      type: "pdf:previous_page",
      payload: {},
    })
  }

  private sendError(message: string): void {
    this.sendToClient({
      type: "pdf:error",
      payload: { error: message },
    })
  }

  public destroy(): undefined {
    return undefined
  }
}
