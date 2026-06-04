import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const runes = db.prepare('SELECT * FROM runes ORDER BY id').all() as any[]
    res.json({ success: true, data: camelCaseResponse(runes) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取符文列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const rune = db.prepare('SELECT * FROM runes WHERE id = ?').get(req.params.id) as any
    if (!rune) {
      res.status(404).json({ success: false, error: '符文不存在' })
      return
    }
    res.json({ success: true, data: camelCaseResponse(rune) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取符文详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { name, description, effect, rarity, icon } = req.body
    if (!name || !description || !effect || !rarity) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    if (!['common', 'rare', 'epic', 'legendary'].includes(rarity)) {
      res.status(400).json({ success: false, error: '稀有度值无效' })
      return
    }

    const result = db.prepare(
      'INSERT INTO runes (name, description, effect, rarity, icon) VALUES (?, ?, ?, ?, ?)'
    ).run(name, description, effect, rarity, icon || null)

    res.status(201).json({ success: true, data: camelCaseResponse({ id: result.lastInsertRowid }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建符文失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM runes WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '符文不存在' })
      return
    }

    const { name, description, effect, rarity, icon } = req.body

    db.prepare(
      `UPDATE runes SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        effect = COALESCE(?, effect),
        rarity = COALESCE(?, rarity),
        icon = COALESCE(?, icon)
       WHERE id = ?`
    ).run(name || null, description || null, effect || null, rarity || null, icon || null, req.params.id)

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新符文失败' })
  }
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM runes WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '符文不存在' })
      return
    }

    db.prepare('DELETE FROM runes WHERE id = ?').run(req.params.id)
    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除符文失败' })
  }
})

router.post('/draw', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { teamId } = req.body
    if (!teamId) {
      res.status(400).json({ success: false, error: '战队ID不能为空' })
      return
    }

    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId) as any
    if (!team) {
      res.status(404).json({ success: false, error: '战队不存在' })
      return
    }

    const captain = db.prepare(
      'SELECT * FROM team_members WHERE team_id = ? AND is_captain = 1'
    ).get(teamId) as any

    if (!captain || captain.user_id !== req.user!.id) {
      res.status(403).json({ success: false, error: '只有队长可以抽卡' })
      return
    }

    if (team.rune_id) {
      res.status(400).json({ success: false, error: '该战队已抽取过符文' })
      return
    }

    const runes = db.prepare('SELECT * FROM runes').all() as any[]
    if (runes.length === 0) {
      res.status(400).json({ success: false, error: '没有可用的符文' })
      return
    }

    const weights: Record<string, number> = { common: 40, rare: 30, epic: 20, legendary: 10 }
    const totalWeight = runes.reduce((sum, r) => sum + (weights[r.rarity] || 10), 0)
    let random = Math.random() * totalWeight
    let selectedRune = runes[0]

    for (const rune of runes) {
      random -= weights[rune.rarity] || 10
      if (random <= 0) {
        selectedRune = rune
        break
      }
    }

    const drawResult = db.prepare(
      'INSERT INTO draw_records (team_id, rune_id, drawn_by) VALUES (?, ?, ?)'
    ).run(teamId, selectedRune.id, req.user!.id)

    db.prepare('UPDATE teams SET rune_id = ? WHERE id = ?').run(selectedRune.id, teamId)

    res.json({
      success: true,
      data: camelCaseResponse({
        rune: selectedRune,
        drawRecord: {
          id: drawResult.lastInsertRowid,
          teamId,
          runeId: selectedRune.id,
          drawnBy: req.user!.id
        }
      })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '抽卡失败' })
  }
})

export default router
