'use client'

import { useState, useEffect } from 'react'

type PDFViewerType = React.ComponentType<{ bookId: string; bookTitle?: string }>

export function PDFViewerWrapper({ bookId, bookTitle }: { bookId: string; bookTitle?: string }) {
  const [Viewer, setViewer] = useState<PDFViewerType | null>(null)

  useEffect(() => {
    import('./PDFViewer').then(m => setViewer(() => m.PDFViewer))
  }, [])

  if (!Viewer) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center text-gray-400">
        Cargando libro…
      </div>
    )
  }

  return <Viewer bookId={bookId} bookTitle={bookTitle} />
}
