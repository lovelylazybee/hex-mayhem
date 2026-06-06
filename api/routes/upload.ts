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

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
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

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES[mimeType]) {
      res.status(400).json({ success: false, error: '不支持的文件类型，仅允许 JPG/PNG/GIF/WebP' })
      return
    }

    // Validate file size
    if (buffer.length > MAX_FILE_SIZE) {
      res.status(400).json({ success: false, error: '文件大小不能超过5MB' })
      return
    }

    // Validate actual file content (magic bytes)
    const magicBytes = buffer.subarray(0, 4).toString('hex')
    const validMagicBytes: Record<string, string[]> = {
      '.jpg': ['ffd8'],
      '.png': ['89504e47'],
      '.gif': ['47494638'],
      '.webp': ['52494646'],
    }
    const ext = ALLOWED_MIME_TYPES[mimeType]
    const allowedMagic = validMagicBytes[ext]
    if (allowedMagic && !allowedMagic.some(m => magicBytes.startsWith(m))) {
      res.status(400).json({ success: false, error: '文件内容与类型不匹配' })
      return
    }

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const safeFilename = (filename || '').replace(/[^a-zA-Z0-9._-]/g, '_')
    const fileName = safeFilename || `${timestamp}-${randomStr}${ext}`

    const filePath = path.join(uploadsDir, fileName)

    // Prevent path traversal
    if (!filePath.startsWith(uploadsDir)) {
      res.status(400).json({ success: false, error: '文件名无效' })
      return
    }

    fs.writeFileSync(filePath, buffer)

    const url = `/uploads/${fileName}`
    res.json({ success: true, data: camelCaseResponse({ url }) })
  } catch (error) {
    res.status(500).json({ success: false, error: '文件上传失败' })
  }
})

export default router
