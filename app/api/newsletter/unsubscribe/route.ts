import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.redirect(new URL('/newsletter/unsubscribed?error=1', request.url))
  }

  const supabase = createServiceRoleClient()

  const { error } = await supabase
    .from('newsletter_subscribers')
    .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .eq('is_active', true)

  if (error) {
    return NextResponse.redirect(new URL('/newsletter/unsubscribed?error=1', request.url))
  }

  return NextResponse.redirect(new URL('/newsletter/unsubscribed', request.url))
}
