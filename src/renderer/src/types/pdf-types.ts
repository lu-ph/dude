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

export interface PDFGetMessage {
  type: "pdf:get"
  payload: { pdfPath: string }
}

export interface PDFPageReadyMessage {
  type: "pdf:page_ready"
  payload: { pageNum: number }
}

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

export type PDFClientToBackendMessage = PDFGetMessage | PDFPageReadyMessage
