'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface PDFViewerProps {
  bookId: string
}

export function PDFViewer({ bookId }: PDFViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pdfDoc, setPdfDoc] = useState<import('pdfjs-dist').PDFDocumentProxy | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [scale, setScale] = useState(1.2)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const renderTaskRef = useRef<import('pdfjs-dist').RenderTask | null>(null)

  // Load PDF.js and the document
  useEffect(() => {
    let cancelled = false

    async function loadPdf() {
      try {
        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`

        // Get short-lived signed URL from our session endpoint
        const res = await fetch(`/api/viewer/${bookId}/session`)
        if (!res.ok) throw new Error('No autorizado')

        const { url } = await res.json()

        const doc = await pdfjsLib.getDocument({ url, withCredentials: false }).promise
        if (cancelled) return

        setPdfDoc(doc)
        setNumPages(doc.numPages)
        setLoading(false)
      } catch (err) {
        if (!cancelled) {
          setError('No se pudo cargar el libro. Verificá tu conexión.')
          setLoading(false)
        }
      }
    }

    loadPdf()
    return () => { cancelled = true }
  }, [bookId])

  // Render current page
  const renderPage = useCallback(async (pageNum: number) => {
    if (!pdfDoc || !canvasRef.current) return

    // Cancel any in-progress render
    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel() } catch { /* ok */ }
    }

    const page = await pdfDoc.getPage(pageNum)
    const viewport = page.getViewport({ scale })
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.height = viewport.height
    canvas.width = viewport.width

    const renderContext = { canvasContext: ctx, viewport, canvas: canvas }
    const renderTask = page.render(renderContext)
    renderTaskRef.current = renderTask

    try {
      await renderTask.promise
    } catch (err: unknown) {
      // RenderingCancelledException is expected when navigating quickly
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
    const prevent = (e: Event) => e.preventDefault()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Cargando libro...
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="no-select no-print flex flex-col items-center">
      {/* Toolbar */}
      <div className="flex items-center gap-4 bg-gray-800 text-white px-4 py-2 rounded-lg mb-4 text-sm">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage <= 1}
          className="px-2 py-1 hover:bg-gray-700 rounded disabled:opacity-40"
        >
          ←
        </button>
        <span>
          Página {currentPage} de {numPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(numPages, p + 1))}
          disabled={currentPage >= numPages}
          className="px-2 py-1 hover:bg-gray-700 rounded disabled:opacity-40"
        >
          →
        </button>
        <span className="w-px h-4 bg-gray-600" />
        <button
          onClick={() => setScale((s) => Math.max(0.5, s - 0.2))}
          className="px-2 py-1 hover:bg-gray-700 rounded"
        >
          −
        </button>
        <span>{Math.round(scale * 100)}%</span>
        <button
          onClick={() => setScale((s) => Math.min(3, s + 0.2))}
          className="px-2 py-1 hover:bg-gray-700 rounded"
        >
          +
        </button>
      </div>

      {/* Canvas */}
      <div className="shadow-lg">
        <canvas ref={canvasRef} className="max-w-full" />
      </div>
    </div>
  )
}
