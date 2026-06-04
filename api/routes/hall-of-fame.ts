import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const entries = db.prepare('SELECT * FROM hall_of_fame ORDER BY season_number').all() as any[]

    const result = entries.map(entry => {
      const moments = db.prepare(
        'SELECT * FROM memorable_moments WHERE hall_of_fame_id = ?'
      ).all(entry.id) as any[]

      const sponsors = db.prepare(
        'SELECT * FROM sponsors WHERE season_number = ?'
      ).all(entry.season_number) as any[]

      return camelCaseResponse({
        ...entry,
        champion_members: JSON.parse(entry.champion_members),
        memorableMoments: moments,
        sponsors
      })
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取荣誉殿堂失败' })
  }
})

router.get('/:seasonNumber', (req: Request, res: Response): void => {
  try {
    const entry = db.prepare(
      'SELECT * FROM hall_of_fame WHERE season_number = ?'
    ).get(req.params.seasonNumber) as any

    if (!entry) {
      res.status(404).json({ success: false, error: '该赛季荣誉记录不存在' })
      return
    }

    const moments = db.prepare(
      'SELECT * FROM memorable_moments WHERE hall_of_fame_id = ?'
    ).all(entry.id) as any[]

    const sponsors = db.prepare(
      'SELECT * FROM sponsors WHERE season_number = ?'
    ).all(entry.season_number) as any[]

    res.json({
      success: true,
      data: camelCaseResponse({
        ...entry,
        champion_members: JSON.parse(entry.champion_members),
        memorableMoments: moments,
        sponsors
      })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取荣誉殿堂详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { seasonNumber, championTeam, championMembers, fmvp } = req.body

    if (!seasonNumber || !championTeam || !championMembers || !fmvp) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const result = db.prepare(
      `INSERT INTO hall_of_fame (season_number, champion_team, champion_members, fmvp)
       VALUES (?, ?, ?, ?)`
    ).run(seasonNumber, championTeam, JSON.stringify(championMembers), fmvp)

    res.status(201).json({ success: true, data: camelCaseResponse({ id: result.lastInsertRowid }) })
  } catch (error: any) {
    if (error.message?.includes('UNIQUE')) {
      res.status(409).json({ success: false, error: '该赛季荣誉记录已存在' })
      return
    }
    res.status(500).json({ success: false, error: '创建荣誉记录失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM hall_of_fame WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '荣誉记录不存在' })
      return
    }

    const { championTeam, championMembers, fmvp } = req.body

    db.prepare(
      `UPDATE hall_of_fame SET
        champion_team = COALESCE(?, champion_team),
        champion_members = COALESCE(?, champion_members),
        fmvp = COALESCE(?, fmvp)
       WHERE id = ?`
    ).run(
      championTeam || null,
      championMembers ? JSON.stringify(championMembers) : null,
      fmvp || null,
      req.params.id
    )

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新荣誉记录失败' })
  }
})

router.post('/:id/moments', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM hall_of_fame WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '荣誉记录不存在' })
      return
    }

    const { title, description, imageUrl } = req.body
    if (!title) {
      res.status(400).json({ success: false, error: '标题不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO memorable_moments (hall_of_fame_id, title, description, image_url) VALUES (?, ?, ?, ?)'
    ).run(parseInt(req.params.id), title, description || null, imageUrl || null)

    res.status(201).json({ success: true, data: camelCaseResponse({ id: result.lastInsertRowid }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加名场面失败' })
  }
})

router.post('/:id/sponsors', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM hall_of_fame WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '荣誉记录不存在' })
      return
    }

    const { name, logoUrl } = req.body
    if (!name) {
      res.status(400).json({ success: false, error: '赞助商名称不能为空' })
      return
    }

    const result = db.prepare(
      'INSERT INTO sponsors (name, logo_url, season_number) VALUES (?, ?, ?)'
    ).run(name, logoUrl || null, existing.season_number)

    res.status(201).json({ success: true, data: camelCaseResponse({ id: result.lastInsertRowid }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '添加赞助商失败' })
  }
})

export default router
