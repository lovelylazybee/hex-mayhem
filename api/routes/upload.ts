import { Router, type Request, type Response } from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { authMiddleware, adminMiddleware } from '../middleware/auth.js'
import { camelCaseResponse } from '../utils/camelCase.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

const uploadsDir = path.join(__dirname, '..', '..', 'public', 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

router.post('/', authMiddleware, adminMiddleware, (req: Request, res: Response): void => {
  try {
    if (!req.body.file) {
      res.status(400).json({ success: false, error: '没有上传文件' })
      return
    }

    const { file, filename } = req.body

    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    if (!matches || matches.length !== 3) {
      res.status(400).json({ success: false, error: '文件格式无效' })
      return
    }

    const mimeType = matches[1]
    const buffer = Buffer.from(matches[2], 'base64')

    const extMap: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
      'image/webp': '.webp', 'image/svg+xml': '.svg'
    }
    const ext = extMap[mimeType] || '.png'

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const fileName = filename || `${timestamp}-${randomStr}${ext}`

    const filePath = path.join(uploadsDir, fileName)
    fs.writeFileSync(filePath, buffer)

    const url = `/uploads/${fileName}`
    res.json({ success: true, data: camelCaseResponse({ url }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '文件上传失败' })
  }
})

export default router
