import { app } from "electron"
import * as path from "path"
import * as fs from "fs"
import { z } from "zod"

export const AIConfigSchema = z.object({
  modelName: z.string().default(""),
  apiKey: z.string().default(""),
  baseUrl: z.string().default(""),
})

export type AIConfig = z.infer<typeof AIConfigSchema>

export function getJsonConfigPath(): string {
  return path.join(app.getPath("userData"), "env.json")
}

export function checkEnv(): boolean {
  try {
    loadLLMEnv()
    return true
  } catch {
    return false
  }
}

export function loadEnvFromJson(): AIConfig {
  const jsonPath = getJsonConfigPath()

  if (!fs.existsSync(jsonPath)) {
    throw Error("LLM json config not set")
  }

  try {
    const fileContent = fs.readFileSync(jsonPath, "utf-8")
    return AIConfigSchema.parse(JSON.parse(fileContent))
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error("Invalid LLM config JSON structure")
    }
    throw new Error(
      `Failed to read LLM config: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export function setLLMEnvJson(config: AIConfig): void {
  const validatedConfig = AIConfigSchema.parse(config)
  const jsonPath = getJsonConfigPath()
  const dirPath = path.dirname(jsonPath)

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }

  try {
    fs.writeFileSync(jsonPath, JSON.stringify(validatedConfig, null, 2), "utf-8")
  } catch (error) {
    throw new Error(
      `Failed to write LLM config JSON: ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

export function loadLLMEnv(): AIConfig {
  const jsonConfig = loadEnvFromJson()

  if (!jsonConfig.modelName?.trim() || !jsonConfig.apiKey?.trim() || !jsonConfig.baseUrl?.trim()) {
    throw new Error("LLM config incomplete")
  }

  return {
    modelName: jsonConfig.modelName.trim(),
    apiKey: jsonConfig.apiKey.trim(),
    baseUrl: jsonConfig.baseUrl.trim(),
  }
}
