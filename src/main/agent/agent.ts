import { query, type Query } from "@anthropic-ai/claude-agent-sdk"
import dotenv from "dotenv"
import { createScreenshotMcpServer } from "./mcp/screenshot.js"
import { createPdfViewerMcpServer } from "./mcp/pdf-viewer.js"
import fs from "node:original-fs"
import path from "node:path"
import { AIConfig, loadLLMEnv } from "../config/env.js"

dotenv.config()

interface UserMessage {
  type: "user"
  message: { role: "user"; content: string }
}

class MessageQueue {
  private messages: UserMessage[] = []
  private waiting: ((msg: UserMessage) => void) | null = null
  private closed = false

  push(content: string): void {
    const msg: UserMessage = {
      type: "user",
      message: {
        role: "user",
        content,
      },
    }

    if (this.waiting) {
      this.waiting(msg)
      this.waiting = null
    } else {
      this.messages.push(msg)
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<UserMessage> {
    while (!this.closed) {
      if (this.messages.length > 0) {
        yield this.messages.shift()!
      } else {
        yield await new Promise<UserMessage>((resolve) => {
          this.waiting = resolve
        })
      }
    }
  }

  close(): void {
    this.closed = true
  }
}

export class Agent {
  private sessionId: string | undefined = undefined
  private currentQuery: Query | null = null
  private inputQueue = new MessageQueue()
  private outputIterator: AsyncIterator<any> | null = null

  constructor() {
    try {
      this.init()
    } catch (error: any) {
      throw Error(`error initing agent ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  init(): void {
    const llmConfig: AIConfig = loadLLMEnv()

    this.currentQuery = query({
      prompt: this.inputQueue as any,
      options: {
        cwd: process.cwd(),
        model: process.env.ANTHROPIC_MODEL,
        resume: this.sessionId,
        settingSources: ["project"],
        skills: "all",
        includePartialMessages: false,

        /**
         * OpenRouter via Claude Code custom endpoint:
         * - ANTHROPIC_AUTH_TOKEN = API key
         * - ANTHROPIC_API_KEY = '' (must be empty to avoid official OAuth)
         * - ANTHROPIC_BASE_URL = 'https://openrouter.ai/api'
         */
        env: {
          ...process.env,
          ANTHROPIC_AUTH_TOKEN: llmConfig.apiKey,
          ANTHROPIC_BASE_URL: llmConfig.baseUrl,
          ANTHROPIC_API_KEY: "",
          ANTHROPIC_MODEL: llmConfig.modelName,
        },
        mcpServers: {
          playwright: {
            command: "npx",
            args: ["@playwright/mcp@latest"],
          },
          screenshot: createScreenshotMcpServer(),
          pdfViewer: createPdfViewerMcpServer(),
        },
        permissionMode: "bypassPermissions",
        allowedTools: [
          "Read",
          "Edit",
          "Write",
          "Bash",
          "Glob",
          "mcp__playwright__*",
          "mcp__screenshot__*",
          "mcp__pdf-viewer__*",
        ],
      },
    })

    this.outputIterator = this.currentQuery[Symbol.asyncIterator]()
  }

  async *getOutputStream(): AsyncGenerator<any, void, unknown> {
    if (!this.outputIterator) {
      throw new Error("Session not initialized")
    }
    while (true) {
      const { value, done } = await this.outputIterator.next()

      if (value) {
        if (value.session_id) {
          this.sessionId = value.session_id
        }
        let logText = ""

        if (typeof value === "string") {
          logText = value
        } else {
          const typeHeader = value.type ? ` (${value.type})` : ""
          logText = `${typeHeader}: ${JSON.stringify(value, null, 2)}`
        }

        appendToLog(logText)
      }
      if (done) break
      yield value
    }
  }

  public async reloadConfig(): Promise<void> {
    if (this.currentQuery) {
      await this.pause().catch(() => {})
    }

    this.inputQueue.close()
    this.inputQueue = new MessageQueue()

    this.init()
  }

  public async sendMessage(userInput: string): Promise<void> {
    this.inputQueue.push(userInput)
  }

  public reset(): void {
    this.sessionId = undefined
  }

  public async pause(): Promise<void> {
    if (!this.currentQuery) {
      return
    }
    try {
      await this.currentQuery.interrupt()
    } catch (error: any) {
      throw new Error(`error while pausing agent: ${error.message ? error.message : String(error)}`)
    }
  }
}

function appendToLog(content: string): void {
  fs.appendFileSync(path.join(process.cwd(), "agent_output.txt"), content + "\n", "utf-8")
}
