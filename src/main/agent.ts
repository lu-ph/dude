import { query, type Query } from "@anthropic-ai/claude-agent-sdk"
import dotenv from "dotenv"
import { createScreenshotMcpServer } from "./tools/screen-capture.js"
import { createPdfViewerMcpServer } from "./tools/pdf-viewer-tool.js"

dotenv.config()

interface UserMessage {
  type: "user"
  message: { role: "user"; content: string }
}

// Simple async queue - messages go in via push(), come out via async iteration
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
      // Someone is waiting for a message - give it to them
      this.waiting(msg)
      this.waiting = null
    } else {
      // No one waiting - queue it
      this.messages.push(msg)
    }
  }

  async *[Symbol.asyncIterator](): AsyncIterableIterator<UserMessage> {
    while (!this.closed) {
      if (this.messages.length > 0) {
        yield this.messages.shift()!
      } else {
        // Wait for next message
        yield await new Promise<UserMessage>((resolve) => {
          this.waiting = resolve
        })
      }
    }
  }

  close() {
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
      this.outputIterator = query({
        prompt: this.inputQueue as any,
        options: {
          cwd: process.cwd(),
          model: process.env.ANTHROPIC_MODEL,
          resume: this.sessionId,
          settingSources: ["project"],
          skills: "all",
          env: {
            /**
             * OpenRouter via Claude Code custom endpoint:
             * - ANTHROPIC_AUTH_TOKEN = API key
             * - ANTHROPIC_API_KEY = '' (must be empty to avoid official OAuth)
             * - ANTHROPIC_BASE_URL = 'https://openrouter.ai/api'
             */
            ...process.env,
            ANTHROPIC_AUTH_TOKEN: process.env.ANTHROPIC_AUTH_TOKEN,
            ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
            ANTHROPIC_API_KEY: "",
            ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
          },
          mcpServers: {
            playwright: {
              command: "npx",
              args: ["@playwright/mcp@latest"],
            },
            screenshot: createScreenshotMcpServer(),
            // notePanel: createNotePanelMcpServer(),
            pdfViewer: createPdfViewerMcpServer(),
            // presentationWindow: createPresentationWindowMcpServer(),
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
            // "mcp__note-panel__*",
            "mcp__pdf-viewer__*",
            // "mcp__presentation-window__*",
          ],
        },
      })[Symbol.asyncIterator]()
    } catch (error: any) {
      if (error instanceof Error) {
        throw new Error(`error while running agent: ${error.message}`)
      } else {
        throw new Error(`unknown error while running agent: ${String(error)}`)
      }
    }
  }

  async *getOutputStream() {
    if (!this.outputIterator) {
      throw new Error("Session not initialized")
    }
    while (true) {
      const { value, done } = await this.outputIterator.next()
      if (done) break
      yield value
    }
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
