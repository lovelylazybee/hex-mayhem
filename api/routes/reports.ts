import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'
import rateLimit from 'express-rate-limit'

const router = Router()

const VALID_REPORT_TYPES = [
  '危害国家安全',
  '煽动民族仇恨',
  '散布谣言扰乱社会秩序',
  '散布淫秽色情内容',
  '侮辱诽谤他人',
  '侵犯他人隐私',
  '赌博或诈骗信息',
  '其他违法违规内容',
]

// 举报提交速率限制：每IP每小时最多5次
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, error: '举报提交过于频繁，请稍后再试' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false },
})

// 敏感词过滤
const sensitiveWords = ['枪支', '弹药', '毒品', '赌博网站', '色情', '代开发票', '办证', '贷款', '刷单', '兼职', 'vpn', '翻墙', '法轮', '反动', '暴恐']
const checkSensitive = (text: string) => sensitiveWords.some(w => text.toLowerCase().includes(w))

// 提交举报（无需登录）
router.post('/', reportLimiter, (req: Request, res: Response): void => {
  try {
    const { type, url, description, contact } = req.body
    if (!type || !description) {
      res.status(400).json({ success: false, error: '举报类型和详情为必填项' })
      return
    }

    // 验证举报类型
    if (!VALID_REPORT_TYPES.includes(type)) {
      res.status(400).json({ success: false, error: '无效的举报类型' })
      return
    }

    // 输入长度验证
    if (description.length > 2000) {
      res.status(400).json({ success: false, error: '举报详情不能超过2000个字符' })
      return
    }
    if (url && url.length > 500) {
      res.status(400).json({ success: false, error: '页面地址不能超过500个字符' })
      return
    }
    if (contact && contact.length > 100) {
      res.status(400).json({ success: false, error: '联系方式不能超过100个字符' })
      return
    }

    // 敏感词过滤（对举报内容本身也做过滤，防止滥用）
    if (checkSensitive(description) || (url && checkSensitive(url)) || (contact && checkSensitive(contact))) {
      res.status(400).json({ success: false, error: '提交内容包含违规信息' })
      return
    }

    // 记录举报人IP
    const clientIp = req.headers['x-forwarded-for'] as string || req.headers['x-real-ip'] as string || req.socket.remoteAddress || ''

    db.prepare(
      'INSERT INTO reports (type, url, description, contact, ip_address) VALUES (?, ?, ?, ?, ?)'
    ).run(type, url || '', description, contact || '', clientIp)

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

    // 验证状态值
    if (status && !['pending', 'processing', 'resolved', 'dismissed'].includes(status)) {
      res.status(400).json({ success: false, error: '无效的状态值' })
      return
    }

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
