import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.get('/', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const users = db.prepare('SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC').all() as any[]
    res.json({ success: true, data: camelCaseResponse(users) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户列表失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { role } = req.body

    if (!role || !['admin', 'user'].includes(role)) {
      res.status(400).json({ success: false, error: '无效的角色' })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
    const user = db.prepare('SELECT id, username, email, role, created_at FROM users WHERE id = ?').get(id) as any
    res.json({ success: true, data: camelCaseResponse(user) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新用户失败' })
  }
})

router.delete('/:id', authMiddleware, adminMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(id)
    if (!existing) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除用户失败' })
  }
})

export default router
