import { AgentBackendToClientMessage, AgentClientToBackendMessage } from "./agent-types"
import { PDFBackendToClientMessage, PDFClientToBackendMessage } from "./pdf-types"

export type BackendToClientMessage = PDFBackendToClientMessage | AgentBackendToClientMessage

export type ClientToBackendMessage = PDFClientToBackendMessage | AgentClientToBackendMessage

export type Message = BackendToClientMessage | ClientToBackendMessage

export type MessageOfType<T extends Message["type"]> = Extract<Message, { type: T }>

export function isMessageType<M extends { type: string }, T extends M["type"]>(
  msg: M,
  targetType: T,
): msg is Extract<M, { type: T }> {
  return msg.type === targetType
}

export interface CustomAPI {
  common: {
    send: (message: unknown) => void
    onEvent: (callback: (message: unknown) => void) => () => void
  }
  agent: {
    sendToMain: (msg: AgentClientToBackendMessage) => void
    onMessageFromMain: (callback: (msg: AgentBackendToClientMessage) => void) => () => void
  }
  pdf: {
    sendToMain: (msg: PDFClientToBackendMessage) => void
    onMessageFromMain: (callback: (msg: PDFBackendToClientMessage) => void) => () => void
  }
}

declare global {
  interface Window {
    api: CustomAPI
  }
}
