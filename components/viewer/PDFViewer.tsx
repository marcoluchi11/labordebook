'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PDFViewerProps {
  bookId: string
}

export function PDFViewer({ bookId }: PDFViewerProps) {
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const renderTaskRef = useRef<import('pdfjs-dist').RenderTask | null>(null)
  const pdfDocRef    = useRef<import('pdfjs-dist').PDFDocumentProxy | null>(null)

  const [pdfDoc,      setPdfDoc]      = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages,    setNumPages]    = useState(0)
  const [scale,       setScale]       = useState(1.0)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState<string | null>(null)

  // Derive fit-to-width scale from the container's current clientWidth
  const calcFitScale = useCallback(
    async (doc: import('pdfjs-dist').PDFDocumentProxy, pageNum: number): Promise<number> => {
      if (!containerRef.current) return 1
      const page      = await doc.getPage(pageNum)
      const unscaled  = page.getViewport({ scale: 1 })
      return containerRef.current.clientWidth / unscaled.width
    },
    []
  )

  // Load PDF.js and the document
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const res = await fetch(`/api/viewer/${bookId}/session`)
        if (!res.ok) throw new Error('No autorizado')

        const { url } = await res.json()
        const doc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise
        if (cancelled) return

        pdfDocRef.current = doc
        setPdfDoc(doc)
        setNumPages(doc.numPages)

        const fitScale = await calcFitScale(doc, 1)
        if (!cancelled) setScale(fitScale)
        setLoading(false)
      } catch {
        if (!cancelled) {
          setError('No se pudo cargar el libro. Verificá tu conexión.')
          setLoading(false)
        }
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [bookId, calcFitScale])

  // Recalculate fit-to-width on resize / orientation change
  useEffect(() => {
    const handleResize = async () => {
      const doc = pdfDocRef.current
      if (!doc) return
      const fitScale = await calcFitScale(doc, currentPage)
      setScale(fitScale)
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
    }
  }, [calcFitScale, currentPage])

  // Render current page at scale × devicePixelRatio for crisp retina output
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch { /* expected */ }
    }

    const page       = await pdfDoc.getPage(pageNum)
    const pixelRatio = window.devicePixelRatio || 1
    const viewport   = page.getViewport({ scale: scale * pixelRatio })
    const canvas     = canvasRef.current
    const ctx        = canvas.getContext('2d')
    if (!ctx) return

    canvas.width        = viewport.width
    canvas.height       = viewport.height
    canvas.style.width  = `${viewport.width  / pixelRatio}px`
    canvas.style.height = `${viewport.height / pixelRatio}px`

    const renderTask = page.render({ canvasContext: ctx, viewport, canvas })
    renderTaskRef.current = renderTask

    try {
      await renderTask.promise
    } catch (err: unknown) {
      if ((err as { name?: string }).name !== 'RenderingCancelledException') {
        console.error('Render error', err)
      }
    }
  }, [pdfDoc, scale])

  useEffect(() => {
    renderPage(currentPage)
  }, [currentPage, renderPage])

  // Anti-copy measures
  useEffect(() => {
    const prevent     = (e: Event)       => e.preventDefault()
    const preventKeys = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'a'].includes(e.key)) e.preventDefault()
    }
    document.addEventListener('contextmenu', prevent)
    document.addEventListener('keydown', preventKeys)
    return () => {
      document.removeEventListener('contextmenu', prevent)
      document.removeEventListener('keydown', preventKeys)
    }
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-96 text-gray-500">
      Cargando libro...
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center h-96 text-red-500">
      {error}
    </div>
  )

  return (
    <div className="no-select no-print flex flex-col items-center w-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 bg-gray-800 text-white px-3 py-1 rounded-lg mb-3 text-sm w-full justify-center">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-700 rounded disabled:opacity-40"
        >
          ←
        </button>
        <span className="text-xs tabular-nums">
          {currentPage} / {numPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-700 rounded disabled:opacity-40"
        >
          →
        </button>
        <span className="w-px h-4 bg-gray-600 mx-1" />
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-700 rounded"
        >
          −
        </button>
        <span className="text-xs tabular-nums w-10 text-center">{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-700 rounded"
        >
          +
        </button>
      </div>

      {/* Canvas — overflow-x:auto so manual zoom doesn't clip */}
      <div ref={containerRef} className="w-full overflow-x-auto shadow-lg">
        <canvas ref={canvasRef} />
      </div>
    </div>
  )
}
