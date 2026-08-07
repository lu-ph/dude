// import React, { useEffect, useState, useRef } from "react";
// import {
//   ServerToClientNoteMsg,
//   ClientToServerNoteMsg,
// } from "../types/note-types";

// type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

// export const NotePanel: React.FC = () => {
//   const [filePath, setFilePath] = useState<string>("");
//   const [content, setContent] = useState<string>("");
//   const [status, setStatus] = useState<ConnectionStatus>("connecting");
//   const [stats, setStats] = useState({ lines: 1, chars: 0 });

//   const wsRef = useRef<WebSocket | null>(null);
//   const textareaRef = useRef<HTMLTextAreaElement | null>(null);
//   const isLocalEditingRef = useRef<boolean>(false);

//   useEffect(() => {
//     const urlParams = new URLSearchParams(window.location.search);
//     const targetFilePath = urlParams.get("filePath") || "";
//     setFilePath(targetFilePath);

//     if (!targetFilePath) {
//       setStatus("error");
//       return;
//     }

//     const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
//     const host = window.location.host;
//     const wsUrl = `${protocol}//${host}/ws?clientType=note&filePath=${encodeURIComponent(
//       targetFilePath,
//     )}`;

//     const ws = new WebSocket(wsUrl);
//     wsRef.current = ws;

//     ws.onopen = () => {
//       setStatus("connected");

//       const initMessage: ClientToServerNoteMsg = {
//         type: "note_init",
//         filePath: targetFilePath,
//       };
//       console.log("[NotePanel WS] send:", initMessage);
//       ws.send(JSON.stringify(initMessage));
//     };

//     ws.onmessage = (event: MessageEvent) => {
//       try {
//         const message: ServerToClientNoteMsg = JSON.parse(event.data);
//         console.log("[NotePanel WS] receive:", message);

//         if (message.type === "note_init_resp") {
//           setContent(message.fileContent);
//           updateStats(message.fileContent);
//         } else if (message.type === "note_change") {
//           setContent((prev) => {
//             if (prev !== message.newContent) {
//               const textarea = textareaRef.current;
//               const selectionStart = textarea?.selectionStart;
//               const selectionEnd = textarea?.selectionEnd;

//               requestAnimationFrame(() => {
//                 if (
//                   textarea &&
//                   selectionStart !== undefined &&
//                   selectionEnd !== undefined
//                 ) {
//                   textarea.setSelectionRange(selectionStart, selectionEnd);
//                 }
//               });

//               updateStats(message.newContent);
//               return message.newContent;
//             }
//             return prev;
//           });
//         }
//       } catch (err) {
//         console.error("[NoteSync] 消息解析错误:", err);
//       }
//     };

//     ws.onerror = () => {
//       setStatus("error");
//     };

//     ws.onclose = () => {
//       setStatus("disconnected");
//     };

//     return () => {
//       ws.close();
//     };
//   }, []);

//   const updateStats = (text: string) => {
//     const lines = text ? text.split("\n").length : 1;
//     const chars = text.length;
//     setStats({ lines, chars });
//   };

//   const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
//     const newText = e.target.value;
//     isLocalEditingRef.current = true;
//     setContent(newText);
//     updateStats(newText);

//     if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
//       const msg: ClientToServerNoteMsg = {
//         type: "note_user_edited",
//         newContent: newText,
//       };
//       console.log("[NotePanel WS] send:", msg);
//       wsRef.current.send(JSON.stringify(msg));
//     }

//     isLocalEditingRef.current = false;
//   };

//   const fileName = filePath ? filePath.split(/[/\\]/).pop() : "未选择文件";

//   return (
//     <div className="flex flex-col h-screen w-screen bg-[#1e1e1e] text-[#d4d4d4] font-sans overflow-hidden">
//       <header className="h-[40px] bg-[#252526] border-b border-[#333333] flex items-center justify-between px-[14px] select-none">
//         <div
//           className="flex items-center gap-[8px] max-w-[70%]"
//           title={filePath}
//         >
//           <span className="text-[14px]">📄</span>
//           <span className="text-[13px] font-medium text-[#e1e1e1] whitespace-nowrap overflow-hidden text-ellipsis">
//             {fileName}
//           </span>
//         </div>
//         <div className="flex items-center gap-[6px]">
//           <span
//             className={`w-[8px] h-[8px] rounded-full inline-block ${
//               status === "connected"
//                 ? "bg-[#4ec9b0] shadow-[0_0_6px_rgba(78,201,176,0.4)]"
//                 : status === "connecting"
//                   ? "bg-[#cca700] animate-pulse"
//                   : "bg-[#f14c4c]"
//             }`}
//           />
//           <span className="text-[11px] text-[#858585]">
//             {status === "connected" && "已同步"}
//             {status === "connecting" && "连接中..."}
//             {status === "disconnected" && "已断开"}
//             {status === "error" && "连接错误"}
//           </span>
//         </div>
//       </header>

//       <main className="flex-1 relative bg-[#1e1e1e]">
//         {status === "error" && !filePath ? (
//           <div className="p-[24px] text-[#f14c4c] text-[13px]">
//             缺失 filePath 参数
//           </div>
//         ) : (
//           <textarea
//             ref={textareaRef}
//             className="w-full h-full bg-transparent text-[#dcdcaa] border-none outline-none p-[16px] font-mono text-[14px] leading-[1.6] resize-none tab-2 placeholder-[#5a5a5a] [::-webkit-scrollbar]:w-[10px] [::-webkit-scrollbar-track]:bg-[#1e1e1e] [::-webkit-scrollbar-thumb]:bg-[#2d2d2d] [::-webkit-scrollbar-thumb]:rounded-[4px] hover:[::-webkit-scrollbar-thumb]:bg-[#424242]"
//             value={content}
//             onChange={handleTextChange}
//             placeholder="等待 Agent 写入数据或在此处直接修改..."
//             spellCheck={false}
//           />
//         )}
//       </main>

//       <footer className="h-[24px] bg-[#007acc] text-white flex items-center justify-between px-[12px] text-[11px] font-sans select-none">
//         <div
//           className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[60%] opacity-90"
//           title={filePath}
//         >
//           {filePath || "No file active"}
//         </div>
//         <div className="flex gap-[12px] opacity-90">
//           <span>行数: {stats.lines}</span>
//           <span>字符: {stats.chars}</span>
//         </div>
//       </footer>
//     </div>
//   );
// };

// export default NotePanel;
