import { createHmac } from 'crypto'

// Verifies MP webhook signature to prevent spoofed requests.
// Spec: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
export function verifyMPSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  secret: string
): boolean {
  if (!xSignature || !xRequestId) return false

  const parts = Object.fromEntries(
    xSignature.split(',').map((p) => p.split('=') as [string, string])
  )
  const ts = parts['ts']
  const v1 = parts['v1']
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  return expected === v1
}
