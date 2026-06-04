import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

router.get('/', (req: Request, res: Response): void => {
  try {
    const { seasonId } = req.query
    let matches: any[]

    if (seasonId) {
      matches = db.prepare(
        'SELECT * FROM matches WHERE season_id = ? ORDER BY round, match_index'
      ).all(seasonId) as any[]
    } else {
      matches = db.prepare(
        'SELECT * FROM matches ORDER BY season_id DESC, round, match_index'
      ).all() as any[]
    }

    const result = matches.map(m => {
      const team1 = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(m.team1_id) as any
      const team2 = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(m.team2_id) as any
      const winner = m.winner_id ? db.prepare('SELECT id, name FROM teams WHERE id = ?').get(m.winner_id) as any : null
      return camelCaseResponse({
        ...m,
        team1: team1 || { id: m.team1_id, name: '未知' },
        team2: team2 || { id: m.team2_id, name: '未知' },
        winner: winner || null
      })
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取赛程列表失败' })
  }
})

router.get('/:id', (req: Request, res: Response): void => {
  try {
    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id) as any
    if (!match) {
      res.status(404).json({ success: false, error: '比赛不存在' })
      return
    }

    const team1 = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(match.team1_id) as any
    const team2 = db.prepare('SELECT id, name FROM teams WHERE id = ?').get(match.team2_id) as any
    const winner = match.winner_id ? db.prepare('SELECT id, name FROM teams WHERE id = ?').get(match.winner_id) as any : null

    res.json({
      success: true,
      data: camelCaseResponse({
        ...match,
        team1: team1 || { id: match.team1_id, name: '未知' },
        team2: team2 || { id: match.team2_id, name: '未知' },
        winner: winner || null
      })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取比赛详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { seasonId, round, team1Id, team2Id, scheduledAt, matchIndex } = req.body

    if (!seasonId || !round || !team1Id || !team2Id) {
      res.status(400).json({ success: false, error: '缺少必填字段' })
      return
    }

    const maxIndex = db.prepare(
      'SELECT MAX(match_index) as maxIdx FROM matches WHERE season_id = ? AND round = ?'
    ).get(seasonId, round) as any

    const result = db.prepare(
      `INSERT INTO matches (season_id, round, match_index, team1_id, team2_id, scheduled_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      seasonId, round, matchIndex || (maxIndex?.maxIdx || 0) + 1,
      team1Id, team2Id, scheduledAt || null
    )

    res.status(201).json({ success: true, data: camelCaseResponse({ id: result.lastInsertRowid }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建比赛失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '比赛不存在' })
      return
    }

    const { round, matchIndex, team1Id, team2Id, scheduledAt, status } = req.body

    db.prepare(
      `UPDATE matches SET
        round = COALESCE(?, round),
        match_index = COALESCE(?, match_index),
        team1_id = COALESCE(?, team1_id),
        team2_id = COALESCE(?, team2_id),
        scheduled_at = COALESCE(?, scheduled_at),
        status = COALESCE(?, status)
       WHERE id = ?`
    ).run(
      round || null, matchIndex || null, team1Id || null,
      team2Id || null, scheduledAt || null, status || null,
      req.params.id
    )

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新比赛失败' })
  }
})

router.put('/:id/score', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM matches WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '比赛不存在' })
      return
    }

    const { team1Score, team2Score } = req.body
    if (team1Score === undefined || team2Score === undefined) {
      res.status(400).json({ success: false, error: '比分不能为空' })
      return
    }

    let winnerId = null
    let status = existing.status

    if (team1Score > team2Score) {
      winnerId = existing.team1_id
      status = 'completed'
    } else if (team2Score > team1Score) {
      winnerId = existing.team2_id
      status = 'completed'
    }

    db.prepare(
      'UPDATE matches SET team1_score = ?, team2_score = ?, winner_id = ?, status = ? WHERE id = ?'
    ).run(team1Score, team2Score, winnerId, status, req.params.id)

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id, winnerId, status }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新比分失败' })
  }
})

export default router
