import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const seasons = db.prepare('SELECT * FROM seasons ORDER BY number DESC').all() as any[]
    const result = seasons.map(s => ({
      ...camelCaseResponse(s),
      timeline: s.timeline ? JSON.parse(s.timeline) : null
    }))
    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取赛季列表失败' })
  }
})

router.get('/current', (req: Request, res: Response): void => {
  try {
    const season = db.prepare(
      "SELECT * FROM seasons WHERE status IN ('registering', 'in_progress') ORDER BY number DESC LIMIT 1"
    ).get() as any

    if (!season) {
      res.status(404).json({ success: false, error: '当前没有进行中的赛季' })
      return
    }

    res.json({
      success: true,
      data: {
        ...camelCaseResponse(season),
        timeline: season.timeline ? JSON.parse(season.timeline) : null
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取当前赛季失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const season = db.prepare('SELECT * FROM seasons WHERE id = ?').get(req.params.id) as any
    if (!season) {
      res.status(404).json({ success: false, error: '赛季不存在' })
      return
    }

    res.json({
      success: true,
      data: {
        ...camelCaseResponse(season),
        timeline: season.timeline ? JSON.parse(season.timeline) : null
      }
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取赛季详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { number, title, subtitle, status, startDate, endDate, registrationDeadline, rules, prizes, timeline, heroImage } = req.body

    if (!number || !title) {
      res.status(400).json({ success: false, error: '赛季编号和标题不能为空' })
      return
    }

    const result = db.prepare(
      `INSERT INTO seasons (number, title, subtitle, status, start_date, end_date, registration_deadline, rules, prizes, timeline, hero_image)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      number, title, subtitle || null, status || 'upcoming',
      startDate || null, endDate || null, registrationDeadline || null,
      rules || null, prizes || null,
      timeline ? JSON.stringify(timeline) : null,
      heroImage || null
    )

    res.status(201).json({ success: true, data: { id: result.lastInsertRowid } })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: '赛季编号已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建赛季失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM seasons WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '赛季不存在' })
      return
    }

    const { title, subtitle, status, startDate, endDate, registrationDeadline, rules, prizes, timeline, heroImage } = req.body

    db.prepare(
      `UPDATE seasons SET
        title = COALESCE(?, title),
        subtitle = COALESCE(?, subtitle),
        status = COALESCE(?, status),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        registration_deadline = COALESCE(?, registration_deadline),
        rules = COALESCE(?, rules),
        prizes = COALESCE(?, prizes),
        timeline = COALESCE(?, timeline),
        hero_image = COALESCE(?, hero_image)
       WHERE id = ?`
    ).run(
      title || null, subtitle || null, status || null,
      startDate || null, endDate || null, registrationDeadline || null,
      rules || null, prizes || null,
      timeline ? JSON.stringify(timeline) : null,
      heroImage || null,
      req.params.id
    )

    res.json({ success: true, data: { id: req.params.id } })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新赛季失败' })
  }
})

export default router
