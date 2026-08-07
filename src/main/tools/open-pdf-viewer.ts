import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk"
import path from "path"
import { stat } from "fs/promises" // 引入 fs 的 stat
import { z } from "zod"
import { showPdfViewer } from "../pdf-viewer-window.js"

export function createPdfViewerMcpServer(): any {
  return createSdkMcpServer({
    name: "pdf-viewer",
    version: "1.0.0",
    tools: [
      {
        name: "pdf_viewer",
        description: "Open a PDF viewer window for explaining concepts or other uses.",
        inputSchema: z.object({
          filePath: z
            .string()
            .describe("Absolute path to the specific .pdf file (must not be a directory)"),
        }),
        handler: async ({ filePath }) => {
          const absolutePath = path.resolve(filePath as string)

          try {
            const fileStat = await stat(absolutePath)

            if (fileStat.isDirectory()) {
              return {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Error: The path provided (${absolutePath}) is a directory. Please provide the absolute path to a specific .pdf file.`,
                  },
                ],
              }
            }

            if (!absolutePath.toLowerCase().endsWith(".pdf")) {
              return {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Warning: The file (${absolutePath}) does not have a .pdf extension. Make sure you are opening a PDF file.`,
                  },
                ],
              }
            }

            await showPdfViewer(absolutePath)

            return {
              content: [
                {
                  type: "text",
                  text: `Successfully opened PDF viewer window for: ${absolutePath}`,
                },
              ],
            }
          } catch (error: any) {
            if (error.code === "ENOENT") {
              return {
                isError: true,
                content: [
                  {
                    type: "text",
                    text: `Error: File not found at path: ${absolutePath}. Please check the file path.`,
                  },
                ],
              }
            }

            const message = error instanceof Error ? error.message : String(error)
            return {
              isError: true,
              content: [
                {
                  type: "text",
                  text: `Failed to open PDF viewer: ${message}`,
                },
              ],
            }
          }
        },
      },
    ],
  })
}
