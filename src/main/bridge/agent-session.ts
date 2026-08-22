import { Agent } from "../service/agent.js"
import { BaseSession } from "../types/interface/session.js"
import { BackendToClientMessage, ClientToBackendMessage, isMessageType } from "../types/types.js"

interface IpcClient {
  send(message: BackendToClientMessage): void
}

export class AgentSession implements BaseSession {
  private client: IpcClient | null = null
  private agent: Agent
  private isListening: boolean = false
  private isDestroyed: boolean = false
  // private pendingContent: string = ""

  constructor(client: IpcClient) {
    this.agent = new Agent()
    this.client = client
  }

  public async handleMessage(message: ClientToBackendMessage): Promise<boolean> {
    if (this.isDestroyed) return false

    if (isMessageType(message, "agent:chat_request")) {
      const prompt = message.payload.prompt
      if (typeof prompt === "string" && prompt.trim()) {
        this.sendToAgent(prompt)
        return true
      }
    }

    if (isMessageType(message, "agent:chat_interrupt")) {
      await this.agent.pause()
      return true
    }

    return false
  }

  public sendToAgent(userInput: string): void {
    if (this.isDestroyed) return

    this.agent.sendMessage(userInput)

    if (!this.isListening) {
      this.listenToAgent()
    }
  }

  private async listenToAgent(): Promise<void> {
    if (this.isListening) return
    this.isListening = true
    // this.pendingContent = ""

    try {
      for await (const message of this.agent.getOutputStream()) {
        if (this.isDestroyed) break
        this.handleSDKMessage(message)
      }
    } catch (error) {
      console.error("[Session] Error listening to agent stream:", error)
      this.sendToClient({
        type: "agent:error",
        payload: { error: error instanceof Error ? error.message : String(error) },
      })
    } finally {
      this.isListening = false
    }
  }

  private handleSDKMessage(message: unknown): void {
    if (!message) return

    const msg = message as {
      type: string
      message?: {
        content?:
          | string
          | Array<{
              type: string
              text?: string
              name?: string
              id?: string
              input?: Record<string, unknown>
            }>
      }
      subtype?: string
      total_cost_usd?: string
      duration_ms?: string
    }

    if (msg.type === "assistant") {
      const content = msg.message?.content

      if (typeof content === "string") {
        this.sendToClient({
          type: "agent:text_delta",
          payload: { text: content },
        })
      } else if (Array.isArray(content)) {
        for (const block of content) {
          if (block.type === "text") {
            const text = block.text || ""
            if (text) {
              this.sendToClient({
                type: "agent:text_delta",
                payload: { text },
              })
            }
          } else if (block.type === "tool_use") {
            this.sendToClient({
              type: "agent:tool_call",
              payload: { name: block.name || "", id: block.id || "", input: block.input || {} },
            })
          } else if (block.type === "thinking") {
            console.log(JSON.stringify(block))
          }
        }
      }
    }

    if (msg.type === "result") {
      this.sendToClient({
        type: "agent:final",
        payload: {
          success: msg.subtype === "success",
          duration: msg.duration_ms ? `${msg.duration_ms}ms` : "unknown",
          cost: msg.total_cost_usd ? `$${msg.total_cost_usd}` : "unknown",
        },
      })
      return
    }
  }

  private sendToClient(message: BackendToClientMessage): void {
    if (!this.client) {
      return
    }

    try {
      this.client.send(message)
    } catch (error) {
      console.error("[Session] Error sending message to client:", error)
    }
  }

  public destroy(): void {
    if (this.isDestroyed) return

    this.isDestroyed = true
    this.client = null

    this.agent.pause().catch((err) => {
      console.error("[Session] Error pausing agent on destroy:", err)
    })

    console.log("[Session] Agent chat session destroyed.")
  }
}
