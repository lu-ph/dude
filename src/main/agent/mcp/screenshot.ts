import sharp from "sharp"
import { z } from "zod"
import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk"
import { exec } from "child_process"
import util from "util"
import fs from "fs/promises"
import path from "path"
import os from "os"

export function createScreenshotMcpServer(): any {
  return createSdkMcpServer({
    name: "screenshot",
    version: "1.0.0",
    alwaysLoad: true,
    tools: [
      {
        name: "capture_screen",
        description: "Capture the desktop screenshot natively and return it directly from memory.",
        inputSchema: z.object({}),
        handler: async () => {
          const base64 = await captureScreenAsBase64()
          return {
            content: [
              {
                type: "text",
                text: "Successfully captured the system screen via screenshot-desktop.",
              },
              {
                type: "image",
                data: base64,
                mimeType: "image/jpeg",
              },
            ],
          }
        },
      },
    ],
  })
}

const execAsync = util.promisify(exec)

export async function captureScreenAsBase64(): Promise<string> {
  const tmpPath = path.join(os.tmpdir(), `agent_screen_${Date.now()}.png`)
  const platform = process.platform

  try {
    if (platform === "win32") {
      await captureWindows(tmpPath)
    } else if (platform === "darwin") {
      await captureMac(tmpPath)
    } else {
      throw new Error(`unsupported system: ${platform}`)
    }

    const rawBuffer = await fs.readFile(tmpPath)

    fs.unlink(tmpPath).catch(() => {})

    const optimizedBuffer = await sharp(rawBuffer)
      .resize(1500, 1500, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer()

    return optimizedBuffer.toString("base64")
  } catch (error: any) {
    fs.unlink(tmpPath).catch(() => {})
    console.error("Screen capture failed:", error)
    throw new Error(`unable to capture screen: ${error.message || error}`)
  }
}

async function captureWindows(outputPath: string): Promise<void> {
  const formattedPath = outputPath.replace(/\\/g, "/")

  const psScript = `
    Add-Type -AssemblyName System.Drawing
    Add-Type -AssemblyName System.Windows.Forms
    $bounds = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height
    $graphics = [System.Drawing.Graphics]::FromImage($bmp)
    $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size)
    $bmp.Save('${formattedPath}', [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bmp.Dispose()
  `

  const base64Script = Buffer.from(psScript, "utf16le").toString("base64")

  await execAsync(`powershell -NoProfile -ExecutionPolicy Bypass -EncodedCommand ${base64Script}`)
}

async function captureMac(outputPath: string): Promise<void> {
  await execAsync(`screencapture -x "${outputPath}"`)
}
