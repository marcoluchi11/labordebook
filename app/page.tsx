import { createClient } from '@/lib/supabase/server'
import { BookGrid } from '@/components/catalog/BookGrid'

export const revalidate = 60

export default async function HomePage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <header className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Librería</h1>
        <p className="text-gray-500 mt-2">Ebooks disponibles para compra y lectura inmediata.</p>
      </header>
      <BookGrid books={books ?? []} />
    </main>
  )
}
