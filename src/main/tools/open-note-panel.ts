// import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
// import path from "path";
// import { z } from "zod";
// import { openBrowser } from "../service/open-browser";

// export function createNotePanelMcpServer(): any {
//   return createSdkMcpServer({
//     name: "note-panel",
//     version: "1.0.0",
//     tools: [
//       {
//         name: "note_panel",
//         description:
//           "Open a real-time synchronized note preview/editor window on the right side of the desktop. Directly modify the source file to update the NotePanel preview in real time.",
//         inputSchema: z.object({
//           filePath: z
//             .string()
//             .describe("Path to the note file (absolute paths)"),
//         }),
//         handler: async ({ filePath }) => {
//           const absolutePath = path.resolve(filePath as string);
//           const targetUrl = `http://localhost:5173/notepanel?filePath=${encodeURIComponent(absolutePath)}`;

//           openBrowser(targetUrl, [960, 0], [960, 1040]);

//           return {
//             content: [
//               {
//                 type: "text",
//                 text: `Opened note preview in right-side window: ${absolutePath}`,
//               },
//             ],
//           };
//         },
//       },
//     ],
//   });
// }
