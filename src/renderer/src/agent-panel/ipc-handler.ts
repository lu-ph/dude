import {
  AgentBackendToClientMessage,
  AgentClientToBackendMessage,
} from "@renderer/types/agent-types"

export class AgentIpcHandler {
  private onMessageCallback: ((msg: AgentBackendToClientMessage) => void) | null = null
  private cleanup: (() => void) | null = null

  constructor() {
    if (window.api?.agent?.onMessageFromMain) {
      this.cleanup = window.api.agent.onMessageFromMain((msg: unknown) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(msg as AgentBackendToClientMessage)
        }
      })
    }
  }

  send(msg: AgentClientToBackendMessage): void {
    if (window.api?.agent?.sendToMain) {
      window.api.agent.sendToMain(msg)
    }
  }

  onMessage(callback: (msg: AgentBackendToClientMessage) => void): void {
    this.onMessageCallback = callback
  }

  destroy(): void {
    this.cleanup?.()
    this.cleanup = null
    this.onMessageCallback = null
  }
}
