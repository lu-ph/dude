export interface BaseSession {
  handleMessage(data: unknown): boolean | Promise<boolean>
  destroy(): void
}
