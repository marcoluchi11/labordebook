'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'

const schema = z.object({
  title: z.string().min(1, 'Requerido'),
  author: z.string().min(1, 'Requerido'),
  description: z.string().min(1, 'Requerido'),
  long_description: z.string().optional(),
  price: z.coerce.number().min(1, 'El precio debe ser mayor a 0'),
  language: z.enum(['es', 'en', 'pt']),
  publisher: z.string().min(1, 'Requerido'),
  published_year: z.coerce.number().int().min(1000, 'Año inválido').max(new Date().getFullYear(), 'Año inválido'),
  page_count: z.coerce.number().int().min(1, 'Requerido'),
  tags: z.string().optional(),
  is_published: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface BookUploadFormProps {
  bookId?: string
  defaultValues?: Partial<FormData>
}

async function uploadFile(file: File, uploadUrl: string): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  })
  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)
}

async function extractFromPdf(file: File): Promise<{ title?: string; author?: string; pages?: number }> {
  try {
    const { PDFDocument } = await import('pdf-lib')
    const pdf = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true })
    return {
      title: pdf.getTitle() || undefined,
      author: pdf.getAuthor() || undefined,
      pages: pdf.getPageCount() || undefined,
    }
  } catch {
    return {}
  }
}

async function extractFromEpub(file: File): Promise<{ title?: string; author?: string }> {
  try {
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(await file.arrayBuffer())
    const container = await zip.file('META-INF/container.xml')?.async('text')
    if (!container) return {}
    const opfPath = container.match(/full-path="([^"]+)"/)?.[1]
    if (!opfPath) return {}
    const opf = await zip.file(opfPath)?.async('text')
    if (!opf) return {}
    const get = (tag: string) => opf.match(new RegExp(`<dc:${tag}[^>]*>([^<]+)<`, 'i'))?.[1]?.trim()
    return { title: get('title'), author: get('creator') }
  } catch {
    return {}
  }
}

function cleanFilename(name: string): string {
  return name.replace(/\.(pdf|epub)$/i, '').replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim()
}

type LookupStatus = 'idle' | 'loading' | 'found' | 'not-found'

export function BookUploadForm({ bookId, defaultValues }: BookUploadFormProps) {
  const router = useRouter()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [epubFile, setEpubFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle')
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { language: 'es', ...defaultValues },
  })

  async function lookupBook(query: string, knownPages?: number) {
    setLookupStatus('loading')
    setCoverPreview(null)
    try {
      const res = await fetch(`/api/admin/lookup-book?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      if (!data) { setLookupStatus('not-found'); return }

      if (data.title) setValue('title', data.title)
      if (data.author) setValue('author', data.author)
      if (data.publisher) setValue('publisher', data.publisher)
      if (data.published_year) setValue('published_year', data.published_year)
      if (data.page_count) setValue('page_count', data.page_count)
      else if (knownPages) setValue('page_count', knownPages)
      if (data.description) setValue('description', data.description)
      if (data.long_description) setValue('long_description', data.long_description)
      if (data.language && ['es', 'en', 'pt'].includes(data.language)) {
        setValue('language', data.language as 'es' | 'en' | 'pt')
      }
      if (data.cover_url) setCoverPreview(data.cover_url)

      setLookupStatus('found')
    } catch {
      setLookupStatus('not-found')
    }
  }

  const onDropPdf = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setPdfFile(file)
    if (bookId) return // don't auto-lookup on edit
    const meta = await extractFromPdf(file)
    const query = meta.title ?? cleanFilename(file.name)
    await lookupBook(query, meta.pages)
  }, [bookId]) // eslint-disable-line react-hooks/exhaustive-deps

  const onDropEpub = useCallback(async (files: File[]) => {
    const file = files[0]
    if (!file) return
    setEpubFile(file)
    if (bookId) return // don't auto-lookup on edit
    if (lookupStatus === 'found') return // PDF already found data
    const meta = await extractFromEpub(file)
    const query = meta.title ?? cleanFilename(file.name)
    await lookupBook(query)
  }, [bookId, lookupStatus]) // eslint-disable-line react-hooks/exhaustive-deps

  const onDropCover = useCallback((files: File[]) => {
    setCoverFile(files[0] ?? null)
    setCoverPreview(null) // clear Google Books preview when user picks their own
  }, [])

  async function useSuggestedCover() {
    if (!coverPreview) return
    try {
      const res = await fetch(`/api/admin/proxy-cover?url=${encodeURIComponent(coverPreview)}`)
      const blob = await res.blob()
      const file = new File([blob], 'cover.jpg', { type: 'image/jpeg' })
      setCoverFile(file)
      setCoverPreview(null)
    } catch {
      // silently ignore — user can upload manually
    }
  }

  async function onSubmit(data: FormData) {
    if (!bookId && !pdfFile && !epubFile) {
      setError('Debés subir al menos un archivo: PDF o EPUB')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const uploadRes = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hasPdf: !!pdfFile,
          hasEpub: !!epubFile,
          hasCover: !!coverFile,
          bookId,
        }),
      })

      if (!uploadRes.ok) throw new Error('Error al obtener URLs de carga')
      const { pdfUploadUrl, epubUploadUrl, coverUploadUrl, pdfPath, epubPath, coverUrl } = await uploadRes.json()

      await Promise.all([
        pdfFile && pdfUploadUrl ? uploadFile(pdfFile, pdfUploadUrl) : null,
        epubFile && epubUploadUrl ? uploadFile(epubFile, epubUploadUrl) : null,
        coverFile && coverUploadUrl ? uploadFile(coverFile, coverUploadUrl) : null,
      ])

      const bookRes = await fetch(bookId ? `/api/admin/books/${bookId}` : '/api/admin/books', {
        method: bookId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
          pdf_path: pdfPath ?? undefined,
          epub_path: epubPath ?? undefined,
          cover_url: coverUrl ?? undefined,
        }),
      })

      if (!bookRes.ok) throw new Error('Error al guardar el libro')

      router.push('/admin/books')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const dropZoneClass = (active: boolean) =>
    `border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer transition-colors ${
      active ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
    }`

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl space-y-6">

      {/* File uploads — first, so lookup fires before the user touches anything */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            PDF {!bookId && <span className="text-gray-400">(al menos uno)</span>}
          </label>
          <FileDropzone
            onDrop={onDropPdf}
            accept={{ 'application/pdf': ['.pdf'] }}
            file={pdfFile}
            placeholder="Arrastrá el PDF acá o hacé click para seleccionar"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            EPUB {!bookId && <span className="text-gray-400">(al menos uno)</span>}
          </label>
          <FileDropzone
            onDrop={onDropEpub}
            accept={{ 'application/epub+zip': ['.epub'] }}
            file={epubFile}
            placeholder="Arrastrá el EPUB acá (opcional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portada (imagen)</label>
          <FileDropzone
            onDrop={onDropCover}
            accept={{ 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }}
            file={coverFile}
            placeholder="Arrastrá la imagen de portada"
          />

          {/* Google Books cover suggestion */}
          {coverPreview && !coverFile && (
            <div className="mt-3 flex items-center gap-4 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/admin/proxy-cover?url=${encodeURIComponent(coverPreview)}`}
                alt="Portada sugerida"
                width={48}
                height={64}
                className="rounded object-cover shrink-0 w-12 h-16"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-blue-900">Portada encontrada en Google Books</p>
                <p className="text-xs text-blue-600 mt-0.5">Podés usarla o subir la tuya propia.</p>
              </div>
              <button
                type="button"
                onClick={useSuggestedCover}
                className="shrink-0 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Usar esta
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lookup status banner */}
      {lookupStatus === 'loading' && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-600">
          <span className="animate-spin text-base">⏳</span>
          Buscando datos del libro en Google Books…
        </div>
      )}
      {lookupStatus === 'found' && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm text-green-800">
          <span>✓</span>
          Datos completados automáticamente — revisá que todo esté bien antes de guardar.
        </div>
      )}
      {lookupStatus === 'not-found' && (
        <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800">
          <span>⚠</span>
          No encontré datos automáticamente. Completá los campos manualmente.
        </div>
      )}

      {/* Book fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
          <input {...register('title')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Autor *</label>
          <input {...register('author')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio (ARS) *</label>
          <input {...register('price')} type="number" min="1" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta *</label>
          <textarea {...register('description')} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
          {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción larga</label>
          <textarea {...register('long_description')} rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Idioma *</label>
          <select {...register('language')} className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900">
            <option value="es">Español</option>
            <option value="en">Inglés</option>
            <option value="pt">Portugués</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (separados por coma)</label>
          <input {...register('tags')} placeholder="ficción, aventura, ..." className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
      </div>

      {/* Detalles del libro */}
      <div>
        <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Detalles del libro</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Editorial *</label>
            <input {...register('publisher')} placeholder="Ej: Paidós" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {errors.publisher && <p className="text-red-500 text-xs mt-1">{errors.publisher.message}</p>}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Año de publicación *</label>
            <input {...register('published_year')} type="number" min="1000" max={new Date().getFullYear()} placeholder="Ej: 2023" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {errors.published_year && <p className="text-red-500 text-xs mt-1">{errors.published_year.message}</p>}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Número de páginas *</label>
            <input {...register('page_count')} type="number" min="1" placeholder="Ej: 320" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-900" />
            {errors.page_count && <p className="text-red-500 text-xs mt-1">{errors.page_count.message}</p>}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input type="checkbox" id="published" {...register('is_published')} className="rounded" />
        <label htmlFor="published" className="text-sm text-gray-700">Publicar inmediatamente</label>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : bookId ? 'Guardar cambios' : 'Crear libro'}
      </button>
    </form>
  )
}

// Small internal component to avoid repeating dropzone boilerplate
function FileDropzone({
  onDrop,
  accept,
  file,
  placeholder,
}: {
  onDrop: (files: File[]) => void
  accept: Record<string, string[]>
  file: File | null
  placeholder: string
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept, maxFiles: 1 })
  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-4 text-center text-sm cursor-pointer transition-colors ${
        isDragActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-400'
      }`}
    >
      <input {...getInputProps()} />
      {file ? <p className="text-gray-700">✓ {file.name}</p> : <p className="text-gray-400">{placeholder}</p>}
    </div>
  )
}
