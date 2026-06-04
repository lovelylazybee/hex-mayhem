import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

// 提交举报（无需登录）
router.post('/', (req: Request, res: Response): void => {
  try {
    const { type, url, description, contact } = req.body
    if (!type || !description) {
      res.status(400).json({ success: false, error: '举报类型和详情为必填项' })
      return
    }

    db.prepare(
      'INSERT INTO reports (type, url, description, contact) VALUES (?, ?, ?, ?)'
    ).run(type, url || '', description, contact || '')

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '提交举报失败' })
  }
})

// 获取举报列表（管理员）
router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const status = req.query.status as string
    let reports: any[]
    if (status) {
      reports = db.prepare('SELECT * FROM reports WHERE status = ? ORDER BY created_at DESC').all(status) as any[]
    } else {
      reports = db.prepare('SELECT * FROM reports ORDER BY created_at DESC').all() as any[]
    }
    res.json({ success: true, data: camelCaseResponse(reports) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取举报列表失败' })
  }
})

// 更新举报状态（管理员）
router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { status, adminNote } = req.body
    const existing = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '举报记录不存在' })
      return
    }

    db.prepare(
      'UPDATE reports SET status = ?, admin_note = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(status || existing.status, adminNote || existing.admin_note, req.params.id)

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新举报状态失败' })
  }
})

// 删除举报（管理员）
router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    db.prepare('DELETE FROM reports WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除举报失败' })
  }
})

export default router
