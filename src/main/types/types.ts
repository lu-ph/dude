export interface AgentChatRequestMessage {
  type: "agent:chat_request"
  payload: { prompt: string }
}

export interface AgentChatResponseMessage {
  type: "agent:chat_response"
  payload: { content: string }
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

export type AgentClientToBackendMessage = AgentChatRequestMessage

export type AgentBackendToClientMessage =
  | AgentToolCallMessage
  | AgentFinalMessage
  | AgentErrorMessage
  | AgentSystemMessage
  | AgentWaitPromptMessage
  | AgentPromptMessage

// IPC message types for Note Panel
// export interface NoteInitMessage {
//   type: "note:init";
//   payload: { filePath: string };
// }

// export interface NoteChangeMessage {
//   type: "note:change";
//   payload: { newContent: string };
// }

// export interface NoteUserEditedMessage {
//   type: "note:user_edited";
//   payload: { newContent: string };
// }

// export interface NoteErrorMessage {
//   type: "note:error";
//   payload: { error: string };
// }

// export type NoteMessage =
//   | NoteInitMessage
//   | NoteChangeMessage
//   | NoteUserEditedMessage
//   | NoteErrorMessage;

/** backend agent send message to control frontend pdf page */
export interface PDFJumpPageMessage {
  type: "pdf:jump_to_page"
  payload: { pageNum: number }
}

export interface PDFNextPageMessage {
  type: "pdf:next_page"
  payload: Record<string, never>
}

export interface PDFPreviousPageMessage {
  type: "pdf:previous_page"
  payload: Record<string, never>
}

/** frontend requests local pdf data from backend */
export interface PDFGetMessage {
  type: "pdf:get"
  payload: { pdfPath: string }
}

/** backend sends pdf buffer to frontend */
export interface PDFBufferMessage {
  type: "pdf:buffer"
  payload: { buffer: string }
}

export interface PDFErrorMessage {
  type: "pdf:error"
  payload: { error: string }
}

export type PDFBackendToClientMessage =
  | PDFJumpPageMessage
  | PDFNextPageMessage
  | PDFPreviousPageMessage
  | PDFBufferMessage
  | PDFErrorMessage

export type PDFClientToBackendMessage = PDFGetMessage

export interface CustomAPI {
  agentBackendToClientMessage: (msg: AgentBackendToClientMessage) => void
  agentClientToBackendMessage: (callback: (msg: AgentClientToBackendMessage) => void) => () => void
  pdfBackendToClientMessage: (msg: PDFBackendToClientMessage) => void
  pdfClientToBackendMessage: (callback: (msg: PDFClientToBackendMessage) => void) => () => void
}

declare global {
  interface Window {
    api: CustomAPI
  }
}
