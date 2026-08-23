import { contextBridge, ipcRenderer, webUtils } from "electron"
import { electronAPI } from "@electron-toolkit/preload"
import { AgentBackendToClientMessage, AgentClientToBackendMessage } from "../main/types/agent-types"
import { PDFBackendToClientMessage, PDFClientToBackendMessage } from "../main/types/pdf-types"

const api = {
  common: {
    send(message: unknown): void {
      ipcRenderer.send("common:renderer-to-main", message)
    },
    onEvent(callback: (message: unknown) => void): () => void {
      const listener = (_event: unknown, message: unknown): void => callback(message)
      ipcRenderer.on("common:main-to-renderer", listener)
      return () => ipcRenderer.removeListener("common:main-to-renderer", listener)
    },
  },

  agent: {
    getPathForFile: (file: File): string => webUtils.getPathForFile(file),
    sendToMain: (msg: AgentClientToBackendMessage): void => {
      ipcRenderer.send("agent:renderer-to-main", msg)
    },
    onMessageFromMain: (callback: (msg: AgentBackendToClientMessage) => void): (() => void) => {
      const handler = (_event: unknown, msg: unknown): void => {
        callback(msg as AgentBackendToClientMessage)
      }
      ipcRenderer.on("agent:main-to-renderer", handler)
      return () => {
        ipcRenderer.removeListener("agent:main-to-renderer", handler)
      }
    },
  },

  pdf: {
    sendToMain: (msg: PDFClientToBackendMessage): void => {
      ipcRenderer.send("pdf:renderer-to-main", msg)
    },
    onMessageFromMain: (callback: (msg: PDFBackendToClientMessage) => void): (() => void) => {
      const handler = (_event: unknown, msg: unknown): void => {
        callback(msg as PDFBackendToClientMessage)
      }
      ipcRenderer.on("pdf:main-to-renderer", handler)
      return () => {
        ipcRenderer.removeListener("pdf:main-to-renderer", handler)
      }
    },
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld("electron", electronAPI)
    contextBridge.exposeInMainWorld("api", api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
