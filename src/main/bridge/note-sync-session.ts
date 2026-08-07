// import fs, { watch } from "fs";
// import {
//   ClientToServerNoteMsg,
//   ServerToClientNoteMsg,
// } from "../types/note-types";
// import { BaseSession } from "../types/interface/session";
// import { readFile, writeFile } from "fs/promises";

// interface IpcClient {
//   send(message: any): void;
// }

// export class NoteSyncSession implements BaseSession {
//   public readonly sessionId: string;
//   private lastKnownContent: string | null = null;
//   private filePath: string | null = null;
//   private client: IpcClient;
//   private fileWatcher: fs.FSWatcher | null = null;
//   private watchDebounceTimer: NodeJS.Timeout | null = null;
//   private writeQueue: Promise<void> = Promise.resolve();

//   constructor(client: IpcClient) {
//     this.sessionId = `note_session_${Date.now()}`;
//     this.client = client;
//   }

//   public async handleMessage(data: ClientToServerNoteMsg): Promise<boolean> {
//     if (data.type === "note_init") {
//       if (!data.filePath) return this.error("filePath cannot be empty");
//       await this.initNote(data.filePath);
//       return true;
//     }

//     if (data.type === "note_user_edited") {
//       if (data.newContent === undefined || !this.filePath) {
//         return this.error("Content missing or not initialized");
//       }
//       this.handleUserEdit(data.newContent);
//       return true;
//     }

//     return false;
//   }

//   private async initNote(filePath: string) {
//     try {
//       this.filePath = filePath;
//       this.lastKnownContent = await readFile(this.filePath, "utf-8");

//       this.sendToClient({
//         type: "note_init_resp",
//         fileContent: this.lastKnownContent,
//       });
//       this.setupFileWatcher();
//       console.log(`[NoteSync] Watching: ${this.filePath}`);
//     } catch (err: any) {
//       this.error(`Init failed: ${err.message}`);
//     }
//   }

//   private setupFileWatcher() {
//     if (this.fileWatcher) this.fileWatcher.close();
//     if (!this.filePath) return;

//     try {
//       this.fileWatcher = watch(this.filePath, (eventType) => {
//         if (eventType === "rename") {
//           console.warn(
//             `[NoteSync] Atomic save detected (rename), reconnecting watcher...`,
//           );
//           setTimeout(() => this.setupFileWatcher(), 50);
//           return;
//         }

//         // Debounce filts the trash change event Windows or mac triggered
//         if (this.watchDebounceTimer) clearTimeout(this.watchDebounceTimer);
//         this.watchDebounceTimer = setTimeout(async () => {
//           try {
//             const currentContent = await readFile(this.filePath!, "utf-8");

//             if (currentContent !== this.lastKnownContent) {
//               this.lastKnownContent = currentContent;
//               this.sendToClient({
//                 type: "note_change",
//                 newContent: this.lastKnownContent,
//               });
//             }
//           } catch (error) {
//             console.error("[NoteSync] Read error during watch event:", error);
//           }
//         }, 50);
//       });
//     } catch (error) {
//       console.error("[NoteSync] Failed to setup watcher:", error);
//     }
//   }

//   private handleUserEdit(newContent: string) {
//     if (this.lastKnownContent === newContent || !this.filePath) return;

//     this.lastKnownContent = newContent;

//     this.writeQueue = this.writeQueue
//       .then(async () => {
//         try {
//           await writeFile(this.filePath!, newContent, "utf-8");
//         } catch (err: any) {
//           this.error(`Write failed: ${err.message}`);
//         }
//       })
//       .catch((err) => console.error("Write queue error:", err));
//   }

//   private sendToClient(content: ServerToClientNoteMsg): void {
//     this.client.send(content);
//   }

//   private error(message: string): boolean {
//     this.sendToClient({ type: "note_backend_error", message });
//     return true;
//   }

//   public destroy(): void {
//     if (this.watchDebounceTimer) clearTimeout(this.watchDebounceTimer);
//     if (this.fileWatcher) this.fileWatcher.close();
//     console.log(`[NoteSync] Session ${this.sessionId} destroyed.`);
//   }
// }
