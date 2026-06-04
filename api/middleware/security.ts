import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import xss from 'xss'

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: '登录尝试过多，请15分钟后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: '注册尝试过多，请1小时后再试' },
  standardHeaders: true,
  legacyHeaders: false,
})

export const helmetMiddleware = helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
})

export function sanitizeInput(obj: any): any {
  if (typeof obj === 'string') return xss(obj)
  if (Array.isArray(obj)) return obj.map(sanitizeInput)
  if (obj && typeof obj === 'object') {
    const sanitized: any = {}
    for (const key of Object.keys(obj)) {
      sanitized[key] = sanitizeInput(obj[key])
    }
    return sanitized
  }
  return obj
}

export function sanitizeMiddleware(req: any, res: any, next: any) {
  if (req.body) req.body = sanitizeInput(req.body)
  if (req.query) req.query = sanitizeInput(req.query)
  if (req.params) req.params = sanitizeInput(req.params)
  next()
}
