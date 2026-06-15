import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

let redis: Redis | null = null
let checkoutLimiter: Ratelimit | null = null
let viewerLimiter: Ratelimit | null = null
let downloadLimiter: Ratelimit | null = null

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL ?? ''
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? ''
const IS_CONFIGURED = REDIS_URL.startsWith('https://')

// No-op limiter for dev environments without Upstash configured
const devPassthrough = { limit: async () => ({ success: true }) } as unknown as Ratelimit

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN })
  }
  return redis
}

export function getCheckoutLimiter(): Ratelimit {
  if (!IS_CONFIGURED) return devPassthrough
  if (!checkoutLimiter) {
    checkoutLimiter = new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'rl:checkout' })
  }
  return checkoutLimiter
}

export function getViewerLimiter(): Ratelimit {
  if (!IS_CONFIGURED) return devPassthrough
  if (!viewerLimiter) {
    viewerLimiter = new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(20, '1 h'), prefix: 'rl:viewer' })
  }
  return viewerLimiter
}

export function getDownloadLimiter(): Ratelimit {
  if (!IS_CONFIGURED) return devPassthrough
  if (!downloadLimiter) {
    downloadLimiter = new Ratelimit({ redis: getRedis(), limiter: Ratelimit.slidingWindow(10, '1 h'), prefix: 'rl:download' })
  }
  return downloadLimiter
}

export function getClientIp(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown'
  )
}
