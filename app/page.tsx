import { createClient } from '@/lib/supabase/server'
import { BookGrid } from '@/components/catalog/BookGrid'
import { BookOpen, ShoppingCart, CreditCard, Mail, MapPin, Phone, Clock } from 'lucide-react'

export const revalidate = 60

const HOW_IT_WORKS = [
  { icon: BookOpen,     step: '01', text: 'Elegí tu libro del catálogo' },
  { icon: ShoppingCart, step: '02', text: 'Agregalo al carrito' },
  { icon: CreditCard,   step: '03', text: 'Pagá de forma segura con MercadoPago' },
  { icon: Mail,         step: '04', text: 'Recibís el acceso por email al instante' },
]

const HOURS = [
  { day: 'Lunes', hours: '10:00 – 17:00' },
  { day: 'Martes', hours: '10:00 – 17:00' },
  { day: 'Miércoles', hours: '10:00 – 17:00' },
  { day: 'Jueves', hours: '10:00 – 17:00' },
  { day: 'Viernes', hours: '10:00 – 17:00' },
  { day: 'Sábado', hours: '10:00 – 13:00' },
  { day: 'Domingo', hours: 'Cerrado' },
]

export default async function HomePage() {
  const supabase = await createClient()
  const { data: books } = await supabase
    .from('books')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  return (
    <>
      {/* ¿Cómo funciona? — bordeaux prominente */}
      <section id="como-funciona" className="bg-[#6B0F0F] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10">
          <p className="text-[#E8B4A0] text-xs font-semibold uppercase tracking-[0.2em] mb-6">
            ¿Cómo funciona?
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {HOW_IT_WORKS.map(({ icon: Icon, step, text }) => (
              <div key={step} className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[#E8B4A0] text-xs font-bold">{step}</span>
                  <Icon className="h-4 w-4 text-[#E8B4A0]" />
                </div>
                <p className="text-sm text-white/80 leading-snug">{text}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Catálogo */}
      <main className="max-w-5xl mx-auto px-4 py-10">
        <BookGrid books={books ?? []} />
      </main>

      {/* Datos de la librería + mapa */}
      <section className="border-t border-gray-100 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-[0.2em] mb-8">
            Nuestra librería
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Info */}
            <div className="space-y-5">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-[#6B0F0F] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">3 de Febrero 1065</p>
                  <p className="text-gray-500 text-sm">S2000BKU Santa Fe, Provincia de Santa Fe</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-[#6B0F0F] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-900 font-semibold">0341 449-8802</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Clock className="h-5 w-5 text-[#6B0F0F] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm mb-2">Horarios de atención</p>
                  <div className="space-y-1">
                    {HOURS.map(({ day, hours }) => (
                      <div key={day} className="flex justify-between gap-8 text-sm">
                        <span className={hours === 'Cerrado' ? 'text-gray-400' : 'text-gray-600'}>{day}</span>
                        <span className={hours === 'Cerrado' ? 'text-gray-400 italic' : 'text-gray-900 font-medium'}>{hours}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa */}
            <div className="rounded-xl overflow-hidden border border-gray-200 h-[300px] md:h-auto min-h-[280px]">
              <iframe
                src="https://maps.google.com/maps?q=3+de+Febrero+1065,+Santa+Fe,+Argentina&t=&z=16&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Ubicación Laborde Editorial"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
