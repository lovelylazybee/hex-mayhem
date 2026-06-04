import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcryptjs from 'bcryptjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'hex-mayhem.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      email TEXT,
      role TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('admin', 'user')),
      must_change_password INTEGER NOT NULL DEFAULT 0,
      login_attempts INTEGER NOT NULL DEFAULT 0,
      locked_until TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS seasons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      number INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'registering', 'in_progress', 'completed')),
      start_date TEXT,
      end_date TEXT,
      registration_deadline TEXT,
      rules TEXT,
      prizes TEXT,
      timeline TEXT,
      hero_image TEXT
    );

    CREATE TABLE IF NOT EXISTS registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      season_id INTEGER NOT NULL REFERENCES seasons(id),
      game_id TEXT NOT NULL,
      rank TEXT NOT NULL,
      preferred_positions TEXT NOT NULL,
      contact_info TEXT NOT NULL,
      friend_binding TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, season_id)
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL REFERENCES seasons(id),
      name TEXT NOT NULL,
      rune_id INTEGER REFERENCES runes(id)
    );

    CREATE TABLE IF NOT EXISTS team_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      user_id INTEGER NOT NULL REFERENCES users(id),
      game_id TEXT NOT NULL,
      rank TEXT NOT NULL,
      position TEXT NOT NULL,
      is_captain INTEGER NOT NULL DEFAULT 0,
      UNIQUE(user_id, team_id)
    );

    CREATE TABLE IF NOT EXISTS runes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      effect TEXT NOT NULL,
      rarity TEXT NOT NULL CHECK(rarity IN ('common', 'rare', 'epic', 'legendary')),
      icon TEXT
    );

    CREATE TABLE IF NOT EXISTS draw_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER NOT NULL REFERENCES teams(id),
      rune_id INTEGER NOT NULL REFERENCES runes(id),
      drawn_by INTEGER NOT NULL REFERENCES users(id),
      drawn_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS matches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_id INTEGER NOT NULL REFERENCES seasons(id),
      round INTEGER NOT NULL,
      match_index INTEGER NOT NULL,
      team1_id INTEGER NOT NULL REFERENCES teams(id),
      team2_id INTEGER NOT NULL REFERENCES teams(id),
      team1_score INTEGER NOT NULL DEFAULT 0,
      team2_score INTEGER NOT NULL DEFAULT 0,
      winner_id INTEGER REFERENCES teams(id),
      scheduled_at TEXT,
      status TEXT NOT NULL DEFAULT 'upcoming' CHECK(status IN ('upcoming', 'in_progress', 'completed'))
    );

    CREATE TABLE IF NOT EXISTS hall_of_fame (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      season_number INTEGER NOT NULL UNIQUE,
      champion_team TEXT NOT NULL,
      champion_members TEXT NOT NULL,
      fmvp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS memorable_moments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hall_of_fame_id INTEGER NOT NULL REFERENCES hall_of_fame(id),
      title TEXT NOT NULL,
      description TEXT,
      image_url TEXT
    );

    CREATE TABLE IF NOT EXISTS sponsors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      logo_url TEXT,
      season_number INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS content_blocks (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS verification_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      used INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `)

  try {
    db.exec(`ALTER TABLE users ADD COLUMN must_change_password INTEGER NOT NULL DEFAULT 0`)
  } catch {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN login_attempts INTEGER NOT NULL DEFAULT 0`)
  } catch {}

  try {
    db.exec(`ALTER TABLE users ADD COLUMN locked_until TEXT`)
  } catch {}

  db.prepare(
    `UPDATE users SET must_change_password = 1 WHERE role = 'admin' AND must_change_password = 0`
  ).run()

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_registrations_season ON registrations(season_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_user ON registrations(user_id);
    CREATE INDEX IF NOT EXISTS idx_registrations_status ON registrations(status);
    CREATE INDEX IF NOT EXISTS idx_teams_season ON teams(season_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
    CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
    CREATE INDEX IF NOT EXISTS idx_matches_season ON matches(season_id);
    CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(round);
    CREATE INDEX IF NOT EXISTS idx_draw_records_team ON draw_records(team_id);
    CREATE INDEX IF NOT EXISTS idx_sponsors_season ON sponsors(season_number);
    CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
  `)

  seedData()
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const adminHash = bcryptjs.hashSync('admin123', 10)
  db.prepare(
    `INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, 'admin', 1)`
  ).run('admin', adminHash)

  db.prepare(
    `INSERT INTO seasons (number, title, subtitle, status, start_date, end_date, registration_deadline, rules, prizes, timeline) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    7,
    '海克斯大乱斗战术探讨 S7',
    '深渊裂隙 · 混沌再临',
    'registering',
    '2026-06-15',
    '2026-07-20',
    '2026-06-10',
    '1. 比赛模式：5v5 ARAM\n2. 淘汰赛制，单败淘汰\n3. 每队5人，由系统自动分队\n4. 队长抽卡获取符文加成\n5. 禁用英雄池每轮随机调整',
    '冠军：3000元奖金 + 限定皮肤\n亚军：2000元奖金\n季军：1000元奖金\nFMVP：专属奖杯 + 500元奖金',
    JSON.stringify([
      { date: '2026-05-20', event: '报名开始' },
      { date: '2026-06-10', event: '报名截止' },
      { date: '2026-06-12', event: '分队与抽卡' },
      { date: '2026-06-15', event: '小组赛开始' },
      { date: '2026-07-05', event: '淘汰赛开始' },
      { date: '2026-07-20', event: '总决赛' }
    ])
  )

  const runes = [
    { name: '海克斯护盾', description: '来自皮尔特沃夫的科技护盾', effect: '开局额外获得500金币', rarity: 'common', icon: 'shield' },
    { name: '虚空之眼', description: '虚空生物的凝视穿透一切', effect: '每局可禁用1个额外英雄', rarity: 'rare', icon: 'eye' },
    { name: '暗影步', description: '暗影岛的幽灵之力', effect: '全员获得一次免费回城机会', rarity: 'rare', icon: 'ghost' },
    { name: '烈焰之心', description: '弗雷尔卓德的远古火焰', effect: '开局全员获得红BUFF效果持续3分钟', rarity: 'epic', icon: 'flame' },
    { name: '冰霜契约', description: '凛冬之女的祝福', effect: '开局全员获得蓝BUFF效果持续3分钟', rarity: 'epic', icon: 'snowflake' },
    { name: '星灵庇佑', description: '巨神峰星灵的守护', effect: '全员复活时间减少20%', rarity: 'legendary', icon: 'star' },
    { name: '龙魂觉醒', description: '远古巨龙的灵魂共鸣', effect: '全员获得一次龙魂buff（持续5分钟）', rarity: 'legendary', icon: 'dragon' },
    { name: '时间扭曲', description: '佐伊的恶作剧时间魔法', effect: '每局可重开一次比赛（限前5分钟）', rarity: 'legendary', icon: 'clock' }
  ]
  const insertRune = db.prepare(
    'INSERT INTO runes (name, description, effect, rarity, icon) VALUES (?, ?, ?, ?, ?)'
  )
  for (const r of runes) {
    insertRune.run(r.name, r.description, r.effect, r.rarity, r.icon)
  }

  const hallOfFameData = [
    {
      season: 1, champion: '暗影猎手', members: ['夜行者', '影刃', '暗夜精灵', '幽冥刺客', '月影'],
      fmvp: '夜行者',
      moments: [
        { title: '绝境翻盘', description: '决赛第3局，暗影猎手在落后15个人头的情况下完成惊天翻盘' },
        { title: '夜行者的五杀', description: 'FMVP夜行者用劫完成五杀，全场沸腾' }
      ],
      sponsors: [{ name: '雷蛇 Razer', season: 1 }]
    },
    {
      season: 2, champion: '冰霜之翼', members: ['寒冰射手', '冰晶凤凰', '霜之守护', '极地战熊', '凛冬之怒'],
      fmvp: '寒冰射手',
      moments: [
        { title: '冰封千里', description: '冰霜之翼全员选择冰系英雄，冰封对手于水晶前' },
        { title: '寒冰射手的完美走位', description: 'FMVP寒冰射手在决赛中零死亡完美KDA' }
      ],
      sponsors: [{ name: '罗技 Logitech', season: 2 }]
    },
    {
      season: 3, champion: '烈焰军团', members: ['火焰领主', '熔岩巨人', '炎魔', '凤凰涅槃', '灼热之刃'],
      fmvp: '火焰领主',
      moments: [
        { title: '火焰风暴', description: '烈焰军团连续三局使用全AP阵容碾压对手' },
        { title: '火焰领主的逆天操作', description: 'FMVP火焰领主用布兰德打出全队70%伤害' }
      ],
      sponsors: [{ name: '赛睿 SteelSeries', season: 3 }]
    },
    {
      season: 4, champion: '星辰守卫', members: ['星之子', '银河骑士', '流星', '星光使者', '宇宙行者'],
      fmvp: '星之子',
      moments: [
        { title: '星辰陨落', description: '星辰守卫在半决赛中上演让二追三的奇迹' },
        { title: '星之子的神级辅助', description: 'FMVP星之子用锤石全场钩中率高达85%' }
      ],
      sponsors: [{ name: '海盗船 Corsair', season: 4 }]
    },
    {
      season: 5, champion: '雷霆战神', members: ['雷神', '闪电侠', '暴风之子', '电弧', '雷鸣'],
      fmvp: '雷神',
      moments: [
        { title: '雷霆万钧', description: '雷霆战神在决赛中仅用18分钟推平对手基地' },
        { title: '雷神的凯南大招', description: 'FMVP雷神用凯南大招同时命中5人，奠定胜局' }
      ],
      sponsors: [{ name: '华硕 ROG', season: 5 }, { name: '红牛 Red Bull', season: 5 }]
    },
    {
      season: 6, champion: '深渊领主', members: ['深渊使者', '暗夜君王', '虚空行者', '冥界之主', '深渊猎手'],
      fmvp: '深渊使者',
      moments: [
        { title: '深渊降临', description: '深渊领主在总决赛中3:0横扫对手，统治级表现' },
        { title: '深渊使者的完美连招', description: 'FMVP深渊使者用阿卡丽完成1v3极限反杀' },
        { title: '史上最短决赛', description: '三局比赛总时长仅52分钟，创赛事纪录' }
      ],
      sponsors: [{ name: '微星 MSI', season: 6 }, { name: '斗鱼直播', season: 6 }]
    }
  ]

  const insertHallOfFame = db.prepare(
    'INSERT INTO hall_of_fame (season_number, champion_team, champion_members, fmvp) VALUES (?, ?, ?, ?)'
  )
  const insertMoment = db.prepare(
    'INSERT INTO memorable_moments (hall_of_fame_id, title, description) VALUES (?, ?, ?)'
  )
  const insertSponsor = db.prepare(
    'INSERT INTO sponsors (name, season_number) VALUES (?, ?)'
  )

  for (const entry of hallOfFameData) {
    const result = insertHallOfFame.run(
      entry.season,
      entry.champion,
      JSON.stringify(entry.members),
      entry.fmvp
    )
    const hallOfFameId = result.lastInsertRowid as number
    for (const moment of entry.moments) {
      insertMoment.run(hallOfFameId, moment.title, moment.description)
    }
    for (const sponsor of entry.sponsors) {
      insertSponsor.run(sponsor.name, sponsor.season)
    }
  }

  console.log('Database initialized with seed data')
}

export default db
