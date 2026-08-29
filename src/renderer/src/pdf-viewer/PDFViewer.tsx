import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Document, pdfjs } from "react-pdf"
import { PDFViewerIpcHandler } from "./ipc-handler"
import { PDFBackendToClientMessage } from "@renderer/types/pdf-types"
import LazyPdfPage from "./LazyPage"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).href

export const PDFViewer: React.FC = () => {
  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)

  const [inputPage, setInputPage] = useState<string | null>(null)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null)

  const handlerRef = useRef<PDFViewerIpcHandler | null>(null)
  const currentPageRef = useRef<number>(currentPage)

  const displayPageInput = isInputFocused ? (inputPage ?? String(currentPage)) : String(currentPage)

  useEffect(() => {
    currentPageRef.current = currentPage
  }, [currentPage])

  const handleJumpToPage = useCallback(
    (pageNum: number): void => {
      const targetPage = Math.max(1, Math.min(pageNum, numPages || 1))
      setCurrentPage(targetPage)
      setInputPage(null)
      setIsInputFocused(false)

      requestAnimationFrame(() => {
        const pageElement = document.getElementById(`pdf-page-${targetPage}`)
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: "auto", block: "center" })
        }
      })

      const input = document.activeElement as HTMLInputElement | null
      if (input && input.tagName === "INPUT") {
        input.blur()
      }
    },
    [numPages],
  )

  const handlePageReady = useCallback(
    (pageNum: number): void => {
      setCurrentPage((prev) => (prev === pageNum ? prev : pageNum))

      if (!isInputFocused) {
        setInputPage(null)
      }
    },
    [isInputFocused],
  )

  const handlePageInputSubmit = (e: React.SubmitEvent): void => {
    e.preventDefault()
    const page = parseInt(displayPageInput, 10)
    if (!isNaN(page)) {
      handleJumpToPage(page)
    } else {
      setInputPage(null)
    }
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
          } catch (error) {
            setErrorMsg(`Failed to parse PDF data ${error instanceof Error ? error.message : String(error)}`)
          }
          break
        }
        case "pdf:error":
          setErrorMsg(msg.payload.error)
          break
      }
    })

    return () => {
      handlerRef.current?.destroy()
      handlerRef.current = null
    }
  }, [handleJumpToPage, numPages])

  const file = useMemo(() => (pdfData ? { data: pdfData } : null), [pdfData])

  return (
    <div className="relative flex flex-col h-screen bg-[#1e1e1e] text-[#cccccc] font-sans">
      {/* 半透明悬浮顶部栏 */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center px-4 py-1.5 bg-[#252526]/80 backdrop-blur-md border border-[#3c3c3c]/60 rounded-full shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
        <form onSubmit={handlePageInputSubmit} className="flex items-center text-[13px] text-[#cccccc]">
          <span className="mr-2 select-none text-[#aaaaaa]">页码</span>
          <input
            type="text"
            value={displayPageInput}
            onFocus={() => {
              setInputPage(String(currentPage))
              setIsInputFocused(true)
            }}
            onChange={(e) => setInputPage(e.target.value)}
            onBlur={() => {
              const page = parseInt(displayPageInput, 10)
              setIsInputFocused(false)

              if (!isNaN(page)) {
                handleJumpToPage(page)
              } else {
                setInputPage(null)
              }
            }}
            className="w-10 h-6 bg-[#1e1e1e]/80 border border-[#444444] focus:border-[#007acc] focus:outline-none rounded text-center text-white font-medium text-[13px] transition-colors"
          />
          <span className="ml-2 select-none text-[#aaaaaa]">
            / {numPages || "--"}
          </span>
        </form>
      </div>

      {/* PDF 滚动容器 */}
      <div className="flex-1 overflow-y-auto flex justify-center pt-16 pb-6">
        {errorMsg ? (
          <div className="mt-20 p-6 bg-[#252526] rounded border border-[#3c3c3c]">
            加载失败: {errorMsg}
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
                  className={`mb-3 bg-white rounded-sm transition-all duration-200 ease-in-out box-border ${
                    isCurrent
                      ? "border-2 border-[#007acc] shadow-[0_0_12px_rgba(0,122,204,0.4)]"
                      : "border border-[#2d2d2d] shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                  }`}
                >
                  <LazyPdfPage
                    pageNum={pageNum}
                    onPageReady={(readyPageNum) => {
                      handlePageReady(readyPageNum)

                      if (handlerRef.current) {
                        handlerRef.current.send({
                          type: "pdf:page_ready",
                          payload: { pageNum: readyPageNum },
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