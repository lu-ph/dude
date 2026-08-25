import type { AIConfig } from "../utils/env-utils.js"

export interface AgentChatRequestMessage {
  type: "agent:chat_request"
  payload: { prompt: string }
}

export interface AgentChatInterruptMessage {
  type: "agent:chat_interrupt"
  payload: { content: string }
}

export interface AgentLoadEnvFromJsonMessage {
  type: "agent:load_env_from_json"
  payload: Record<string, never>
}

export interface AgentCheckEnvMessage {
  type: "agent:check_env"
  payload: Record<string, never>
}

export interface AgentSetLLMEnvJsonMessage {
  type: "agent:set_llm_env_json"
  payload: { config: AIConfig }
}

export interface AgentEnvConfigMessage {
  type: "agent:env_config"
  payload: { config: AIConfig }
}

export interface AgentEnvCheckResultMessage {
  type: "agent:env_check_result"
  payload: { valid: boolean }
}

export interface AgentEnvUpdatedMessage {
  type: "agent:env_updated"
  payload: { success: boolean; error?: string }
}

// export interface AgentChatResponseMessage {
//   type: "agent:chat_response"
//   payload: { content: string }
// }

export interface AgentChatTextDeltaMessage {
  type: "agent:text_delta"
  payload: { text: string }
}

export interface AgentToolCallMessage {
  type: "agent:tool_call"
  payload: { name: string; id: string; input: Record<string, unknown> }
}

export interface AgentFinalMessage {
  type: "agent:final"
  payload: { success: boolean; cost: string; duration: string }
}

export interface AgentErrorMessage {
  type: "agent:error"
  payload: { error: string }
}

export interface AgentSystemMessage {
  type: "agent:system"
  payload: { message: string }
}

export interface AgentWaitPromptMessage {
  type: "agent:wait_for_prompt"
  payload: Record<string, never>
}

export interface AgentPromptMessage {
  type: "agent:prompt"
  payload: { prompt: string }
}

export type AgentClientToBackendMessage =
  | AgentChatRequestMessage
  | AgentChatInterruptMessage
  | AgentLoadEnvFromJsonMessage
  | AgentCheckEnvMessage
  | AgentSetLLMEnvJsonMessage

export type AgentBackendToClientMessage =
  | AgentToolCallMessage
  | AgentFinalMessage
  | AgentErrorMessage
  | AgentSystemMessage
  | AgentWaitPromptMessage
  | AgentPromptMessage
  | AgentChatTextDeltaMessage
  | AgentEnvConfigMessage
  | AgentEnvCheckResultMessage
  | AgentEnvUpdatedMessage
