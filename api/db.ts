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
      {
        name: '海克斯科技脉冲', slug: 'hextech-pulse', tier: 'prismatic', category: '武器',
        description: '蕴含皮尔特沃夫最尖端科技的能量脉冲，能在瞬间释放毁灭性的海克斯能量波。',
        lore: '由杰斯亲自设计的海克斯脉冲核心，原本用于守护皮尔特沃夫的城市防线。当海克斯水晶与精密的机械结构完美融合，便诞生了这件足以改变战局的造物。传说中，只有最顶尖的海克斯工程师才能驾驭它的力量。',
        champions: [
          { name: '杰斯', title: '未来守护者' },
          { name: '维克托', title: '机械先驱' },
          { name: '艾克', title: '时间奇才' },
        ]
      },
      {
        name: '虚空裂隙核心', slug: 'void-rift-core', tier: 'prismatic', category: '核心',
        description: '从虚空深处提取的不稳定能量核心，散发着令人不安的紫黑色光芒。',
        lore: '虚空裂隙核心是在艾卡西亚废墟中被发现的远古遗物。它蕴含着跨越维度的虚空能量，能够撕裂现实的帷幕。马尔扎扎坚信这是虚空的意志具象化，而维克托则试图将其力量纳入海克斯科技的框架之中。',
        champions: [
          { name: '马尔扎哈', title: '虚空先知' },
          { name: '卡莎', title: '虚空之女' },
          { name: '凯隐', title: '影流之镰' },
          { name: '维克兹', title: '虚空之眼' },
        ]
      },
      {
        name: '星灵之冠', slug: 'celestial-crown', tier: 'prismatic', category: '饰品',
        description: '巨神峰星灵赐予的至高冠冕，佩戴者可获得星界力量的加持。',
        lore: '星灵之冠是巨神峰顶的星灵议会所铸造的神器，每一颗镶嵌的宝石都代表着一个星系的祝福。据说，当所有宝石同时闪耀时，佩戴者将获得短暂的全知全能之力。潘森曾以此冠在战场上所向披靡。',
        champions: [
          { name: '潘森', title: '不屈之枪' },
          { name: '蕾欧娜', title: '曙光女神' },
          { name: '黛安娜', title: '皎月女神' },
        ]
      },
      {
        name: '龙魂熔炉', slug: 'dragon-soul-forge', tier: 'prismatic', category: '核心',
        description: '以远古巨龙之魂为燃料的熔炉，可锻造出蕴含龙族之力的装备。',
        lore: '龙魂熔炉的起源已不可考，但铸龙族的后裔们世代守护着这个秘密。每当巨龙陨落，其灵魂便会被吸入熔炉之中，化为永不熄灭的龙焰。希瓦娜的龙血与熔炉产生了共鸣，使她成为了唯一能操控熔炉的人。',
        champions: [
          { name: '希瓦娜', title: '龙血武姬' },
          { name: '奥瑞利安·索尔', title: '铸星龙王' },
          { name: '斯莫德', title: '凛冬之焰' },
        ]
      },
      {
        name: '暗影岛魂匣', slug: 'shadow-isle-soulbox', tier: 'gold', category: '饰品',
        description: '封印着暗影岛亡灵的魂匣，能释放出腐蚀生者灵魂的黑雾。',
        lore: '暗影岛的诅咒并非一朝一夕形成。魂匣中封印着破败之咒最原始的碎片，每一缕黑雾都是一个未得安息的灵魂。莫德凯撒曾试图收集所有魂匣以重建他的暗影帝国，而赫卡里姆则渴望释放其中的力量来重塑自己的肉身。',
        champions: [
          { name: '莫德凯撒', title: '铁铠冥魂' },
          { name: '赫卡里姆', title: '战争之影' },
          { name: '卡莉丝塔', title: '复仇之矛' },
        ]
      },
      {
        name: '弗雷尔卓德冰晶', slug: 'freljord-crystal', tier: 'gold', category: '材料',
        description: '产自弗雷尔卓德永冻之地的冰晶，蕴含着凛冬的原始力量。',
        lore: '弗雷尔卓德的冰晶并非普通的冰块，而是远古冰霜守望者留下的力量结晶。丽桑卓用这些冰晶编织了她的暗冰魔法，而艾希则将其化为寒冰箭矢。每一块冰晶都承载着弗雷尔卓德三姐妹千年恩怨的回响。',
        champions: [
          { name: '艾希', title: '寒冰射手' },
          { name: '丽桑卓', title: '冰霜女巫' },
          { name: '瑟庄妮', title: '凛冬之怒' },
          { name: '丽桑卓', title: '冰霜女巫' },
        ]
      },
      {
        name: '诺克萨斯战刃', slug: 'noxus-warblade', tier: 'gold', category: '武器',
        description: '在诺克萨斯的血炉中锻造的战刃，饮血越多越锋利。',
        lore: '诺克萨斯的铁匠们信奉一个简单的真理——最好的武器是在战场上被鲜血淬炼过的。每一把战刃都经历了无数次战斗的洗礼，刀刃上残留的血迹不是瑕疵，而是荣誉的勋章。德莱厄斯的战刃据说已经斩断了上千个敌人的武器。',
        champions: [
          { name: '德莱厄斯', title: '诺克萨斯之手' },
          { name: '德莱文', title: '荣耀行刑官' },
          { name: '斯维因', title: '诺克萨斯统领' },
        ]
      },
      {
        name: '艾欧尼亚灵石', slug: 'ionia-spiritstone', tier: 'gold', category: '材料',
        description: '蕴含艾欧尼亚精神之力的灵石，能引导自然元素的力量。',
        lore: '艾欧尼亚的灵石是这片土地的意志结晶。每一块灵石都与艾欧尼亚的精神网络相连，能够感知到自然界的微妙变化。卡尔玛用灵石来引导精神之力，而李青则通过灵石来磨练自己的感知能力。',
        champions: [
          { name: '卡尔玛', title: '天启者' },
          { name: '李青', title: '盲僧' },
          { name: '亚索', title: '疾风剑豪' },
          { name: '辛德拉', title: '暗黑元首' },
        ]
      },
      {
        name: '比尔吉沃特朗姆酒', slug: 'bilgewater-rum', tier: 'silver', category: '消耗品',
        description: '比尔吉沃特酒馆中最烈的朗姆酒，据说能让人暂时忘却恐惧。',
        lore: '在比尔吉沃特的每一个码头酒馆里，都能找到这种琥珀色的烈酒。水手们相信，在出海前喝上一口，就能获得海神的庇佑。普朗克用朗姆酒来激励他的船员，而莎拉则更喜欢用它来庆祝又一场胜利。',
        champions: [
          { name: '普朗克', title: '海洋之灾' },
          { name: '莎拉', title: '赏金猎人' },
          { name: '菲兹', title: '潮汐海灵' },
        ]
      },
      {
        name: '祖安微光药剂', slug: 'zaun-shimmer-potion', tier: 'silver', category: '消耗品',
        description: '祖安炼金术士调配的微光药剂，能短暂增强身体机能但伴随副作用。',
        lore: '微光是祖安地下城最流行的增强药剂，它能让使用者在短时间内获得超乎常人的力量和速度。然而，微光的副作用同样可怕——长期使用会导致身体变异。辛吉德一直在研究如何消除副作用，而沃里克就是他实验的产物之一。',
        champions: [
          { name: '辛吉德', title: '炼金术士' },
          { name: '沃里克', title: '祖安怒兽' },
          { name: '维克托', title: '机械先驱' },
        ]
      },
      {
        name: '德玛西亚坚盾', slug: 'demacia-shield', tier: 'silver', category: '防具',
        description: '由德玛西亚禁魔石铸造的坚盾，能抵御魔法攻击。',
        lore: '德玛西亚的禁魔石是抵御魔法最有效的材料。每一面坚盾都由禁魔石与精钢合金铸造，能够吸收并分散魔法能量。盖伦的坚盾曾挡下过无数法师的攻击，而波比的盾牌更是传说中能承受巨龙一击的神器。',
        champions: [
          { name: '盖伦', title: '德玛西亚之力' },
          { name: '波比', title: '圣锤之毅' },
          { name: '拉克丝', title: '光辉女郎' },
        ]
      },
      {
        name: '恕瑞玛太阳盘', slug: 'shurima-sundisc', tier: 'silver', category: '饰品',
        description: '恕瑞玛沙漠中发掘的太阳盘碎片，仍残留着远古太阳祭司的力量。',
        lore: '太阳盘是恕瑞玛帝国的象征，也是飞升仪式的核心。当太阳圆盘完整时，它能够将凡人转化为半神般的飞升者。如今残存的碎片虽然力量大不如前，但仍然蕴含着令人敬畏的太阳之力。阿兹尔正是借助太阳盘的力量完成了飞升。',
        champions: [
          { name: '阿兹尔', title: '沙漠皇帝' },
          { name: '内瑟斯', title: '沙漠死神' },
          { name: '泽拉斯', title: '远古巫灵' },
        ]
      },
    ]

    const insertHextech = db.prepare(
      'INSERT INTO hextech_items (name, slug, description, tier, image_url, lore, category) VALUES (?, ?, ?, ?, ?, ?, ?)'
    )
    const insertChampion = db.prepare(
      'INSERT INTO hextech_champions (hextech_id, champion_name, champion_title, champion_image) VALUES (?, ?, ?, ?)'
    )

    for (const item of hextechData) {
      const result = insertHextech.run(
        item.name, item.slug, item.description, item.tier, null, item.lore, item.category
      )
      const hextechId = result.lastInsertRowid as number
      for (const champ of item.champions) {
        insertChampion.run(hextechId, champ.name, champ.title, null)
      }
    }
  }

  console.log('Database initialized with seed data')
}

export default db
