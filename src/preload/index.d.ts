import { ElectronAPI } from "@electron-toolkit/preload"
import type {
  AgentBackendToClientMessage,
  AgentClientToBackendMessage,
  PDFBackendToClientMessage,
  PDFClientToBackendMessage,
} from "../renderer/src/types/types"

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      backend: {
        send(message: unknown): void
        onEvent(callback: (message: unknown) => void): () => void
      }
      agentBackendToClientMessage: (msg: AgentBackendToClientMessage) => void
      getPathForFile: (file: File) => string
      agentClientToBackendMessage: (
        callback: (msg: AgentClientToBackendMessage) => void,
      ) => () => void
      pdfBackendToClientMessage: (msg: PDFBackendToClientMessage) => void
      pdfClientToBackendMessage: (callback: (msg: PDFClientToBackendMessage) => void) => () => void
    }
  }
}
