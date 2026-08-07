import dotenv from "dotenv"
import fs from "fs/promises"
import path from "path"
import playerFactory from "play-sound"

dotenv.config()

const player = playerFactory()

async function test() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.AGENT_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "aaa",
        "X-OpenRouter-Title": "aaa",
      },
      body: JSON.stringify({
        model: "x-ai/grok-voice-tts-1.0",
        input: "Hello! This is a text-to-speech test.",
        voice: "eve",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API request failed: ${response.status} - ${errorText}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const outputPath = path.resolve("./output.mp3")

    await fs.writeFile(outputPath, buffer)
    console.log(`Audio successfully saved to: ${outputPath}`)

    const generationId = response.headers.get("X-Generation-Id")
    console.log(`Generation ID: ${generationId}`)

    console.log("Playing audio...")
    player.play(outputPath, (err) => {
      if (err) {
        console.error("Error playing audio:", err)
      } else {
        console.log("Audio playback finished!")
      }
    })
  } catch (error) {
    console.error("Error:", error)
  }
}

test()
