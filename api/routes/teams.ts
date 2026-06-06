import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

const RANK_SCORES: Record<string, number> = {
  '黑铁': 1, '青铜': 2, '白银': 3, '黄金': 4, '铂金': 5,
  '翡翠': 6, '钻石': 7, '大师': 8, '宗师': 9, '王者': 10
}

function getRankScore(rank: string): number {
  for (const [key, score] of Object.entries(RANK_SCORES)) {
    if (rank.includes(key)) return score
  }
  return 3
}

router.get('/', authMiddleware, (req: Request, res: Response): void => {
  try {
    const { seasonId } = req.query
    let teams: any[]

    if (seasonId) {
      teams = db.prepare('SELECT * FROM teams WHERE season_id = ? ORDER BY id').all(seasonId) as any[]
    } else {
      teams = db.prepare('SELECT * FROM teams ORDER BY id').all() as any[]
    }

    const result = teams.map(t => {
      const members = db.prepare('SELECT * FROM team_members WHERE team_id = ?').all(t.id) as any[]
      return camelCaseResponse({ ...t, members })
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取战队列表失败' })
  }
})

router.get('/:id', authMiddleware, (req: Request, res: Response): void => {
  try {
    const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id) as any
    if (!team) {
      res.status(404).json({ success: false, error: '战队不存在' })
      return
    }

    const members = db.prepare('SELECT * FROM team_members WHERE team_id = ?').all(team.id) as any[]
    res.json({ success: true, data: camelCaseResponse({ ...team, members }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取战队详情失败' })
  }
})

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { seasonId, name } = req.body
    if (!seasonId || !name) {
      res.status(400).json({ success: false, error: '赛季ID和战队名称不能为空' })
      return
    }
    if (name.length > 30) {
      res.status(400).json({ success: false, error: '战队名称不能超过30个字符' })
      return
    }

    const result = db.prepare(
      'INSERT INTO teams (season_id, name) VALUES (?, ?)'
    ).run(seasonId, name)

    res.status(201).json({ success: true, data: camelCaseResponse({ id: result.lastInsertRowid }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '创建战队失败' })
  }
})

router.post('/auto-assign', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const { seasonId, teamSize = 5 } = req.body
    if (!seasonId) {
      res.status(400).json({ success: false, error: '赛季ID不能为空' })
      return
    }

    const registrations = db.prepare(
      "SELECT r.*, u.username FROM registrations r JOIN users u ON r.user_id = u.id WHERE r.season_id = ? AND r.status = 'approved' ORDER BY r.created_at"
    ).all(seasonId) as any[]

    if (registrations.length === 0) {
      res.status(400).json({ success: false, error: '没有已审核通过的报名' })
      return
    }

    const existingTeams = db.prepare('SELECT * FROM teams WHERE season_id = ?').all(seasonId) as any[]
    if (existingTeams.length > 0) {
      db.prepare('DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE season_id = ?)').run(seasonId)
      db.prepare('DELETE FROM teams WHERE season_id = ?').run(seasonId)
    }

    const friendGroups: Map<string, Set<number>> = new Map()
    const userToGroup: Map<number, string> = new Map()

    for (const reg of registrations) {
      if (reg.friend_binding) {
        const friend = registrations.find((r: any) => r.game_id === reg.friend_binding)
        if (friend) {
          const groupKey = [reg.user_id, friend.user_id].sort().join('-')
          if (!friendGroups.has(groupKey)) {
            friendGroups.set(groupKey, new Set([reg.user_id, friend.user_id]))
          }
          friendGroups.get(groupKey)!.add(reg.user_id)
          friendGroups.get(groupKey)!.add(friend.user_id)
          userToGroup.set(reg.user_id, groupKey)
          userToGroup.set(friend.user_id, groupKey)
        }
      }
    }

    const assignedUserIds = new Set<number>()
    const groups: { userIds: number[]; avgScore: number }[] = []

    for (const [key, userIds] of friendGroups) {
      const users = registrations.filter((r: any) => userIds.has(r.user_id))
      const avgScore = users.reduce((sum: number, r: any) => sum + getRankScore(r.rank), 0) / users.length
      groups.push({ userIds: Array.from(userIds), avgScore })
      for (const uid of userIds) {
        assignedUserIds.add(uid)
      }
    }

    const soloRegs = registrations.filter((r: any) => !assignedUserIds.has(r.user_id))
    for (const reg of soloRegs) {
      groups.push({ userIds: [reg.user_id], avgScore: getRankScore(reg.rank) })
    }

    groups.sort((a, b) => b.avgScore - a.avgScore)

    const numTeams = Math.max(1, Math.ceil(registrations.length / teamSize))
    const teamIds: number[] = []

    const teamNames = [
      '暗影猎手', '冰霜之翼', '烈焰军团', '星辰守卫', '雷霆战神',
      '深渊领主', '龙骑兵团', '幻影刺客', '圣光守护', '风暴使者',
      '铁壁堡垒', '毒蛇之牙', '天启骑士', '极光之翼', '混沌领主'
    ]

    for (let i = 0; i < numTeams; i++) {
      const result = db.prepare(
        'INSERT INTO teams (season_id, name) VALUES (?, ?)'
      ).run(seasonId, teamNames[i] || `战队${i + 1}`)
      teamIds.push(result.lastInsertRowid as number)
    }

    const teamAssignments: number[][] = Array.from({ length: numTeams }, () => [])
    const teamTotalScores: number[] = new Array(numTeams).fill(0)

    for (let i = 0; i < groups.length; i++) {
      const pickIndex = Math.floor(i / numTeams) % 2 === 0
        ? i % numTeams
        : numTeams - 1 - (i % numTeams)

      const targetTeam = pickIndex
      for (const uid of groups[i].userIds) {
        teamAssignments[targetTeam].push(uid)
        const reg = registrations.find((r: any) => r.user_id === uid)
        if (reg) {
          teamTotalScores[targetTeam] += getRankScore(reg.rank)
        }
      }
    }

    const insertMember = db.prepare(
      `INSERT INTO team_members (team_id, user_id, game_id, rank, position, is_captain)
       VALUES (?, ?, ?, ?, ?, ?)`
    )

    for (let t = 0; t < numTeams; t++) {
      const memberIds = teamAssignments[t]
      for (let m = 0; m < memberIds.length; m++) {
        const reg = registrations.find((r: any) => r.user_id === memberIds[m])
        if (reg) {
          const positions = JSON.parse(reg.preferred_positions)
          const position = Array.isArray(positions) && positions.length > 0 ? positions[0] : '随意'
          insertMember.run(teamIds[t], reg.user_id, reg.game_id, reg.rank, position, m === 0 ? 1 : 0)
        }
      }
    }

    const createdTeams = db.prepare('SELECT * FROM teams WHERE season_id = ?').all(seasonId) as any[]
    const result = createdTeams.map(t => {
      const members = db.prepare('SELECT * FROM team_members WHERE team_id = ?').all(t.id) as any[]
      return camelCaseResponse({ ...t, members })
    })

    res.json({ success: true, data: result })
  } catch (error) {
    res.status(500).json({ success: false, error: '自动分队失败' })
  }
})

router.put('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '战队不存在' })
      return
    }

    const { name, runeId } = req.body
    db.prepare(
      `UPDATE teams SET name = COALESCE(?, name), rune_id = COALESCE(?, rune_id) WHERE id = ?`
    ).run(name || null, runeId !== undefined ? runeId : null, req.params.id)

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新战队失败' })
  }
})

router.put('/:id/members', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '战队不存在' })
      return
    }

    const { members } = req.body
    if (!Array.isArray(members)) {
      res.status(400).json({ success: false, error: '成员列表格式无效' })
      return
    }

    db.prepare('DELETE FROM team_members WHERE team_id = ?').run(req.params.id)

    const insertMember = db.prepare(
      `INSERT INTO team_members (team_id, user_id, game_id, rank, position, is_captain)
       VALUES (?, ?, ?, ?, ?, ?)`
    )

    for (const m of members) {
      insertMember.run(
        parseInt(req.params.id), m.userId, m.gameId || '', m.rank || '白银',
        m.position || '随意', m.isCaptain ? 1 : 0
      )
    }

    res.json({ success: true, data: camelCaseResponse({ id: req.params.id }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '更新战队成员失败' })
  }
})

router.delete('/:id', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    const existing = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.params.id) as any
    if (!existing) {
      res.status(404).json({ success: false, error: '战队不存在' })
      return
    }

    db.prepare('DELETE FROM team_members WHERE team_id = ?').run(req.params.id)
    db.prepare('DELETE FROM teams WHERE id = ?').run(req.params.id)

    res.json({ success: true, data: null })
  } catch (error) {
    res.status(500).json({ success: false, error: '删除战队失败' })
  }
})

export default router
