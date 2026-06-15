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

export function BookUploadForm({ bookId, defaultValues }: BookUploadFormProps) {
  const router = useRouter()
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [epubFile, setEpubFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: { language: 'es', ...defaultValues },
  })

  const onDropPdf = useCallback((files: File[]) => setPdfFile(files[0] ?? null), [])
  const onDropEpub = useCallback((files: File[]) => setEpubFile(files[0] ?? null), [])
  const onDropCover = useCallback((files: File[]) => setCoverFile(files[0] ?? null), [])

  const { getRootProps: getPdfProps, getInputProps: getPdfInput, isDragActive: isPdfActive } = useDropzone({
    onDrop: onDropPdf, accept: { 'application/pdf': ['.pdf'] }, maxFiles: 1,
  })
  const { getRootProps: getEpubProps, getInputProps: getEpubInput, isDragActive: isEpubActive } = useDropzone({
    onDrop: onDropEpub, accept: { 'application/epub+zip': ['.epub'] }, maxFiles: 1,
  })
  const { getRootProps: getCoverProps, getInputProps: getCoverInput, isDragActive: isCoverActive } = useDropzone({
    onDrop: onDropCover, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp'] }, maxFiles: 1,
  })

  async function onSubmit(data: FormData) {
    if (!bookId && !pdfFile) {
      setError('El archivo PDF es requerido')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Get signed upload URLs from server
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

      // Upload files in parallel
      await Promise.all([
        pdfFile && pdfUploadUrl ? uploadFile(pdfFile, pdfUploadUrl) : null,
        epubFile && epubUploadUrl ? uploadFile(epubFile, epubUploadUrl) : null,
        coverFile && coverUploadUrl ? uploadFile(coverFile, coverUploadUrl) : null,
      ])

      // Create/update book record
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Idioma</label>
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

      {/* File uploads */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">PDF {!bookId && '*'}</label>
          <div {...getPdfProps()} className={dropZoneClass(isPdfActive)}>
            <input {...getPdfInput()} />
            {pdfFile ? <p className="text-gray-700">✓ {pdfFile.name}</p> : <p className="text-gray-400">Arrastrá el PDF acá o hacé click para seleccionar</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">EPUB (opcional)</label>
          <div {...getEpubProps()} className={dropZoneClass(isEpubActive)}>
            <input {...getEpubInput()} />
            {epubFile ? <p className="text-gray-700">✓ {epubFile.name}</p> : <p className="text-gray-400">Arrastrá el EPUB acá (opcional)</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Portada (imagen)</label>
          <div {...getCoverProps()} className={dropZoneClass(isCoverActive)}>
            <input {...getCoverInput()} />
            {coverFile ? <p className="text-gray-700">✓ {coverFile.name}</p> : <p className="text-gray-400">Arrastrá la imagen de portada</p>}
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
