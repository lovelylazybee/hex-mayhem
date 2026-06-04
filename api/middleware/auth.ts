import { type Request, type Response, type NextFunction } from 'express'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'hxm-s7-$3cur3-k3y-2026!@#zXcVbN'
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'hxm-s7-r3fr3sh-k3y-2026!@#mNbVcXz'
const JWT_EXPIRES_IN = '2h'
const JWT_REFRESH_EXPIRES_IN = '30d'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number
        username: string
        role: string
      }
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: '未提供认证令牌' })
    return
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; role: string }
    req.user = decoded
    next()
  } catch {
    res.status(401).json({ success: false, error: '令牌无效或已过期' })
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, error: '需要管理员权限' })
    return
  }
  next()
}

export function generateToken(user: { id: number; username: string; role: string }): string {
  return jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function generateRefreshToken(user: { id: number; username: string; role: string }): string {
  return jwt.sign({ id: user.id, username: user.username, role: user.role, type: 'refresh' }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN })
}

export function verifyRefreshToken(token: string): { id: number; username: string; role: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as any
    if (decoded.type !== 'refresh') return null
    return { id: decoded.id, username: decoded.username, role: decoded.role }
  } catch {
    return null
  }
}

export { JWT_SECRET, JWT_REFRESH_SECRET }
