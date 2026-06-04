import { Router, type Request, type Response } from 'express'
import bcryptjs from 'bcryptjs'
import db from '../db.js'
import { authMiddleware, generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return '密码长度不能少于8位'
  if (!/[A-Z]/.test(password)) return '密码必须包含至少一个大写字母'
  if (!/[a-z]/.test(password)) return '密码必须包含至少一个小写字母'
  if (!/[0-9]/.test(password)) return '密码必须包含至少一个数字'
  return null
}

router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password, email } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    if (username.length < 3 || username.length > 20) {
      res.status(400).json({ success: false, error: '用户名长度需在3-20位之间' })
      return
    }

    const strengthError = validatePasswordStrength(password)
    if (strengthError) {
      res.status(400).json({ success: false, error: strengthError })
      return
    }

    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
    if (existing) {
      res.status(409).json({ success: false, error: '用户名已存在' })
      return
    }

    const passwordHash = bcryptjs.hashSync(password, 12)
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)'
    ).run(username, passwordHash, email || null)

    const user = { id: result.lastInsertRowid as number, username, role: 'user' }
    const token = generateToken(user)
    const refreshToken = generateRefreshToken(user)

    res.status(201).json({ success: true, data: camelCaseResponse({ token, refreshToken, user }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '注册失败' })
  }
})

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body

    if (!username || !password) {
      res.status(400).json({ success: false, error: '用户名和密码不能为空' })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
    if (!user) {
      res.status(401).json({ success: false, error: '用户名或密码错误' })
      return
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000)
      res.status(423).json({ success: false, error: `账户已锁定，请${remaining}分钟后再试` })
      return
    }

    const valid = bcryptjs.compareSync(password, user.password_hash)
    if (!valid) {
      const attempts = (user.login_attempts || 0) + 1
      if (attempts >= 5) {
        db.prepare('UPDATE users SET login_attempts = ?, locked_until = datetime(\'now\', \'+15 minutes\') WHERE id = ?').run(attempts, user.id)
        res.status(423).json({ success: false, error: '连续登录失败5次，账户已锁定15分钟' })
      } else {
        db.prepare('UPDATE users SET login_attempts = ? WHERE id = ?').run(attempts, user.id)
        res.status(401).json({ success: false, error: `用户名或密码错误（还剩${5 - attempts}次机会）` })
      }
      return
    }

    db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id)

    const token = generateToken({ id: user.id, username: user.username, role: user.role })
    const refreshToken = generateRefreshToken({ id: user.id, username: user.username, role: user.role })
    res.json({
      success: true,
      data: camelCaseResponse({
        token,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          mustChangePassword: !!user.must_change_password
        }
      })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '登录失败' })
  }
})

router.get('/me', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = db.prepare('SELECT id, username, email, role, must_change_password, created_at FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const result: any = { ...user, mustChangePassword: !!user.must_change_password }
    delete result.must_change_password

    const registration = db.prepare(
      'SELECT * FROM registrations WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).get(user.id) as any
    if (registration) {
      result.registration = {
        ...registration,
        preferred_positions: JSON.parse(registration.preferred_positions)
      }
    }

    const teamMember = db.prepare(
      'SELECT t.*, tm.is_captain FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ? ORDER BY t.created_at DESC LIMIT 1'
    ).get(user.id) as any
    if (teamMember) {
      const members = db.prepare(
        'SELECT tm.user_id, tm.is_captain, u.username FROM team_members tm JOIN users u ON tm.user_id = u.id WHERE tm.team_id = ?'
      ).all(teamMember.id) as any[]
      result.team = {
        id: teamMember.id,
        name: teamMember.name,
        seasonId: teamMember.season_id,
        isCaptain: !!teamMember.is_captain,
        members: members.map(m => ({ userId: m.user_id, username: m.username, isCaptain: !!m.is_captain }))
      }
    }

    res.json({ success: true, data: camelCaseResponse(result) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户信息失败' })
  }
})

router.put('/change-password', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body

    if (!oldPassword || !newPassword) {
      res.status(400).json({ success: false, error: '旧密码和新密码不能为空' })
      return
    }

    const strengthError = validatePasswordStrength(newPassword)
    if (strengthError) {
      res.status(400).json({ success: false, error: strengthError })
      return
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user!.id) as any
    if (!user) {
      res.status(404).json({ success: false, error: '用户不存在' })
      return
    }

    const valid = bcryptjs.compareSync(oldPassword, user.password_hash)
    if (!valid) {
      res.status(401).json({ success: false, error: '旧密码不正确' })
      return
    }

    const newPasswordHash = bcryptjs.hashSync(newPassword, 12)
    db.prepare('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?').run(newPasswordHash, req.user!.id)

    res.json({ success: true, data: { message: '密码修改成功' } })
  } catch (error) {
    res.status(500).json({ success: false, error: '密码修改失败' })
  }
})

router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      res.status(400).json({ success: false, error: '刷新令牌不能为空' })
      return
    }

    const user = verifyRefreshToken(refreshToken)
    if (!user) {
      res.status(401).json({ success: false, error: '刷新令牌无效或已过期' })
      return
    }

    const token = generateToken({ id: user.id, username: user.username, role: user.role })
    res.json({
      success: true,
      data: camelCaseResponse({
        token,
        user: { id: user.id, username: user.username, role: user.role }
      })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '令牌刷新失败' })
  }
})

export default router
