import React, { useState, useEffect, useRef, useMemo } from "react"
import { Document, Page, pdfjs } from "react-pdf"
import { PDFViewerIpcHandler } from "./ipc-handler"
import { PDFBackendToClientMessage } from "@renderer/types/pdf-types"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href

export const PDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)

  const handlerRef = useRef<PDFViewerIpcHandler | null>(null)

  const currentPageRef = useRef<number>(currentPage)
  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  const handleJumpToPage = (pageNum: number): void => {
    setCurrentPage(pageNum)

    requestAnimationFrame(() => {
      const pageElement = document.getElementById(`pdf-page-${pageNum}`)
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: "auto", block: "center" })

        requestAnimationFrame(() => {
          if (handlerRef.current) {
            handlerRef.current.send({ type: "pdf:page_ready", payload: { pageNum } })
          }
        })
      }
    })
  }

  useEffect(() => {
    handlerRef.current = new PDFViewerIpcHandler()

    handlerRef.current.onMessage((msg: PDFBackendToClientMessage) => {
      switch (msg.type) {
        case "pdf:jump_to_page":
          handleJumpToPage(msg.payload.pageNum)
          break
        case "pdf:next_page": {
          const next = Math.min(currentPageRef.current + 1, numPages)
          handleJumpToPage(next)
          break
        }
        case "pdf:previous_page": {
          const prevPage = Math.max(currentPageRef.current - 1, 1)
          handleJumpToPage(prevPage)
          break
        }
        case "pdf:buffer": {
          setErrorMsg(null)
          const base64 = msg.payload.buffer
          try {
            const binaryString = atob(base64)
            const len = binaryString.length
            const bytes = new Uint8Array(len)
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            setPdfData(bytes)
          } catch (err) {
            console.error("[PDFViewer] decode error:", err)
            setErrorMsg("解析 PDF 数据失败")
          }
          break
        }
        case "pdf:error":
          console.error("[PDFViewer] Error:", msg.payload.error)
          setErrorMsg(msg.payload.error)
          break
      }
    })

    return () => {
      handlerRef.current?.destroy()
      handlerRef.current = null
    }
  }, [numPages])

  const file = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData])

  return (
    <div className="flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans">
      <div className="sticky top-0 z-10 flex justify-between items-center px-5 py-2 bg-[#252526] border-b border-[#3c3c3c] shadow-[0_2px_8px_rgba(0,0,0,0.4)]">
        <span className="text-[15px] text-[#cccccc] tracking-[0.5px]">
          页码：
          <strong className="text-[18px] font-bold text-white px-0.5">{currentPage}</strong> /{" "}
          {numPages}
        </span>
        <div>
          <button
            disabled={currentPage <= 1}
            onClick={() => handleJumpToPage(Math.max(currentPage - 1, 1))}
            className="bg-[#0e639c] text-white border-none rounded-sm px-[14px] py-[6px] text-[13px] font-medium transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            上一页
          </button>
          <button
            disabled={currentPage >= numPages}
            onClick={() => handleJumpToPage(Math.min(currentPage + 1, numPages))}
            className="ml-2 bg-[#0e639c] text-white border-none rounded-sm px-[14px] py-[6px] text-[13px] font-medium transition-colors duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            下一页
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex justify-center py-3">
        {errorMsg ? (
          <div className="flex flex-col items-center justify-center mt-20 p-6 bg-[#252526] border border-[#3c3c3c] rounded-md shadow-lg max-w-md w-full h-fit">
            <svg
              className="w-12 h-12 text-[#f48771] mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[#f48771] text-[16px] font-semibold">加载 PDF 失败</span>
            <span className="text-[#cccccc] text-[14px] mt-2 text-center leading-relaxed">
              {errorMsg}
            </span>
          </div>
        ) : file ? (
          <Document file={file} onLoadSuccess={({ numPages }) => setNumPages(numPages)}>
            {Array.from(new Array(numPages), (_, index) => {
              const pageNum = index + 1
              const isCurrent = pageNum === currentPage

              return (
                <div
                  key={`page_${pageNum}`}
                  id={`pdf-page-${pageNum}`}
                  className={`mb-2 bg-white rounded-sm transition-all duration-200 ease-in-out box-border ${
                    isCurrent
                      ? "border-2 border-[#007acc] shadow-[0_0_12px_rgba(0,122,204,0.4)]"
                      : "border border-[#2d2d2d] shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                  }`}
                >
                  <Page
                    pageNumber={pageNum}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={800}
                    onRenderSuccess={() => {
                      if (pageNum === 1 && handlerRef.current) {
                        handlerRef.current.send({
                          type: "pdf:page_ready",
                          payload: { pageNum },
                        })
                      }
                    }}
                  />
                </div>
              )
            })}
          </Document>
        ) : (
          <div className="mt-20 text-[#888888] text-[15px]">等待加载 PDF 文件...</div>
        )}
      </div>
    </div>
  )
}

export default PDFViewer
