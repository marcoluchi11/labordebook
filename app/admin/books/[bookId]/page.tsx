import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { BookUploadForm } from '@/components/admin/BookUploadForm'

interface Props {
  params: Promise<{ bookId: string }>
}

export default async function EditBookPage({ params }: Props) {
  const { bookId } = await params
  const supabase = createServiceRoleClient()

  const { data: book } = await supabase
    .from('books')
    .select('*')
    .eq('id', bookId)
    .single()

  if (!book) notFound()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar: {book.title}</h1>
      <BookUploadForm
        bookId={book.id}
        defaultValues={{
          title: book.title,
          author: book.author,
          description: book.description ?? '',
          long_description: book.long_description ?? '',
          price: book.price,
          language: book.language as 'es' | 'en' | 'pt',
          tags: book.tags.join(', '),
          is_published: book.is_published,
        }}
      />
    </div>
  )
}
