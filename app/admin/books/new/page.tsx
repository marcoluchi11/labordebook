import { BookUploadForm } from '@/components/admin/BookUploadForm'

export default function NewBookPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo libro</h1>
      <BookUploadForm />
    </div>
  )
}
