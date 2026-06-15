import { createClient } from '@/lib/supabase/server'
import { BookGrid } from '@/components/catalog/BookGrid'
import { BookOpen, ShoppingCart, CreditCard, Mail } from 'lucide-react'

export const revalidate = 60

const HOW_IT_WORKS = [
  { icon: BookOpen,    step: '1', text: 'Elegí tu libro del catálogo' },
  { icon: ShoppingCart, step: '2', text: 'Agregalo al carrito' },
  { icon: CreditCard,  step: '3', text: 'Pagá de forma segura con MercadoPago' },
  { icon: Mail,        step: '4', text: 'Recibís el acceso por email al instante' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <main className="max-w-5xl mx-auto px-4 py-10">
      <BookGrid books={books ?? []} />

      <section id="como-funciona" className="mt-16 bg-gray-50 rounded-2xl px-6 py-8">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">
          ¿Cómo funciona?
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {HOW_IT_WORKS.map(({ icon: Icon, step, text }) => (
            <div key={step} className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-300">{step}</span>
                <Icon className="h-4 w-4 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 leading-snug">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
