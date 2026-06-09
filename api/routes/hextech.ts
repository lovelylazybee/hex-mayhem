import { Router, type Request, type Response } from 'express'
import db from '../db.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const router = Router()

// 获取所有海克斯物品（支持按阶位筛选和搜索）
router.get('/', (req: Request, res: Response): void => {
  try {
    const { tier, search } = req.query

    let sql = 'SELECT * FROM hextech_items WHERE 1=1'
    const params: any[] = []

    if (tier && typeof tier === 'string' && ['prismatic', 'gold', 'silver'].includes(tier)) {
      sql += ' AND tier = ?'
      params.push(tier)
    }

    if (search && typeof search === 'string') {
      sql += ' AND (name LIKE ? OR description LIKE ? OR category LIKE ?)'
      const keyword = `%${search}%`
      params.push(keyword, keyword, keyword)
    }

    sql += ' ORDER BY CASE tier WHEN \'prismatic\' THEN 1 WHEN \'gold\' THEN 2 WHEN \'silver\' THEN 3 END, id'

    const items = db.prepare(sql).all(...params) as any[]

    // 为每个物品附加关联英雄
    const itemsWithChampions = items.map((item) => {
      const champions = db.prepare(
        'SELECT * FROM hextech_champions WHERE hextech_id = ?'
      ).all(item.id) as any[]
      return { ...item, champions }
    })

    res.json({ success: true, data: camelCaseResponse(itemsWithChampions) })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取海克斯数据失败' })
  }
})

// 获取单个海克斯物品详情（通过 slug）
router.get('/:slug', (req: Request, res: Response): void => {
  try {
    const item = db.prepare(
      'SELECT * FROM hextech_items WHERE slug = ?'
    ).get(req.params.slug) as any

    if (!item) {
      res.status(404).json({ success: false, error: '海克斯物品不存在' })
      return
    }

    const champions = db.prepare(
      'SELECT * FROM hextech_champions WHERE hextech_id = ?'
    ).all(item.id) as any[]

    res.json({
      success: true,
      data: camelCaseResponse({ ...item, champions })
    })
  } catch (error) {
    res.status(500).json({ success: false, error: '获取海克斯详情失败' })
  }
})

export default router
