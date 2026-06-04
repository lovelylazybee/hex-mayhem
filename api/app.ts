import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { initDatabase } from './db.js'
import { helmetMiddleware, sanitizeMiddleware, apiLimiter, authLimiter, registerLimiter } from './middleware/security.js'
import authRoutes from './routes/auth.js'
import seasonRoutes from './routes/seasons.js'
import registrationRoutes from './routes/registrations.js'
import teamRoutes from './routes/teams.js'
import runeRoutes from './routes/runes.js'
import matchRoutes from './routes/matches.js'
import hallOfFameRoutes from './routes/hall-of-fame.js'
import contentRoutes from './routes/content.js'
import verificationCodeRoutes from './routes/verification-codes.js'
import uploadRoutes from './routes/upload.js'
import userRoutes from './routes/users.js'
import reportRoutes from './routes/reports.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

initDatabase()

const app: express.Application = express()
app.set('trust proxy', 1)

const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://localhost:3000').split(',').map(s => s.trim())
const isDev = process.env.NODE_ENV !== 'production'

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || isDev) {
      callback(null, true)
    } else {
      callback(new Error('CORS not allowed'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))
app.use(helmetMiddleware)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(sanitizeMiddleware)

app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')))

app.use('/api/auth/login', authLimiter)
app.use('/api/auth/register', registerLimiter)
app.use('/api', apiLimiter)

app.use('/api/auth', authRoutes)
app.use('/api/seasons', seasonRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/teams', teamRoutes)
app.use('/api/runes', runeRoutes)
app.use('/api/matches', matchRoutes)
app.use('/api/hall-of-fame', hallOfFameRoutes)
app.use('/api/content', contentRoutes)
app.use('/api/verification-codes', verificationCodeRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/users', userRoutes)
app.use('/api/reports', reportRoutes)

app.use(
  '/api/health',
  (req: Request, res: Response, next: NextFunction): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get('*', (req: Request, res: Response): void => {
    res.sendFile(path.join(distPath, 'index.html'))
  })
}

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
