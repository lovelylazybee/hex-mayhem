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

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      url TEXT,
      description TEXT NOT NULL,
      contact TEXT,
      ip_address TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'processing', 'resolved', 'dismissed')),
      admin_note TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS hextech_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      tier TEXT NOT NULL CHECK(tier IN ('prismatic', 'gold', 'silver')),
      image_url TEXT,
      lore TEXT,
      category TEXT
    );

    CREATE TABLE IF NOT EXISTS hextech_champions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hextech_id INTEGER NOT NULL REFERENCES hextech_items(id) ON DELETE CASCADE,
      champion_name TEXT NOT NULL,
      champion_title TEXT,
      champion_image TEXT
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
    CREATE INDEX IF NOT EXISTS idx_hextech_items_tier ON hextech_items(tier);
    CREATE INDEX IF NOT EXISTS idx_hextech_items_slug ON hextech_items(slug);
    CREATE INDEX IF NOT EXISTS idx_hextech_champions_hextech ON hextech_champions(hextech_id);
  `)

  seedData()
}

function seedData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }
  if (userCount.count > 0) return

  const adminHash = bcryptjs.hashSync('HexMayhem@2026!Admin', 10)
  db.prepare(
    `INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, 'admin', 1)`
  ).run('admin', adminHash)

  console.log('⚠️  默认管理员账号已创建，请立即登录修改密码！用户名: admin, 密码: HexMayhem@2026!Admin')

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

  // Seed hextech items
  const hextechCount = db.prepare('SELECT COUNT(*) as count FROM hextech_items').get() as { count: number }
  if (hextechCount.count === 0) {
    const hextechData = [
      { name: "台风", slug: "台风-silver", tier: "silver", description: "你的普通攻击会对一个额外目标发射一根弩箭，造成30%攻击力的物理伤害并施加100%的攻击特效。", imageUrl: "/hextech/台风.webp" },
      { name: "自我毁灭", slug: "自我毁灭-silver", tier: "silver", description: "每个回合开始时会有一个炸弹附在你身上。在5秒后，它会爆炸，对350码内的敌人造成相当于目标20%最大生命值的真实伤害并将其击飞0.75秒（25秒冷却时间）。", imageUrl: "/hextech/自我毁灭.webp" },
      { name: "冰寒", slug: "冰寒-silver", tier: "silver", description: "你的减速效果可使移动速度降低额外的100。", imageUrl: "/hextech/冰寒.webp" },
      { name: "旋转至胜", slug: "旋转至胜-silver", tier: "silver", description: "你的旋转类技能获得30技能急速并且多造成30%伤害！", imageUrl: "/hextech/旋转至胜.webp" },
      { name: "会心防守", slug: "会心防守-silver", tier: "silver", description: "获得等同于100%暴击几率的【会心防御几率】，上限为50%。获得25%暴击几率。\n\n【会心防御】：让你有几率使受到的单次伤害降低20%。", imageUrl: "/hextech/会心防守.webp" },
      { name: "巫师式思考", slug: "巫师式思考-silver", tier: "silver", description: "获得20到80法术强度。（基于等级）", imageUrl: "/hextech/巫师式思考.webp" },
      { name: "侵蚀", slug: "侵蚀-silver", tier: "silver", description: "对敌人造成伤害时会施加持续4秒的一层效果，使其护甲和魔法抗性降低1.5%，至多叠加20层（至高30%双抗击碎）。", imageUrl: "/hextech/侵蚀.webp" },
      { name: "点亮他们！", slug: "点亮他们！-silver", tier: "silver", description: "每第4次攻击消耗层数对目标快速发射4枚烟花，每枚烟花造成11-80(+35%额外AD)(+19%AP)的额外魔法伤害，总计造成44-320(+140%额外AD)(+76%AP)伤害。", imageUrl: "/hextech/点亮他们！.webp" },
      { name: "山脉龙魂", slug: "山脉龙魂-silver", tier: "silver", description: "你获得山脉龙魂，在脱离战斗之后获得一个持续一小段时间的护盾。", imageUrl: "/hextech/山脉龙魂.webp" },
      { name: "双发快射", slug: "双发快射-silver", tier: "gold", description: "获得30%攻击速度。\n你的攻击会发射第二枚子弹，造成25%攻击力的物理伤害并施加100%的攻击特效。", imageUrl: "/hextech/双发快射.webp" },
      { name: "古式佳酿", slug: "古式佳酿-silver", tier: "gold", description: "获得15技能急速。你的技能会留下一滩持续3秒的酒池，减速30%并每秒造成8-40（基于等级）魔法伤害。", imageUrl: "/hextech/古式佳酿.webp" },
      { name: "吵闹鬼", slug: "吵闹鬼-silver", tier: "silver", description: "获得30法术强度。用技能对敌人造成伤害时，会发射一个吵闹鬼，对目标造成20-50(+15%AP)额外魔法伤害。", imageUrl: "/hextech/吵闹鬼.webp" },
      { name: "吸血习性", slug: "吸血习性-silver", tier: "gold", description: "获得8%全能吸血。", imageUrl: "/hextech/吸血习性.webp" },
      { name: "咏叹奏鸣", slug: "咏叹奏鸣-gold", tier: "gold", description: "每10秒交替自动施放【坚毅咏叹调】和【迅捷奏鸣曲】", imageUrl: "/hextech/咏叹奏明.webp" },
      { name: "回力OK镖", slug: "回力OK镖-silver", tier: "gold", description: "你的远程普通攻击会弹射到1个额外目标，造成50%攻击力的物理伤害。", imageUrl: "/hextech/回力OK镖.webp" },
      { name: "回归基本功", slug: "回归基本功-silver", tier: "prismatic", description: "获得15攻击力。", imageUrl: "/hextech/回归基本功.webp" },
      { name: "坚韧", slug: "坚韧-silver", tier: "gold", description: "获得100额外生命值。", imageUrl: "/hextech/坚韧.webp" },
      { name: "基石法师", slug: "基石法师-silver", tier: "gold", description: "获得25法术强度。", imageUrl: "/hextech/基石法师.webp" },
      { name: "大力", slug: "大力-silver", tier: "silver", description: "获得15攻击力和15%攻击速度。", imageUrl: "/hextech/大力.webp" },
      { name: "夺金", slug: "夺金-silver", tier: "prismatic", description: "获得2金币/秒的被动收入。", imageUrl: "/hextech/夺金.webp" },
      { name: "家园卫士", slug: "家园卫士-silver", tier: "silver", description: "在泉水时获得75%额外移动速度，持续1.5秒。", imageUrl: "/hextech/家园卫士.webp" },
      { name: "小丑学院", slug: "小丑学院-silver", tier: "prismatic", description: "你的技能可以暴击，造成20%额外伤害。获得25%暴击几率。", imageUrl: "/hextech/小丑学院.webp" },
      { name: "尖端发明家", slug: "尖端发明家-silver", tier: "gold", description: "获得20技能急速。", imageUrl: "/hextech/尖端发明家.webp" },
      { name: "尤里卡", slug: "尤里卡-silver", tier: "prismatic", description: "获得20技能急速和15法术强度。", imageUrl: "/hextech/尤里卡.webp" },
      { name: "属性！", slug: "属性！-silver", tier: "silver", description: "获得5攻击力、5法术强度、5额外生命值、5%攻击速度、5技能急速、5%全能吸血。", imageUrl: "/hextech/属性！.webp" },
      { name: "巨人杀手", slug: "巨人杀手-silver", tier: "prismatic", description: "对最大生命值高于你的敌人造成5%额外伤害。", imageUrl: "/hextech/巨人杀手.webp" },
      { name: "弹球", slug: "弹球-silver", tier: "gold", description: "你的单体技能会在命中后弹射到附近1个敌人身上，造成30%的伤害。", imageUrl: "/hextech/弹球.webp" },
      { name: "强力护盾", slug: "强力护盾-silver", tier: "silver", description: "获得一个持续3秒的护盾，可吸收50-150（基于等级）伤害（15秒冷却时间）。", imageUrl: "/hextech/强力护盾.webp" },
      { name: "循环往复", slug: "循环往复-silver", tier: "gold", description: "获得15技能急速。在你施放终极技能后，返还其20%冷却时间。", imageUrl: "/hextech/循环往复.webp" },
      { name: "心灵净化", slug: "心灵净化-silver", tier: "gold", description: "获得30%韧性。", imageUrl: "/hextech/心灵净化.webp" },
      { name: "急急小子", slug: "急急小子-silver", tier: "gold", description: "获得10%移动速度。", imageUrl: "/hextech/急急小子.webp" },
      { name: "急救用具", slug: "急救用具-silver", tier: "silver", description: "获得15%治疗和护盾强度。", imageUrl: "/hextech/急救用具.webp" },
      { name: "感受燃烧", slug: "感受燃烧-silver", tier: "prismatic", description: "你的伤害型技能会在命中时施加持续3秒的灼烧效果，共造成8-30（基于等级）魔法伤害。", imageUrl: "/hextech/感受燃烧.webp" },
      { name: "战争交响乐", slug: "战争交响乐-silver", tier: "prismatic", description: "获得15攻击力和15法术强度。", imageUrl: "/hextech/战争交响乐.webp" },
      { name: "扇巴掌", slug: "扇巴掌-silver", tier: "silver", description: "你的近战普通攻击会对目标身后锥形范围内的敌人造成40%攻击力的物理伤害。", imageUrl: "/hextech/扇巴掌.webp" },
      { name: "折磨者", slug: "折磨者-silver", tier: "silver", description: "对移动受限的敌人造成12%额外伤害。", imageUrl: "/hextech/折磨者.webp" },
      { name: "接二连三", slug: "接二连三-silver", tier: "gold", description: "在你对一名敌方英雄造成伤害后的3秒内，你的下一次攻击或技能对其造成15额外魔法伤害（2秒冷却时间）。", imageUrl: "/hextech/接二连三.webp" },
      { name: "无休回复", slug: "无休回复-silver", tier: "gold", description: "获得2%已损失生命值/秒的生命回复。", imageUrl: "/hextech/无休回复.webp" },
      { name: "易损", slug: "易损-silver", tier: "gold", description: "你对敌人造成的前6次攻击或技能造成5%额外伤害。", imageUrl: "/hextech/易损.webp" },
      { name: "星界躯体", slug: "星界躯体-silver", tier: "gold", description: "获得150额外生命值，但你的伤害降低8%。", imageUrl: "/hextech/星界躯体.webp" },
      { name: "暗影疾奔", slug: "暗影疾奔-silver", tier: "silver", description: "获得15%移动速度。在脱离战斗后，额外获得15%移动速度。", imageUrl: "/hextech/暗影疾奔.webp" },
      { name: "暴击律动", slug: "暴击律动-silver", tier: "gold", description: "获得25%暴击几率。", imageUrl: "/hextech/暴击律动.webp" },
      { name: "注魔", slug: "注魔-silver", tier: "silver", description: "获得25法术强度和10技能急速。", imageUrl: "/hextech/注魔.webp" },
      { name: "活力再生", slug: "活力再生-silver", tier: "silver", description: "获得50%基础法力回复。", imageUrl: "/hextech/活力再生.webp" },
      { name: "海洋龙魂", slug: "海洋龙魂-silver", tier: "silver", description: "你获得海洋龙魂，在对敌人造成伤害时回复生命值和法力值。", imageUrl: "/hextech/海洋龙魂.webp" },
      { name: "溢流", slug: "溢流-silver", tier: "gold", description: "获得20法术强度。你的法力值溢出时，将溢出部分转化为法术强度（1%法力值=1法术强度）。", imageUrl: "/hextech/溢流.webp" },
      { name: "激光治疗", slug: "激光治疗-silver", tier: "prismatic", description: "获得15%治疗和护盾强度。你的治疗和护盾效果在目标生命值低于40%时增强15%。", imageUrl: "/hextech/激光治疗.webp" },
      { name: "灵巧", slug: "灵巧-silver", tier: "silver", description: "获得10%闪避几率。", imageUrl: "/hextech/灵巧.webp" },
      { name: "炼狱导管", slug: "炼狱导管-silver", tier: "prismatic", description: "获得15法术穿透。", imageUrl: "/hextech/炼狱导管.webp" },
      { name: "物法皆修", slug: "物法皆修-silver", tier: "prismatic", description: "获得15攻击力和25法术强度。", imageUrl: "/hextech/物法皆修.webp" },
      { name: "狂徒豪气", slug: "狂徒豪气-silver", tier: "gold", description: "获得300额外生命值。如果你在6秒内没有受到伤害，每秒回复5%最大生命值。", imageUrl: "/hextech/狂徒豪气.webp" },
      { name: "珠光护手", slug: "珠光护手-silver", tier: "prismatic", description: "获得25%暴击几率和15法术强度。", imageUrl: "/hextech/珠光护手.webp" },
      { name: "由心及物", slug: "由心及物-silver", tier: "silver", description: "获得等同于15%额外法术强度的攻击力。", imageUrl: "/hextech/由心及物.webp" },
      { name: "砍伤", slug: "砍伤-silver", tier: "prismatic", description: "获得15攻击力。你的攻击对敌人施加持续5秒的【砍伤】效果，每秒造成2-8（基于等级）物理伤害。", imageUrl: "/hextech/砍伤.webp" },
      { name: "神圣干预", slug: "神圣干预-silver", tier: "gold", description: "当你受到致命伤害时，免疫该伤害并在2秒内回复10%最大生命值（120秒冷却时间）。", imageUrl: "/hextech/神圣干预.webp" },
      { name: "精准奇才", slug: "精准奇才-silver", tier: "prismatic", description: "获得15%攻击速度和15攻击力。", imageUrl: "/hextech/精准奇才.webp" },
      { name: "红包", slug: "红包-silver", tier: "prismatic", description: "每60秒获得一个红包，打开后获得随机金币。", imageUrl: "/hextech/红包.webp" },
      { name: "练腿日", slug: "练腿日-silver", tier: "silver", description: "获得15%移动速度和100额外生命值。", imageUrl: "/hextech/练腿日.webp" },
      { name: "缩小射线", slug: "缩小射线-silver", tier: "gold", description: "你的下一个攻击会缩小目标，使其造成的伤害降低10%并减少10%移动速度，持续3秒（8秒冷却时间）。", imageUrl: "/hextech/缩小射线.webp" },
      { name: "老练狙神", slug: "老练狙神-silver", tier: "gold", description: "获得15攻击力。你的远程攻击在最大射程命中时造成10%额外伤害。", imageUrl: "/hextech/老练狙神.webp" },
      { name: "退敌力场", slug: "退敌力场-silver", tier: "silver", description: "获得200额外生命值。在你被硬控命中时，对周围敌人造成50-150（基于等级）魔法伤害并将其击退。", imageUrl: "/hextech/退敌力场.webp" },
      { name: "速度恶魔", slug: "速度恶魔-silver", tier: "silver", description: "获得10%移动速度和15技能急速。", imageUrl: "/hextech/速度恶魔.webp" },
      { name: "闪光弹", slug: "闪光弹-silver", tier: "silver", description: "你的技能命中敌方英雄时，有20%几率致盲目标1秒。", imageUrl: "/hextech/闪光弹.webp" },
      { name: "闪电打击", slug: "闪电打击-silver", tier: "gold", description: "每3次攻击会释放一道闪电，对目标造成30-100（基于等级）魔法伤害。", imageUrl: "/hextech/闪电打击.webp" },
      { name: "防护面纱", slug: "防护面纱-silver", tier: "silver", description: "获得一个法术护盾，可抵挡一次敌方技能（30秒冷却时间）。", imageUrl: "/hextech/防护面纱.webp" },
      { name: "面包和黄油", slug: "面包和黄油-silver", tier: "gold", description: "获得5攻击力、5法术强度、100生命值。", imageUrl: "/hextech/面包和黄油.webp" },
      { name: "风语者的祝福", slug: "风语者的祝福-silver", tier: "prismatic", description: "获得10%治疗和护盾强度。你对友方施加的治疗和护盾效果额外增加10%。", imageUrl: "/hextech/风语者的祝福.webp" },
      { name: "飞身踢", slug: "飞身踢-silver", tier: "prismatic", description: "你的冲刺技能会在终点造成40-120（基于等级）物理伤害。", imageUrl: "/hextech/飞身踢.webp" },
      { name: "魄罗爆破手", slug: "魄罗爆破手-silver", tier: "gold", description: "你的技能会在命中位置生成一个魄罗，1秒后爆炸造成20-60（基于等级）魔法伤害。", imageUrl: "/hextech/魄罗爆破手.webp" },
      { name: "魔法飞弹", slug: "魔法飞弹-silver", tier: "gold", description: "你的技能命中时会发射3枚魔法飞弹，每枚造成5-20（基于等级）魔法伤害。", imageUrl: "/hextech/魔法飞弹.webp" },
      { name: "一板一眼", slug: "一板一眼-gold", tier: "gold", description: "获得15%攻击速度。你的普通攻击在命中时获得一层【节奏】，在6层时，你的下一次攻击造成40额外物理伤害并消耗所有层数。", imageUrl: "/hextech/一板一眼.webp" },
      { name: "万用瞄准镜", slug: "万用瞄准镜-gold", tier: "silver", description: "获得75额外攻击距离。", imageUrl: "/hextech/万用瞄准镜.webp" },
      { name: "不动如山", slug: "不动如山-gold", tier: "gold", description: "获得30护甲和30魔法抗性。在你站立不动1秒后，获得额外30护甲和30魔法抗性。", imageUrl: "/hextech/不动如山.webp" },
      { name: "不祥契约", slug: "不祥契约-gold", tier: "prismatic", description: "获得40法术强度。你受到的30%伤害会转化为持续3秒的债务，而非立即扣除。", imageUrl: "/hextech/不祥契约.webp" },
      { name: "亮出你的剑", slug: "亮出你的剑-gold", tier: "prismatic", description: "获得25攻击力和25%攻击速度。你的攻击在命中时获得一层【亮剑】，在5层时，你的下一次攻击造成50额外物理伤害。", imageUrl: "/hextech/亮出你的剑.webp" },
      { name: "仆从大师", slug: "仆从大师-gold", tier: "gold", description: "你召唤的仆从获得30%攻击速度和30额外生命值。", imageUrl: "/hextech/仆从大师.webp" },
      { name: "会心治疗", slug: "会心治疗-gold", tier: "gold", description: "获得20%治疗和护盾强度。你的暴击几率的20%转化为治疗和护盾强度。", imageUrl: "/hextech/会心治疗.webp" },
      { name: "你摸不到", slug: "你摸不到-gold", tier: "prismatic", description: "获得20%闪避几率。成功闪避后，获得30%移动速度，持续1秒。", imageUrl: "/hextech/你摸不到.webp" },
      { name: "你肩上的恶魔", slug: "你肩上的恶魔-gold", tier: "prismatic", description: "获得25攻击力。你的技能命中敌方英雄时，恶魔会对其造成15-50（基于等级）额外魔法伤害（3秒冷却时间）。", imageUrl: "/hextech/你肩上的恶魔.webp" },
      { name: "信念者的强化", slug: "信念者的强化-gold", tier: "prismatic", description: "获得20%韧性和20%减速抵抗。", imageUrl: "/hextech/信念者的强化.webp" },
      { name: "俯冲轰炸", slug: "俯冲轰炸-gold", tier: "silver", description: "你的冲刺/位移技能会在路径上留下炸弹，1秒后爆炸造成60-180（基于等级）魔法伤害。", imageUrl: "/hextech/俯冲轰炸.webp" },
      { name: "全凭身法", slug: "全凭身法-gold", tier: "prismatic", description: "获得15%闪避几率。闪避攻击后，获得20%攻击速度，持续2秒。", imageUrl: "/hextech/全凭身法.webp" },
      { name: "全心为你", slug: "全心为你-gold", tier: "gold", description: "获得20%治疗和护盾强度。你对友军施加的治疗效果额外增加10%。", imageUrl: "/hextech/全心为你.webp" },
      { name: "关键暴击", slug: "关键暴击-gold", tier: "gold", description: "获得25%暴击几率。你的暴击伤害增加15%。", imageUrl: "/hextech/关键暴击.webp" },
      { name: "冰霜幽灵", slug: "冰霜幽灵-gold", tier: "silver", description: "你的减速效果可使移动速度降低额外的50。被你减速的敌人受到8%额外伤害。", imageUrl: "/hextech/冰霜幽灵.webp" },
      { name: "刃下生风", slug: "刃下生风-gold", tier: "silver", description: "获得15%攻击速度。你的普通攻击在命中时获得3%移动速度（至多叠加5次）。", imageUrl: "/hextech/刃下生风.webp" },
      { name: "史上最大雪球", slug: "史上最大雪球-gold", tier: "prismatic", description: "获得300额外生命值。你的技能命中的敌人越多，造成的伤害越高（每多命中一个敌人增加10%伤害）。", imageUrl: "/hextech/史上最大雪球.webp" },
      { name: "吞噬灵魂", slug: "吞噬灵魂-gold", tier: "gold", description: "获得20法术强度。击杀或助攻后，获得10法术强度（至多叠加5次），死亡后损失一半层数。", imageUrl: "/hextech/吞噬灵魂.webp" },
      { name: "和我一起困在这里", slug: "和我一起困在这里-gold", tier: "prismatic", description: "获得40额外生命值和10护甲。在你被定身时，定身你的敌人也会被定身0.5秒。", imageUrl: "/hextech/和我一起困在这里.webp" },
      { name: "唯快不破", slug: "唯快不破-gold", tier: "silver", description: "获得20%攻击速度和15%暴击几率。你的攻击速度超过2.0时，攻击造成10%额外伤害。", imageUrl: "/hextech/唯快不破.webp" },
      { name: "圣火", slug: "圣火-gold", tier: "gold", description: "获得20法术强度。你的技能命中时点燃目标，在3秒内造成20-60（基于等级）魔法伤害。", imageUrl: "/hextech/圣火.webp" },
      { name: "地狱三头犬", slug: "地狱三头犬-gold", tier: "prismatic", description: "获得丛刃和强攻符文。", imageUrl: "/hextech/地狱三头犬.webp" },
      { name: "坦克引擎", slug: "坦克引擎-gold", tier: "gold", description: "获得300额外生命值和10%冷却缩减。", imageUrl: "/hextech/坦克引擎.webp" },
      { name: "夜狩", slug: "夜狩-gold", tier: "gold", description: "获得20攻击力和15%攻击速度。在草丛中时，你的攻击射程增加75。", imageUrl: "/hextech/夜狩.webp" },
      { name: "大地苏醒", slug: "大地苏醒-gold", tier: "gold", description: "获得30护甲。你的硬控技能会在目标脚下制造一次地震，造成30-100（基于等级）魔法伤害。", imageUrl: "/hextech/大地苏醒.webp" },
      { name: "小猫咪找妈妈", slug: "小猫咪找妈妈-gold", tier: "prismatic", description: "获得15%移动速度。靠近友军时，双方获得10%移动速度。", imageUrl: "/hextech/小猫咪找妈妈.webp" },
      { name: "属性叠属性！", slug: "属性叠属性！-gold", tier: "gold", description: "获得10攻击力、10法术强度、100生命值、10%攻击速度、10技能急速、5%全能吸血。", imageUrl: "/hextech/属性叠属性！.webp" },
      { name: "当心小蛋糕！", slug: "当心小蛋糕！-gold", tier: "prismatic", description: "在你附近放置一个隐形的蛋糕陷阱。踩到的敌人会被减速40%并受到80-200（基于等级）魔法伤害（20秒冷却时间）。", imageUrl: "/hextech/当心小蛋糕！.webp" },
      { name: "快中求稳", slug: "快中求稳-gold", tier: "silver", description: "获得20%攻击速度和15护甲。", imageUrl: "/hextech/快中求稳.webp" },
      { name: "捐赠", slug: "捐赠-gold", tier: "gold", description: "你附近友军获得5%移动速度和5%攻击速度。", imageUrl: "/hextech/捐赠.webp" },
      { name: "无限循环往复", slug: "无限循环往复-gold", tier: "prismatic", description: "获得25技能急速。在你施放终极技能后，返还其40%冷却时间。", imageUrl: "/hextech/无限循环往复.webp" },
      { name: "最终都市列车", slug: "最终都市列车-gold", tier: "gold", description: "获得20%移动速度。在冲刺结束后，对终点附近的敌人造成60-180（基于等级）物理伤害并将其击飞0.5秒。", imageUrl: "/hextech/最终都市列车.webp" },
      { name: "有始有终", slug: "有始有终-gold", tier: "gold", description: "获得20技能急速。你的技能首次命中和末次命中分别造成15额外魔法伤害。", imageUrl: "/hextech/有始有终.webp" },
      { name: "杀意翻涌", slug: "杀意翻涌-gold", tier: "silver", description: "获得25攻击力。你的攻击在命中低于50%生命值的敌人时造成10%额外伤害。", imageUrl: "/hextech/杀意翻涌.webp" },
      { name: "海克斯龙魂", slug: "海克斯龙魂-gold", tier: "silver", description: "你获得海克斯龙魂，获得所有龙魂效果的弱化版本。", imageUrl: "/hextech/海克斯龙魂.webp" },
      { name: "渴血", slug: "渴血-gold", tier: "silver", description: "获得15攻击力和10%物理吸血。", imageUrl: "/hextech/渴血.webp" },
      { name: "火上浇油", slug: "火上浇油-gold", tier: "gold", description: "获得30法术强度。你对已受灼烧效果影响的敌人造成15%额外伤害。", imageUrl: "/hextech/火上浇油.webp" },
      { name: "火狐", slug: "火狐-gold", tier: "silver", description: "获得25法术强度和10%移动速度。你的技能命中时获得5%移动速度，持续2秒（至多叠加3次）。", imageUrl: "/hextech/火狐.webp" },
      { name: "灵魂虹吸", slug: "灵魂虹吸-gold", tier: "gold", description: "获得20法术强度和8%法术吸血。", imageUrl: "/hextech/灵魂虹吸.webp" },
      { name: "炼狱龙魂", slug: "炼狱龙魂-gold", tier: "silver", description: "你获得炼狱龙魂，你的攻击和技能会灼烧敌人。", imageUrl: "/hextech/炼狱龙魂.webp" },
      { name: "炽烈黎明", slug: "炽烈黎明-gold", tier: "gold", description: "获得20法术强度。你的技能在命中敌方英雄时，在目标位置创造一个持续3秒的光明区域，对区域内敌人每秒造成10-30（基于等级）魔法伤害。", imageUrl: "/hextech/炽烈黎明.webp" },
      { name: "狂热者", slug: "狂热者-gold", tier: "silver", description: "获得25%攻击速度和15%暴击几率。", imageUrl: "/hextech/狂热者.webp" },
      { name: "生机迸发", slug: "生机迸发-gold", tier: "gold", description: "获得200额外生命值和50%基础生命回复。", imageUrl: "/hextech/生机迸发.webp" },
      { name: "由暴生急", slug: "由暴生急-gold", tier: "silver", description: "获得20%暴击几率。你的暴击几率的30%转化为技能急速。", imageUrl: "/hextech/由暴生急.webp" },
      { name: "男爵之手", slug: "男爵之手-gold", tier: "prismatic", description: "获得30攻击力和15护甲穿透。你的攻击对建筑造成50%额外伤害。", imageUrl: "/hextech/男爵之手.webp" },
      { name: "砸开那颗蛋", slug: "砸开那颗蛋-gold", tier: "silver", description: "获得25攻击力。你的攻击对护盾造成200%伤害。", imageUrl: "/hextech/砸开那颗蛋.webp" },
      { name: "祖母的辣椒油", slug: "祖母的辣椒油-gold", tier: "gold", description: "获得20法术强度。你的技能命中时施加持续3秒的灼烧效果，共造成15-50（基于等级）魔法伤害。灼烧效果可叠加3次。", imageUrl: "/hextech/祖母的辣椒油.webp" },
      { name: "神圣雪球", slug: "神圣雪球-gold", tier: "prismatic", description: "获得200额外生命值。你的技能命中的每个敌方英雄赋予你一个雪球层数，在5层时消耗所有层数回复10%最大生命值。", imageUrl: "/hextech/神圣雪球.webp" },
      { name: "神射法师", slug: "神射法师-gold", tier: "gold", description: "获得25法术强度和15%攻击速度。你的普通攻击造成15额外魔法伤害。", imageUrl: "/hextech/神射法师.webp" },
      { name: "秘术冲拳", slug: "秘术冲拳-gold", tier: "prismatic", description: "获得20攻击力和20法术强度。你的冲刺技能在命中敌人时造成30-90（基于等级）额外魔法伤害。", imageUrl: "/hextech/秘术冲拳.webp" },
      { name: "穿针引线", slug: "穿针引线-gold", tier: "gold", description: "获得20%攻击速度。你的普通攻击在命中时获得一层【针线】，在5层时，你的下一次攻击治疗你30-80（基于等级）生命值。", imageUrl: "/hextech/穿针引线.webp" },
      { name: "精怪魔法", slug: "精怪魔法-gold", tier: "prismatic", description: "获得30法术强度。你的技能有15%几率造成25%额外伤害。", imageUrl: "/hextech/精怪魔法.webp" },
      { name: "纯粹主义者-术师", slug: "纯粹主义者-术师-gold", tier: "silver", description: "获得40法术强度。你只能造成魔法伤害。", imageUrl: "/hextech/纯粹主义者-术师.webp" },
      { name: "终极不可阻挡", slug: "终极不可阻挡-gold", tier: "silver", description: "获得30护甲和30魔法抗性。施放终极技能后，获得免疫控制效果，持续2秒。", imageUrl: "/hextech/终极不可阻挡.webp" },
      { name: "缩小引擎", slug: "缩小引擎-gold", tier: "gold", description: "获得20技能急速。你的技能会使目标缩小，减少10%造成的伤害和10%移动速度，持续3秒。", imageUrl: "/hextech/缩小引擎.webp" },
      { name: "罪恶快感", slug: "罪恶快感-gold", tier: "gold", description: "获得15%攻击速度和15%移动速度。在击杀或助攻后，获得30%攻击速度和30%移动速度，持续3秒。", imageUrl: "/hextech/罪恶快感.webp" },
      { name: "至高天诺言", slug: "至高天诺言-gold", tier: "prismatic", description: "获得20攻击力和20法术强度。在击杀或助攻后，回复15%最大生命值和法力值。", imageUrl: "/hextech/至高天诺言.webp" },
      { name: "舞会女王", slug: "舞会女王-gold", tier: "prismatic", description: "获得20%移动速度和25%攻击速度。你的移动距离越远，下一次攻击造成的伤害越高（至多增加30%）。", imageUrl: "/hextech/舞会女王.webp" },
      { name: "虚幻武器", slug: "虚幻武器-gold", tier: "gold", description: "获得20攻击力。你的攻击力10%转化为法术强度。你的法术强度10%转化为攻击力。", imageUrl: "/hextech/虚幻武器.webp" },
      { name: "蛋白粉奶昔", slug: "蛋白粉奶昔-gold", tier: "prismatic", description: "获得200额外生命值和15攻击力。", imageUrl: "/hextech/蛋白粉奶昔.webp" },
      { name: "裁决使", slug: "裁决使-gold", tier: "gold", description: "获得20攻击力和15%暴击几率。你对生命值低于30%的敌人造成15%额外伤害。", imageUrl: "/hextech/裁决使.webp" },
      { name: "负重爆气", slug: "负重爆气-gold", tier: "silver", description: "获得200额外生命值和15攻击力。你的冲刺技能在命中敌人时造成40-120（基于等级）物理伤害。", imageUrl: "/hextech/负重爆气.webp" },
      { name: "超凡邪恶", slug: "超凡邪恶-gold", tier: "gold", description: "获得30法术强度。对敌方英雄造成伤害时获得1层【邪恶】，每层提供3法术强度（至多10层）。死亡后损失一半层数。", imageUrl: "/hextech/超凡邪恶.webp" },
      { name: "超强大脑", slug: "超强大脑-gold", tier: "gold", description: "获得30技能急速和15法术强度。", imageUrl: "/hextech/超强大脑.webp" },
      { name: "踢踏舞", slug: "踢踏舞-gold", tier: "prismatic", description: "获得15%移动速度。你的移动会积累【踢踏】层数，在10层时释放一次冲击波，对周围敌人造成40-120（基于等级）物理伤害。", imageUrl: "/hextech/踢踏舞.webp" },
      { name: "转得我眩晕了", slug: "转得我眩晕了-gold", tier: "silver", description: "获得20%攻击速度。你的旋转类技能范围增加20%。", imageUrl: "/hextech/转得我眩晕了.webp" },
      { name: "连拨击锤", slug: "连拨击锤-gold", tier: "prismatic", description: "获得25%攻击速度。你的攻击有20%几率触发一次额外攻击，造成50%攻击力的物理伤害。", imageUrl: "/hextech/连拨击锤.webp" },
      { name: "逃跑计划", slug: "逃跑计划-gold", tier: "silver", description: "获得15%移动速度。在生命值低于30%时，获得额外30%移动速度，持续2秒（15秒冷却时间）。", imageUrl: "/hextech/逃跑计划.webp" },
      { name: "重量级打击手", slug: "重量级打击手-gold", tier: "silver", description: "获得200额外生命值和20攻击力。你的普通攻击造成10%额外物理伤害。", imageUrl: "/hextech/重量级打击手.webp" },
      { name: "闪现向前", slug: "闪现向前-gold", tier: "gold", description: "获得15%移动速度。你的闪现冷却时间减少30%。", imageUrl: "/hextech/闪现向前.webp" },
      { name: "雪球扭蛋机", slug: "雪球扭蛋机-gold", tier: "gold", description: "获得200额外生命值。每20秒获得一个随机增益效果。", imageUrl: "/hextech/雪球扭蛋机.webp" },
      { name: "霸符兄弟", slug: "霸符兄弟-gold", tier: "silver", description: "获得30护甲和20技能急速。", imageUrl: "/hextech/霸符兄弟.webp" },
      { name: "面包和奶酪", slug: "面包和奶酪-gold", tier: "gold", description: "获得10攻击力、10法术强度、200生命值。", imageUrl: "/hextech/面包和奶酪.webp" },
      { name: "面包和果酱", slug: "面包和果酱-gold", tier: "gold", description: "获得8攻击力、8法术强度、150生命值、8%攻击速度。", imageUrl: "/hextech/面包和果酱.webp" },
      { name: "魄罗之王的弹跳", slug: "魄罗之王的弹跳-gold", tier: "prismatic", description: "获得15%移动速度。你的冲刺技能距离增加20%。", imageUrl: "/hextech/魄罗之王的弹跳.webp" },
      { name: "魔鬼之舞", slug: "魔鬼之舞-gold", tier: "gold", description: "获得25攻击力和10%物理吸血。你的攻击在命中时回复3-12（基于等级）生命值。", imageUrl: "/hextech/魔鬼之舞.webp" },
      { name: "黎明使者的坚决", slug: "黎明使者的坚决-gold", tier: "gold", description: "获得30护甲和30魔法抗性。在白天时，额外获得10护甲和10魔法抗性。", imageUrl: "/hextech/黎明使者的坚决.webp" },
      { name: "任务：沃格勒特的巫师帽", slug: "任务：沃格勒特的巫师帽-prismatic", tier: "prismatic", description: "获得25法术强度。\n\n任务：使用技能对敌方英雄造成伤害1500次。\n\n奖励：升级为沃格勒特的巫师帽，获得120法术强度。", imageUrl: "/hextech/任务：沃格勒特的巫师帽.webp" },
      { name: "任务：海牛阿福的勇士", slug: "任务：海牛阿福的勇士-prismatic", tier: "prismatic", description: "获得15攻击力和15%攻击速度。\n\n任务：参与击杀10次。\n\n奖励：升级为海牛阿福的勇士，获得40攻击力和40%攻击速度。", imageUrl: "/hextech/任务：海牛阿福的勇士.webp" },
      { name: "任务：艾卡西亚的陷落", slug: "任务：艾卡西亚的陷落-prismatic", tier: "prismatic", description: "获得20法术强度。\n\n任务：用技能对敌方英雄造成10000伤害。\n\n奖励：升级为艾卡西亚的陷落，获得80法术强度和15法术穿透。", imageUrl: "/hextech/任务：艾卡西亚的陷落.webp" },
      { name: "任务：钢化你心", slug: "任务：钢化你心-prismatic", tier: "gold", description: "获得200额外生命值。\n\n任务：承受10000伤害。\n\n奖励：升级为钢化你心，获得600额外生命值。", imageUrl: "/hextech/任务：钢化你心.webp" },
      { name: "作弊：我能回城", slug: "作弊：我能回城-prismatic", tier: "gold", description: "你可以随时随地使用回城（8秒引导，120秒冷却时间）。回城完成后，回复50%最大生命值和法力值。", imageUrl: "/hextech/作弊：我能回城.webp" },
      { name: "全能龙魂", slug: "全能龙魂-prismatic", tier: "prismatic", description: "你获得所有四种龙魂效果：炼狱、海洋、山脉、云端。每种龙魂效果为正常版本的60%。", imageUrl: "/hextech/全能龙魂.webp" },
      { name: "卡皮巴拉空投", slug: "卡皮巴拉空投-prismatic", tier: "prismatic", description: "每60秒，一只卡皮巴拉会从天而降，在落点区域造成150-450（基于等级）真实伤害，并留下一个持续5秒的增益区域，区域内友军获得20%移动速度和15%伤害减免。", imageUrl: "/hextech/卡皮巴拉空投.webp" },
      { name: "升级：中娅", slug: "升级：中娅-prismatic", tier: "silver", description: "获得40法术强度和15护甲。\n\n主动—凝滞：进入凝滞状态2.5秒，期间免疫且不可选定（90秒冷却时间）。", imageUrl: "/hextech/升级：中娅.webp" },
      { name: "升级：收集者", slug: "升级：收集者-prismatic", tier: "silver", description: "获得30攻击力和25%暴击几率。\n\n你对生命值低于5%的敌人造成伤害时直接将其处决。击杀后获得额外25金币。", imageUrl: "/hextech/升级：收集者.webp" },
      { name: "升级：无尽之刃", slug: "升级：无尽之刃-prismatic", tier: "gold", description: "获得35攻击力和30%暴击几率。\n\n你的暴击伤害增加40%。", imageUrl: "/hextech/升级：无尽之刃.webp" },
      { name: "升级：狂妄", slug: "升级：狂妄-prismatic", tier: "gold", description: "获得40攻击力。\n\n你的攻击力增加25%。", imageUrl: "/hextech/升级：狂妄.webp" },
      { name: "升级：献祭", slug: "升级：献祭-prismatic", tier: "silver", description: "获得40护甲。\n\n对周围敌人每秒造成20-40（基于等级）魔法伤害。对小兵和野怪增加200%伤害。", imageUrl: "/hextech/升级：献祭.webp" },
      { name: "升级：米凯尔的祝福", slug: "升级：米凯尔的祝福-prismatic", tier: "prismatic", description: "获得20%治疗和护盾强度和50%基础法力回复。\n\n主动—净化：移除一名友军的所有控制效果并回复100-300（基于等级）生命值（120秒冷却时间）。", imageUrl: "/hextech/升级：米凯尔的祝福.webp" },
      { name: "升级：耀光", slug: "升级：耀光-prismatic", tier: "gold", description: "获得25法术强度和15技能急速。\n\n施放技能后，你的下一次攻击造成100%基础攻击力的额外物理伤害。", imageUrl: "/hextech/升级：耀光.webp" },
      { name: "升级：花晓之剑", slug: "升级：花晓之剑-prismatic", tier: "prismatic", description: "获得100%攻击速度。\n在你拥有花晓之剑时，你对英雄的攻击造成50%伤害，但使来自花晓之剑的治疗效果提升250%。", imageUrl: "/hextech/升级：花晓之剑.webp" },
      { name: "升级：荆棘之甲", slug: "升级：荆棘之甲-prismatic", tier: "silver", description: "获得50护甲。\n\n对你造成物理伤害的攻击者会受到10+10%你的额外护甲的魔法伤害反弹。", imageUrl: "/hextech/升级：荆棘之甲.webp" },
      { name: "升级：雪球", slug: "升级：雪球-prismatic", tier: "gold", description: "获得300额外生命值。\n\n主动—雪球：掷出一颗雪球，命中的敌人被标记。再次施放冲向被标记的敌人（40秒冷却时间）。", imageUrl: "/hextech/升级：雪球.webp" },
      { name: "潘朵拉的盒子", slug: "潘朵拉的盒子-prismatic", tier: "prismatic", description: "每回合开始时，随机获得一个棱彩阶海克斯的效果（持续本回合）。", imageUrl: "/hextech/潘朵拉的盒子.webp" },
      { name: "更万用的瞄准镜", slug: "更万用的瞄准镜-prismatic", tier: "gold", description: "获得125额外攻击距离和15攻击力。", imageUrl: "/hextech/更万用的瞄准镜.webp" },
      { name: "最万用的瞄准镜", slug: "最万用的瞄准镜-prismatic", tier: "prismatic", description: "获得175额外攻击距离和25攻击力。你的远程攻击对目标及目标身后锥形范围内的敌人造成40%攻击力的物理伤害。", imageUrl: "/hextech/最万用的瞄准镜.webp" },
      { name: "最终形态", slug: "最终形态-prismatic", tier: "prismatic", description: "获得50攻击力和50法术强度。你的所有属性增加20%。", imageUrl: "/hextech/最终形态.webp" },
      { name: "杀戮时间到了", slug: "杀戮时间到了-prismatic", tier: "gold", description: "获得30攻击力和30%暴击几率。击杀或助攻后，你的攻击速度增加50%，持续3秒。", imageUrl: "/hextech/杀戮时间到了.webp" },
      { name: "暴击飞弹", slug: "暴击飞弹-prismatic", tier: "gold", description: "获得30%暴击几率和30攻击力。你的暴击会发射一枚飞弹，对目标周围敌人造成50%攻击力的物理伤害。", imageUrl: "/hextech/暴击飞弹.webp" },
      { name: "属性叠属性叠属性！", slug: "属性叠属性叠属性！-prismatic", tier: "prismatic", description: "获得15攻击力、15法术强度、200生命值、15%攻击速度、15技能急速、8%全能吸血。你的所有属性增加5%。", imageUrl: "/hextech/属性叠属性叠属性！.webp" },
      { name: "质变：棱彩阶", slug: "质变：棱彩阶-prismatic", tier: "gold", description: "将你所有黄金阶海克斯升级为棱彩阶版本。", imageUrl: "/hextech/质变：棱彩阶.webp" },
      { name: "质变：混沌", slug: "质变：混沌-prismatic", tier: "prismatic", description: "将你所有白银阶海克斯升级为棱彩阶版本，黄金阶海克斯升级为混沌版本。", imageUrl: "/hextech/质变：混沌.webp" },
      { name: "质变：黄金阶", slug: "质变：黄金阶-prismatic", tier: "prismatic", description: "将你所有白银阶海克斯升级为黄金阶版本。", imageUrl: "/hextech/质变：黄金阶.webp" },
      { name: "？？？", slug: "？？？？-prismatic", tier: "prismatic", description: "？？？？？？？？？？？？？？？？？？？？", imageUrl: "/hextech/？？？.webp" },
      { name: "恶趣味", slug: "恶趣味-prismatic", tier: "silver", description: "获得30法术强度。你的技能命中敌方英雄时，有25%几率施加一个随机的减益效果（减速、灼烧、减攻速、减伤害）。", imageUrl: "/hextech/恶趣味.webp" },
      { name: "利刃华尔兹", slug: "利刃华尔兹-prismatic", tier: "prismatic", description: "获得40%攻击速度。你的普通攻击在命中时获得一层【舞步】，在4层时，你的下一次攻击对目标周围敌人造成80%攻击力的物理伤害并回复你50生命值。", imageUrl: "/hextech/利刃华尔兹.webp" },
      { name: "尊我为王", slug: "尊我为王-prismatic", tier: "prismatic", description: "获得40攻击力。击杀或助攻后，获得15攻击力（至多叠加10次），死亡后损失一半层数。", imageUrl: "/hextech/尊我为王.webp" },
      { name: "巨像的勇气", slug: "巨像的勇气-prismatic", tier: "prismatic", description: "获得600额外生命值。你的硬控技能会赋予你一个持续4秒的护盾，可吸收100-300（基于等级）伤害。", imageUrl: "/hextech/巨像的勇气.webp" },
      { name: "慢炖", slug: "慢炖-prismatic", tier: "prismatic", description: "获得50法术强度。你对同一敌人的持续伤害效果增加30%。", imageUrl: "/hextech/慢炖.webp" },
      { name: "扳机炼狱", slug: "扳机炼狱-prismatic", tier: "prismatic", description: "获得35%攻击速度和30%暴击几率。你的暴击会触发一次额外攻击，造成75%攻击力的物理伤害。", imageUrl: "/hextech/扳机炼狱.webp" },
      { name: "死亡之环", slug: "死亡之环-prismatic", tier: "prismatic", description: "获得50法术强度。你的范围技能的半径增加25%，且范围技能造成15%额外伤害。", imageUrl: "/hextech/死亡之环.webp" },
      { name: "残忍", slug: "残忍-prismatic", tier: "prismatic", description: "获得35攻击力。你对减速、定身或禁锢的敌人造成20%额外伤害。", imageUrl: "/hextech/残忍.webp" },
      { name: "玻璃大炮", slug: "玻璃大炮-prismatic", tier: "prismatic", description: "获得50攻击力和50法术强度。你受到的伤害增加15%，但你造成的伤害增加15%。", imageUrl: "/hextech/玻璃大炮.webp" },
      { name: "魔法转物理", slug: "魔法转物理-prismatic", tier: "silver", description: "获得40攻击力。你的法术强度25%转化为攻击力。", imageUrl: "/hextech/魔法转物理.webp" },
      { name: "歌利亚巨人", slug: "歌利亚巨人-prismatic", tier: "prismatic", description: "获得1000额外生命值。", imageUrl: "/hextech/歌利亚巨人.webp" },
      { name: "科学狂人", slug: "科学狂人-prismatic", tier: "prismatic", description: "获得40法术强度和25技能急速。你的技能有15%几率重置冷却时间。", imageUrl: "/hextech/科学狂人.webp" },
      { name: "双刀流", slug: "双刀流-prismatic", tier: "prismatic", description: "获得40%攻击速度。你的普通攻击会同时用副武器攻击，造成50%攻击力的物理伤害并施加攻击特效。", imageUrl: "/hextech/双刀流.webp" },
      { name: "终极刷新", slug: "终极刷新-prismatic", tier: "prismatic", description: "获得30技能急速。在你施放终极技能后的5秒内，你的非终极技能冷却速度提高100%。", imageUrl: "/hextech/终极刷新.webp" },
      { name: "终极唤醒", slug: "终极唤醒-prismatic", tier: "prismatic", description: "获得30技能急速。在你施放终极技能后的5秒内，你获得50攻击力和50法术强度。", imageUrl: "/hextech/终极唤醒.webp" },
      { name: "量子计算", slug: "量子计算-prismatic", tier: "prismatic", description: "获得40技能急速。你的技能急速超过50时，你的技能造成15%额外伤害。超过100时，额外增加10%。", imageUrl: "/hextech/量子计算.webp" },
      { name: "虚空裂隙", slug: "虚空裂隙-prismatic", tier: "prismatic", description: "用技能伤害敌人时，会留下持续6秒的虚空裂痕。若在附近产生另一个虚空裂痕，则会消耗两者并在其间开启一道虚空裂隙。\n\n虚空裂隙：对范围内的敌人造成100-450(基于等级)(+550%护甲穿透)(+550%固定法术穿透)魔法伤害，并施加99%减速，在1秒内衰减。", imageUrl: "/hextech/虚空裂隙.webp" },
      { name: "坚若磐石", slug: "坚若磐石-silver", tier: "silver", description: "每当你定身或缚地一个敌人时，获得持续10秒的2-10(基于等级)护甲或者魔抗。至多至10层。", imageUrl: "/hextech/坚若磐石.webp" },
      { name: "天音爆", slug: "天音爆-silver", tier: "silver", description: "在为你的友军提供增益效果、治疗效果或护盾效果时，会对其附近的敌人造成30-150(基于等级)真实伤害和持续2秒的30%减速。", imageUrl: "/hextech/天音爆.webp" },
      { name: "帽上加帽", slug: "帽上加帽-silver", tier: "silver", description: "头戴式装备和帽子提供15法术强度和8魔法抗性。帽子饮品提供8法术强度和4魔法抗性。", imageUrl: "/hextech/帽上加帽.webp" },
      { name: "闪闪现现", slug: "闪闪现现-silver", tier: "silver", description: "获得第二个【闪现】召唤师技能和70召唤师技能急速。", imageUrl: "/hextech/闪闪现现.webp" },
      { name: "双生火焰", slug: "双生火焰-silver", tier: "silver", description: "技能会发射1-4个飞弹(基于暴击率)，每个飞弹造成10-30(基于等级)(+7%额外攻击力+7%法术强度)魔法伤害，获得15%暴击几率。", imageUrl: "/hextech/双生火焰.webp" },
      { name: "残暴之力", slug: "残暴之力-silver", tier: "silver", description: "获得攻击力、技能急速和穿甲。", imageUrl: "/hextech/残暴之力.webp" },
      { name: "物理转魔法", slug: "物理转魔法-silver", tier: "silver", description: "将额外攻击力转化为法术强度，并获得15%法术强度。", imageUrl: "/hextech/物理转魔法.webp" },
      { name: "叠角龙", slug: "叠角龙-silver", tier: "silver", description: "在你获得一个技能的永久层数时，多获得75%！", imageUrl: null },
      { name: "轨道镭射", slug: "轨道镭射-prismatic", tier: "prismatic", description: "在2.5秒后，召唤一道轨道镭射光束落下，造成25%目标最大生命值的真实伤害并在3秒内持续造成共360-600(基于等级)的魔法伤害。每场游戏仅会有一位玩家拥有这个强化符文。", imageUrl: null },
      { name: "升级：弯刀", slug: "升级：弯刀-silver", tier: "silver", description: "【幽魂弯刀】和【求生索】的冷却时间降低。主动效果激活时，获得伤害增幅。", imageUrl: null },
    ]

    const insertHextech = db.prepare(
      'INSERT INTO hextech_items (name, slug, description, tier, image_url, lore, category) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )

    for (const item of hextechData) {
      insertHextech.run(item.name, item.slug, item.description, item.tier, item.imageUrl, null, null)
    }
  }

  console.log('Database initialized with seed data')
}

export default db
