'use client'

import { useState, useEffect } from 'react'

type PDFViewerType = React.ComponentType<{ bookId: string }>

export function PDFViewerWrapper({ bookId }: { bookId: string }) {
  const [Viewer, setViewer] = useState<PDFViewerType | null>(null)

  useEffect(() => {
    import('./PDFViewer').then(m => setViewer(() => m.PDFViewer))
  }, [])

  if (!Viewer) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-500">
        Cargando libro...
      </div>
    )
  }

  return <Viewer bookId={bookId} />
}
