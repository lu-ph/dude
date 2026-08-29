import React, { useState, useEffect } from "react"
import { Page } from "react-pdf"
import { useInView } from "react-intersection-observer"

const ESTIMATED_PAGE_HEIGHT = 1130

interface LazyPdfPageProps {
  pageNum: number
  onPageReady: (pageNum: number) => void
}

const LazyPdfPage: React.FC<LazyPdfPageProps> = ({ pageNum, onPageReady }) => {
  const [shouldRender, setShouldRender] = useState(false)
  const [isRendered, setIsRendered] = useState(false)

  const { ref: renderRef } = useInView({
    rootMargin: "1200px 0px 1200px 0px",
    onChange: (inView) => {
      if (inView) {
        setShouldRender(true)
      }
    },
  })

  const { ref: activeRef, inView: isVisiblyInView } = useInView({
    threshold: 0.5,
  })

  useEffect(() => {
    if (!isRendered || !isVisiblyInView) {
      return
    }

    const frameId = requestAnimationFrame(() => {
      onPageReady(pageNum)
    })

    return () => cancelAnimationFrame(frameId)
  }, [isRendered, isVisiblyInView, pageNum, onPageReady])

  const setRefs = (node: HTMLDivElement | null): void => {
    renderRef(node)
    activeRef(node)
  }

  return (
    <div
      ref={setRefs}
      style={{ minHeight: ESTIMATED_PAGE_HEIGHT }}
      className="w-full flex justify-center"
    >
      {shouldRender ? (
        <Page
          pageNumber={pageNum}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          width={800}
          onRenderSuccess={() => {
            setIsRendered(true)
          }}
        />
      ) : (
        <div
          className="flex items-center justify-center h-full bg-[#252526] text-[#888888]"
          style={{ width: 800 }}
        >
          Rendering page {pageNum} ...
        </div>
      )}
    </div>
  )
}

export default LazyPdfPage