export interface ChatMessage {
  id: string
  role: "user" | "agent" | "thinking" | "tool" | "system" | "error"
  content: string
  metadata?: Record<string, unknown>
}
