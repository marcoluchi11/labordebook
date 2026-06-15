import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  author: z.string().min(1).optional(),
  description: z.string().optional(),
  long_description: z.string().optional(),
  price: z.number().min(1).optional(),
  language: z.string().optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  cover_url: z.string().optional(),
  epub_path: z.string().optional(),
})

interface Params {
  params: Promise<{ bookId: string }>
}

async function requireAdmin(supabase: ReturnType<typeof createServiceRoleClient>) {
  const supabaseAuth = await createClient()
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return null
  const { data } = await supabase.from('admin_users').select('id').eq('id', user.id).single()
  return data ? user : null
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const { bookId } = await params
  const supabase = createServiceRoleClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  const { data: book, error } = await supabase
    .from('books')
    .update(parsed.data)
    .eq('id', bookId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(book)
}

export async function DELETE(request: NextRequest, { params }: Params) {
  const { bookId } = await params
  const supabase = createServiceRoleClient()
  const admin = await requireAdmin(supabase)
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { error } = await supabase.from('books').delete().eq('id', bookId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
