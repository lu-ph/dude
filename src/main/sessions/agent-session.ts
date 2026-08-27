
import { BaseSession } from "../types/session.js"
import {
  BackendToClientMessage,
  ClientToBackendMessage,
  isMessageType,
} from "../types/ipc-types.js"
import { checkEnv, loadEnvFromJson, setLLMEnvJson } from "../config/env.js"
import { Agent } from "../agent/agent.js"

interface IpcClient {
  send(message: BackendToClientMessage): void
}

export class AgentSession implements BaseSession {
  private client: IpcClient | null = null
  private agent: Agent | null = null
  private isListening: boolean = false
  private isDestroyed: boolean = false

  constructor(client: IpcClient, createAgent = true) {
    this.client = client
    if (!createAgent) return

    try {
      this.agent = new Agent()
    } catch (error) {
      this.sendError(error)
    }
  }

  public async handleMessage(message: ClientToBackendMessage): Promise<boolean> {
    if (this.isDestroyed) return false

    if (isMessageType(message, "agent:chat_request")) {
      const prompt = message.payload.prompt
      if (!this.agent) {
        this.sendError("Agent 初始化失败，无法处理模型请求")
        return true
      }
      if (typeof prompt === "string" && prompt.trim()) {
        this.sendToAgent(prompt)
        return true
      }
    }

    if (isMessageType(message, "agent:chat_interrupt")) {
      await this.agent?.pause()
      return true
    }

    if (isMessageType(message, "agent:load_env_from_json")) {
      try {
        this.sendToClient({ type: "agent:env_config", payload: { config: loadEnvFromJson() } })
      } catch (error) {
        this.sendToClient({
          type: "agent:env_updated",
          payload: { success: false, error: formatError(error) },
        })
      }
      return true
    }

    if (isMessageType(message, "agent:check_env")) {
      this.sendToClient({ type: "agent:env_check_result", payload: { valid: checkEnv() } })
      return true
    }

    if (isMessageType(message, "agent:set_llm_env_json")) {
      try {
        setLLMEnvJson(message.payload.config)
        if (this.agent) {
          await this.agent.pause().catch(() => {})
        }
        if (this.agent) {
          this.agent.init()
        }
        this.sendToClient({ type: "agent:env_updated", payload: { success: true } })
      } catch (error) {
        this.sendToClient({
          type: "agent:env_updated",
          payload: { success: false, error: formatError(error) },
        })
      }
      return true
    }

    return false
  }

  public sendToAgent(userInput: string): void {
    if (this.isDestroyed || !this.agent) return

    this.agent.sendMessage(userInput)

    if (!this.isListening) {
      this.listenToAgent()
    }
  }

  private async listenToAgent(): Promise<void> {
    if (this.isListening) return
    this.isListening = true

    try {
      for await (const message of this.agent?.getOutputStream() ?? []) {
        if (this.isDestroyed) break
        this.handleSDKMessage(message)
      }
    } catch (error) {
      console.error("[Session] Error listening to agent stream:", error)
      this.sendError(error)
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
      result?: string
      errors?: unknown[]
      error?: unknown
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
              payload: {
                name: block.name || "",
                id: block.id || "",
                input: block.input || {},
              },
            })
          } else if (block.type === "thinking") {
            console.log(JSON.stringify(block))
          }
        }
      }
    }

    if (msg.type === "error") {
      this.sendError(msg.error || msg.result || "Agent SDK returned an error")
      return
    }

    if (msg.type === "result") {
      if (msg.subtype !== "success") {
        this.sendError(this.getResultError(msg))
        return
      }

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

  private sendError(error: unknown): void {
    this.sendToClient({
      type: "agent:error",
      payload: { error: formatError(error) },
    })
  }

  private getResultError(message: {
    errors?: unknown[]
    result?: string
    subtype?: string
  }): string {
    if (message.errors?.length) {
      return message.errors.map((error) => formatError(error)).join("\n")
    }
    return message.result || `Agent request failed (${message.subtype || "unknown error"})`
  }

  public destroy(): void {
    if (this.isDestroyed) return

    this.isDestroyed = true
    this.client = null

    if (this.agent) {
      this.agent.pause().catch((err) => {
        console.error("[Session] Error pausing agent on destroy:", err)
      })
      console.log("[Session] Agent chat session destroyed (Main).")
    }
  }
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object") {
    const errorRecord = error as Record<string, unknown>
    if (typeof errorRecord.message === "string") return errorRecord.message
    try {
      return JSON.stringify(error)
    } catch {
      return "未知错误"
    }
  }
  return String(error)
}
