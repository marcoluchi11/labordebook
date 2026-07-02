'use client'

import { useState, useEffect } from 'react'
import { ViewerLoading } from './ViewerLoading'

type PDFViewerType = React.ComponentType<{
  bookId: string
  bookTitle?: string
  preview?: boolean
  bookSlug?: string
}>

interface Props {
  bookId: string
  bookTitle?: string
  preview?: boolean
  bookSlug?: string
}

export function PDFViewerWrapper({ bookId, bookTitle, preview, bookSlug }: Props) {
  const [Viewer, setViewer] = useState<PDFViewerType | null>(null)

  useEffect(() => {
    import('./PDFViewer')
      .then(m => setViewer(() => m.PDFViewer))
      .catch(err => console.error('[PDFViewerWrapper] Error cargando PDFViewer:', err))
  }, [])

  if (!Viewer) {
    return <ViewerLoading />
  }

  return <Viewer bookId={bookId} bookTitle={bookTitle} preview={preview} bookSlug={bookSlug} />
}
