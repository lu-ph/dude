export interface AgentChatRequestMessage {
  type: "agent:chat_request"
  payload: { prompt: string }
}

export interface AgentChatInterruptMessage {
  type: "agent:chat_interrupt"
  payload: { content: string }
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

export type AgentClientToBackendMessage = AgentChatRequestMessage | AgentChatInterruptMessage

export type AgentBackendToClientMessage =
  | AgentToolCallMessage
  | AgentFinalMessage
  | AgentErrorMessage
  | AgentSystemMessage
  | AgentWaitPromptMessage
  | AgentPromptMessage
  | AgentChatTextDeltaMessage
