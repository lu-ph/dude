import { AgentBackendToClientMessage, AgentClientToBackendMessage } from "../types/types"

export class AgentIpcHandler {
  private onMessageCallback: ((msg: AgentBackendToClientMessage) => void) | null = null
  private cleanup: (() => void) | null = null

  constructor() {
    if (window.api?.agentClientToBackendMessage) {
      this.cleanup = window.api.agentClientToBackendMessage((msg: unknown) => {
        if (this.onMessageCallback) {
          this.onMessageCallback(msg as AgentBackendToClientMessage)
        }
      })
    }
  }

  send(msg: AgentClientToBackendMessage): void {
    if (window.api?.agentBackendToClientMessage) {
      window.api.agentBackendToClientMessage(msg as unknown as AgentBackendToClientMessage)
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
