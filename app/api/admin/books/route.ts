import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

const createSchema = z.object({
  title: z.string().min(1),
  author: z.string().min(1),
  description: z.string().min(1),
  long_description: z.string().optional(),
  price: z.number().min(1),
  language: z.string().default('es'),
  publisher: z.string().min(1),
  published_year: z.number().int().min(1000).max(2100),
  page_count: z.number().int().min(1),
  tags: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
  pdf_path: z.string().optional(),
  epub_path: z.string().optional(),
  cover_url: z.string().optional(),
}).refine((d) => d.pdf_path || d.epub_path, {
  message: 'Debés subir al menos un archivo: PDF o EPUB',
})

async function requireAdmin(supabase: ReturnType<typeof createServiceRoleClient>) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admin_users').select('id').eq('id', user.id).single()
  return data ? user : null
}

export async function GET() {
  const supabase = createServiceRoleClient()
  const { data: books } = await supabase.from('books').select('*').order('created_at', { ascending: false })
  return NextResponse.json(books ?? [])
}

export async function POST(request: NextRequest) {
  const supabase = createServiceRoleClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos', details: parsed.error.flatten() }, { status: 400 })

  // Generate slug from title
  const slug = parsed.data.title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 60)

  const { data: book, error } = await supabase
    .from('books')
    .insert({ ...parsed.data, slug })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(book, { status: 201 })
}
