import { contextBridge, ipcRenderer } from "electron"
import { electronAPI } from "@electron-toolkit/preload"

const api = {
  backend: {
    send(message: unknown): void {
      ipcRenderer.send("backend-message", message)
    },
    onEvent(callback: (message: unknown) => void): () => void {
      const listener = (_event: unknown, message: unknown): void => callback(message)
      ipcRenderer.on("backend-event", listener)
      return () => ipcRenderer.removeListener("backend-event", listener)
    },
  },

  agentBackendToClientMessage: (msg: unknown): void => ipcRenderer.send("agent:message", msg),
  agentClientToBackendMessage: (callback: (msg: unknown) => void): (() => void) => {
    const handler = (_event: unknown, msg: unknown): void => callback(msg)
    ipcRenderer.on("agent:message", handler)
    return () => ipcRenderer.removeListener("agent:message", handler)
  },

  pdfBackendToClientMessage: (msg: unknown): void => ipcRenderer.send("pdfviewer:message", msg),
  pdfClientToBackendMessage: (callback: (msg: unknown) => void): (() => void) => {
    const handler = (_event: unknown, msg: unknown): void => callback(msg)
    ipcRenderer.on("pdfviewer:message", handler)
    return () => ipcRenderer.removeListener("pdfviewer:message", handler)
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
