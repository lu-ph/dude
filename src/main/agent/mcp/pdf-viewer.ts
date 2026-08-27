import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk"
import path from "path"
import { stat } from "fs/promises"
import { z } from "zod"
import {
  captureScreenshot,
  jumpToPage,
  nextPage,
  previousPage,
} from "../../windows/pdf-viewer-controller.js"
import { showPdfViewer } from "../../windows/pdf-viewer-window.js"

export function createPdfViewerMcpServer(): any {
  return createSdkMcpServer({
    name: "pdf-viewer",
    version: "1.0.0",
    tools: [
      {
        name: "open_pdf_viewer",
        description: "Open a PDF viewer window for explaining concepts or other uses.",
        inputSchema: z.object({
          filePath: z
            .string()
            .describe("Absolute path to the specific .pdf file (must not be a directory)"),
        }),
        handler: async ({ filePath }) => handleOpenPdfViewer(filePath as string),
      },
      {
        name: "jump_to_page",
        description: "Jump to a specific PDF page",
        inputSchema: z.object({
          pageNum: z.number().describe("Jump to a specific PDF page."),
        }),
        handler: async ({ pageNum }) => handleJumpToPage(pageNum as number),
      },
      {
        name: "next_page",
        description: "Jump to the next page",
        inputSchema: z.object({}),
        handler: () => handleNextPage(),
      },
      {
        name: "previous_page",
        description: "Jump to the previous page",
        inputSchema: z.object({}),
        handler: () => handlePreviousPage(),
      },
    ],
  })
}

export interface McpToolResult {
  [x: string]: unknown
  isError?: boolean
  content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }>
}

export async function handleOpenPdfViewer(filePath: string): Promise<McpToolResult> {
  const absolutePath = path.resolve(filePath)

  try {
    const validationError = await validatePdfPath(absolutePath)
    if (validationError) {
      return {
        isError: true,
        content: [{ type: "text", text: validationError }],
      }
    }

    await showPdfViewer(absolutePath)
    const base64Image = await captureScreenshot()

    return {
      content: [
        {
          type: "text",
          text: `Successfully opened PDF viewer window for: ${absolutePath}`,
        },
        {
          type: "image",
          data: base64Image,
          mimeType: "image/png",
        },
      ],
    }
  } catch (error: unknown) {
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
}

async function validatePdfPath(absolutePath: string): Promise<string | null> {
  try {
    const fileStat = await stat(absolutePath)

    if (fileStat.isDirectory()) {
      return `Error: The path provided (${absolutePath}) is a directory. Please provide the absolute path to a specific .pdf file.`
    }

    if (!absolutePath.toLowerCase().endsWith(".pdf")) {
      return `Warning: The file (${absolutePath}) does not have a .pdf extension. Make sure you are opening a PDF file.`
    }

    return null
  } catch (error: any) {
    if (error.code === "ENOENT") {
      return `Error: File not found at path: ${absolutePath}. Please check the file path.`
    }
    throw error
  }
}

async function handleJumpToPage(pageNum: number): Promise<McpToolResult> {
  try {
    const base64 = await jumpToPage(pageNum)
    return {
      content: [
        {
          type: "image",
          data: base64,
          mimeType: "image/png",
        },
      ],
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Failed to jump to page ${pageNum}: ${message}`,
        },
      ],
    }
  }
}

async function handleNextPage(): Promise<McpToolResult> {
  try {
    const base64 = await nextPage()
    return {
      content: [
        {
          type: "image",
          data: base64,
          mimeType: "image/png",
        },
      ],
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Failed to jump to next page: ${message}`,
        },
      ],
    }
  }
}

async function handlePreviousPage(): Promise<McpToolResult> {
  try {
    const base64 = await previousPage()
    return {
      content: [
        {
          type: "image",
          data: base64,
          mimeType: "image/png",
        },
      ],
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    return {
      isError: true,
      content: [
        {
          type: "text",
          text: `Failed to jump to previous page: ${message}`,
        },
      ],
    }
  }
}
