import { JSX, StrictMode } from "react"
import { HashRouter, Routes, Route } from "react-router-dom"
import "./index.css"
import { AgentPanel } from "./agent-panel/AgentPanel"
import { AgentSettingsPanel } from "./settings-panel/SettingPanel"
import PDFViewer from "./pdf-viewer/PDFViewer"

export function App(): JSX.Element {
  return (
    <StrictMode>
      <HashRouter>
        <Routes>
          <Route path="/" element={<AgentPanel />} />\
          <Route path="/pdfviewer" element={<PDFViewer />} />
          <Route path="/settings" element={<AgentSettingsPanel />} />
          <Route
            path="*"
            element={
              <div style={{ padding: 24, fontFamily: "sans-serif" }}>
                <h1>404 Page Not Found</h1>
              </div>
            }
          />
        </Routes>
      </HashRouter>
    </StrictMode>
  )
}
