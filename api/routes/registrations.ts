import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.post('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { gameId, rank, preferredPositions, contactInfo, declaration, willingCaptain, seasonId } = req.body

    if (!gameId || !preferredPositions || !contactInfo) {
      res.status(400).json({ success: false, error: '缺少必填字段（游戏ID、偏好位置、联系方式）' })
      return
    }

    const targetSeasonId = seasonId || (() => {
      const current = db.prepare(
        "SELECT id FROM seasons WHERE status IN ('registering', 'in_progress') ORDER BY number DESC LIMIT 1"
      ).get() as any
      return current?.id
    })()

    if (!targetSeasonId) {
      res.status(400).json({ success: false, error: '当前没有可报名的赛季' })
      return
    }

    const existing = db.prepare(
      'SELECT id FROM registrations WHERE user_id = ? AND season_id = ?'
    ).get(req.user!.id, targetSeasonId)

    if (existing) {
      res.status(409).json({ success: false, error: '您已报名该赛季' })
      return
    }

    // Check if declaration column exists, add if not
    try { db.prepare('SELECT declaration FROM registrations LIMIT 0').get() } catch { db.prepare('ALTER TABLE registrations ADD COLUMN declaration TEXT').run() }
    try { db.prepare('SELECT willing_captain FROM registrations LIMIT 0').get() } catch { db.prepare('ALTER TABLE registrations ADD COLUMN willing_captain INTEGER DEFAULT 0').run() }
    const result = db.prepare(
      'INSERT INTO registrations (user_id, season_id, game_id, rank, preferred_positions, contact_info, declaration, willing_captain) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(
      req.user!.id, targetSeasonId, gameId, rank || '未填写',
      JSON.stringify(preferredPositions), contactInfo,
      declaration || null, willingCaptain ? 1 : 0
    )

    res.status(201).json({
      success: true,
      data: camelCaseResponse({ id: result.lastInsertRowid, seasonId: targetSeasonId })
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ success: false, error: '报名失败' })
  }
})

router.get('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const pageSize = parseInt(req.query.pageSize as string) || 20
    const offset = (page - 1) * pageSize

    const total = db.prepare('SELECT COUNT(*) as count FROM registrations').get() as { count: number }
    const registrations = db.prepare(
      'SELECT r.*, u.username FROM registrations r JOIN users u ON r.user_id = u.id ORDER BY r.created_at DESC LIMIT ? OFFSET ?'
    ).all(pageSize, offset) as any[]

    const result = registrations.map(r => ({
      ...r,
      preferred_positions: JSON.parse(r.preferred_positions)
    }))

    res.json({ success: true, data: camelCaseResponse({ registrations: result, total: total.count, page, pageSize }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报名列表失败' })
  }
})

router.get('/mine', authMiddleware, (req: Request, res: Response): void => {
  try {
    const registration = db.prepare(
      'SELECT * FROM registrations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(req.user!.id) as any

    if (!registration) {
      res.json({ success: true, data: null })
      return
    }

    res.json({
      success: true,
      data: camelCaseResponse({
        ...registration,
        preferred_positions: JSON.parse(registration.preferred_positions)
      })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取报名信息失败' })
  }
})

router.put('/:id/status', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { status } = req.body
    if (!['approved', 'rejected'].includes(status)) {
      res.status(400).json({ success: false, error: '状态值无效' })
      return
    }

    const existing = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '报名记录不存在' })
      return
    }

    db.prepare('UPDATE registrations SET status = ? WHERE id = ?').run(status, req.params.id)
    res.json({ success: true, data: camelCaseResponse({ id: req.params.id, status }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新报名状态失败' })
  }
})

router.put('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM registrations WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '报名记录不存在' })
      return
    }

    if (existing.user_id !== req.user!.id && req.user!.role !== 'admin') {
      res.status(403).json({ success: false, error: '无权修改此报名信息' })
      return
    }

    const { gameId, rank, preferredPositions, contactInfo, declaration } = req.body

    db.prepare(
      `UPDATE registrations SET
        game_id = COALESCE(?, game_id),
        rank = COALESCE(?, rank),
        preferred_positions = COALESCE(?, preferred_positions),
        contact_info = COALESCE(?, contact_info),
        declaration = COALESCE(?, declaration)
       WHERE id = ?`
    ).run(
      gameId || null, rank || null,
      preferredPositions ? JSON.stringify(preferredPositions) : null,
      contactInfo || null, declaration || null,
      req.params.id
    )

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新报名信息失败' })
  }
})

export default router
