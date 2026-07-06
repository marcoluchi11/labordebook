'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ViewerLoading } from './ViewerLoading'

interface Props {
  bookId: string
  bookTitle?: string
  preview?: boolean
  bookSlug?: string
}

export function PDFViewer({ bookId, bookTitle, preview = false, bookSlug }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef    = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfViewerRef = useRef<any>(null)

  const [currentPage,  setCurrentPage]  = useState(1)
  const [numPages,     setNumPages]     = useState(0)
  const [scale,        setScale]        = useState(100)
  const [loading,      setLoading]      = useState(true)
  const [loadingProgress, setLoadingProgress] = useState<number | null>(null)
  const [error,        setError]        = useState<string | null>(null)
  const [showTutorial,     setShowTutorial]     = useState(false)
  const [paywallDismissed, setPaywallDismissed] = useState(false)

  const buyHref = bookSlug ? `/books/${bookSlug}` : '/'
  const showPaywall = preview && numPages > 0 && currentPage >= numPages && !paywallDismissed

  useEffect(() => {
    const ac = new AbortController()

    async function init() {
      try {
        setLoadingProgress(null)
        const res = await fetch(`/api/${preview ? 'preview' : 'viewer'}/${bookId}/session`)
        if (!res.ok) throw new Error('No autorizado')
        const { url } = await res.json()

        const pdfjsLib = await import('pdfjs-dist')
        pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

        const { PDFViewer, EventBus, PDFLinkService } = await import('pdfjs-dist/web/pdf_viewer.mjs')

        if (ac.signal.aborted) return

        const eventBus   = new EventBus()
        const linkService = new PDFLinkService({ eventBus })

        const container = containerRef.current!
        const viewer    = viewerRef.current!

        const pdfViewer = new PDFViewer({
          container,
          viewer,
          eventBus,
          linkService,
          removePageBorders: false,
          textLayerMode: 0,
          // pdf.js caps canvas resolution on iOS/Android to ~5.2M px by default,
          // rendering below native devicePixelRatio and making pages look blurry
          // on phones/tablets. -1 removes the cap (unbounded, matches full DPR).
          maxCanvasPixels: -1,
        })
        linkService.setViewer(pdfViewer)
        pdfViewerRef.current = pdfViewer

        eventBus.on('pagechanging', (evt: { pageNumber: number }) => {
          setCurrentPage(evt.pageNumber)
        })
        eventBus.on('scalechanging', (evt: { scale: number }) => {
          setScale(Math.round(evt.scale * 100))
        })

        const loadingTask = pdfjsLib.getDocument({ url, withCredentials: false, disableRange: true, disableStream: true })
        loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (total > 0) {
            setLoadingProgress(Math.min(100, Math.round((loaded / total) * 100)))
          }
        }
        const pdfDoc = await loadingTask.promise
        if (ac.signal.aborted) return

        setNumPages(pdfDoc.numPages)
        pdfViewer.setDocument(pdfDoc)
        linkService.setDocument(pdfDoc)

        const saved = localStorage.getItem(`viewer_zoom_${bookId}`)
        pdfViewer.currentScaleValue = saved ?? 'page-width'

        if (!localStorage.getItem('viewer_tutorial_shown')) {
          setShowTutorial(true)
        }

        setLoading(false)
      } catch {
        if (!ac.signal.aborted) {
          setError('No se pudo cargar el libro. Verificá tu conexión.')
          setLoading(false)
        }
      }
    }

    init()
    return () => ac.abort()
  }, [bookId, preview])

  function dismissTutorial() {
    setShowTutorial(false)
    localStorage.setItem('viewer_tutorial_shown', '1')
  }

  function prevPage() {
    if (pdfViewerRef.current && currentPage > 1) {
      pdfViewerRef.current.currentPageNumber = currentPage - 1
    }
  }

  function nextPage() {
    if (pdfViewerRef.current && currentPage < numPages) {
      pdfViewerRef.current.currentPageNumber = currentPage + 1
    }
  }

  function zoomIn() {
    if (!pdfViewerRef.current) return
    const next = Math.min(3, pdfViewerRef.current.currentScale + 0.1)
    pdfViewerRef.current.currentScaleValue = String(next)
    localStorage.setItem(`viewer_zoom_${bookId}`, String(next))
  }

  function zoomOut() {
    if (!pdfViewerRef.current) return
    const next = Math.max(0.25, pdfViewerRef.current.currentScale - 0.1)
    pdfViewerRef.current.currentScaleValue = String(next)
    localStorage.setItem(`viewer_zoom_${bookId}`, String(next))
  }

  function resetZoom() {
    if (!pdfViewerRef.current) return
    pdfViewerRef.current.currentScaleValue = 'page-width'
    localStorage.removeItem(`viewer_zoom_${bookId}`)
  }

  // Anti-copy / anti-print
  useEffect(() => {
    const prevent     = (e: Event)         => e.preventDefault()
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

  return (
    <div className="fixed inset-0 flex flex-col bg-gray-900 no-select no-print">

      {/* Loading overlay */}
      {loading && <ViewerLoading className="absolute inset-0 z-40" progress={loadingProgress} />}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 z-40 bg-gray-900 flex items-center justify-center text-red-400 px-6 text-center">
          {error}
        </div>
      )}

      {showTutorial && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <p className="text-2xl mb-3">📖</p>
            <h2 className="text-white font-semibold text-lg mb-3">Cómo navegar</h2>
            <div className="text-gray-300 text-sm leading-relaxed space-y-2 mb-5 text-left">
              <p>• Scrolleá para avanzar por el libro.</p>
              <p>• Usá <strong className="text-white">‹ ›</strong> para saltar de página en página.</p>
              <p>• En mobile podés pellizcar para hacer zoom.</p>
              <p>• Los botones <strong className="text-white">− +</strong> ajustan el tamaño del texto.</p>
            </div>
            <button
              onClick={dismissTutorial}
              className="bg-white text-gray-900 font-medium px-6 py-2.5 rounded-lg w-full hover:bg-gray-100 transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {/* Preview mode banner */}
      {preview && !loading && !error && (
        <div
          className="shrink-0 bg-amber-400 text-gray-900 text-xs sm:text-sm font-medium flex items-center justify-between gap-2 px-3 py-2"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 8px)' }}
        >
          <span>Estás leyendo una muestra gratuita</span>
          <Link
            href={buyHref}
            className="shrink-0 min-h-[44px] flex items-center bg-gray-900 text-white text-xs font-semibold px-3 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Comprar libro
          </Link>
        </div>
      )}

      {showPaywall && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
          <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
            <p className="text-2xl mb-3">🔒</p>
            <h2 className="text-white font-semibold text-lg mb-3">Llegaste al final de la muestra</h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-5">
              Comprá el libro para seguir leyendo online y descargar tu copia.
            </p>
            <div className="flex flex-col gap-2.5">
              <Link
                href={buyHref}
                className="bg-white text-gray-900 font-medium px-6 py-2.5 rounded-lg w-full hover:bg-gray-100 transition-colors"
              >
                Comprar libro completo
              </Link>
              <button
                onClick={() => setPaywallDismissed(true)}
                className="text-gray-400 text-sm hover:text-gray-200 transition-colors py-1"
              >
                Seguir viendo la muestra
              </button>
            </div>
          </div>
        </div>
      )}

      {/*
        PDFViewer requirement: container must be position:absolute.
        The container div must always be in the DOM so refs are available
        before the viewer is initialized. Loading/error overlays sit above it.
      */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          style={{ position: 'absolute', inset: 0, overflow: 'auto' }}
        >
          <div ref={viewerRef} className="pdfViewer" />
        </div>
      </div>

      {/* Bottom toolbar */}
      <div
        className="shrink-0 bg-gray-800/95 backdrop-blur-sm flex items-center justify-between px-2 gap-1"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 6px)', paddingTop: '6px' }}
      >
        <div className="flex items-center gap-1">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 text-lg"
          >
            ‹
          </button>
          <span className="text-gray-300 text-xs tabular-nums min-w-[52px] text-center">
            {currentPage} / {numPages}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= numPages}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-gray-700 rounded-lg disabled:opacity-30 text-lg"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-gray-700 rounded-lg text-lg"
          >
            −
          </button>
          <button
            onClick={resetZoom}
            className="text-gray-300 text-xs tabular-nums min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-gray-700 rounded-lg"
          >
            {scale}%
          </button>
          <button
            onClick={zoomIn}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-white hover:bg-gray-700 rounded-lg text-lg"
          >
            +
          </button>
        </div>

        <Link
          href="/"
          className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white rounded-lg text-sm"
          title={bookTitle ?? 'Volver'}
        >
          ⌂
        </Link>
      </div>
    </div>
  )
}
