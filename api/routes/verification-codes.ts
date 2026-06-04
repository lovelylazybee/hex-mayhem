import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { code } = req.body
    if (!code) {
      res.status(400).json({ success: false, error: '验证码不能为空' })
      return
    }

    db.prepare('INSERT INTO verification_codes (code) VALUES (?)').run(code)
    res.status(201).json({ success: true, data: camelCaseResponse({ code }) })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: '验证码已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建验证码失败' })
  }
})

router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const codes = db.prepare('SELECT * FROM verification_codes ORDER BY created_at DESC').all() as any[]
    res.json({ success: true, data: camelCaseResponse(codes) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取验证码列表失败' })
  }
})

router.post('/validate', (req: Request, res: Response): void => {
  try {
    const { code } = req.body
    if (!code) {
      res.status(400).json({ success: false, error: '验证码不能为空' })
      return
    }

    const codeRow = db.prepare(
      'SELECT * FROM verification_codes WHERE code = ?'
    ).get(code) as any

    if (!codeRow) {
      res.status(400).json({ success: false, error: '验证码无效' })
      return
    }

    if (codeRow.used) {
      res.status(400).json({ success: false, error: '验证码已使用' })
      return
    }

    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(codeRow.id)
    res.json({ success: true, data: camelCaseResponse({ valid: true }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '验证码校验失败' })
  }
})

export default router
