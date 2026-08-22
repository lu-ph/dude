export interface BaseSession {
  handleMessage(data: any): boolean | Promise<boolean>
  destroy(): void
}
