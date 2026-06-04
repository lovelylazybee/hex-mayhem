import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.get('/:key', (req: Request, res: Response): void => {
  try {
    const block = db.prepare('SELECT * FROM content_blocks WHERE key = ?').get(req.params.key) as any
    if (!block) {
      res.status(404).json({ success: false, error: '内容块不存在' })
      return
    }
    res.json({ success: true, data: camelCaseResponse(block) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取内容块失败' })
  }
})

router.put('/:key', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { value } = req.body
    if (value === undefined || value === null) {
      res.status(400).json({ success: false, error: '内容值不能为空' })
      return
    }

    db.prepare(
      `INSERT INTO content_blocks (key, value, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`
    ).run(req.params.key, value)

    res.json({ success: true, data: camelCaseResponse({ key: req.params.key }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新内容块失败' })
  }
})

export default router
