import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Crown, Star, Medal, Image } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import { hallOfFameApi } from '@/lib/api';

interface MemorableMoment {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
}

interface Sponsor {
  id: number;
  name: string;
  logoUrl?: string;
}

interface SeasonChampion {
  id: number;
  seasonNumber: number;
  championTeam: string;
  championMembers: string[];
  fmvp: string;
  memorableMoments?: MemorableMoment[];
  sponsors?: Sponsor[];
}

const fallbackChampions: SeasonChampion[] = [
  {
    id: 1, seasonNumber: 6, championTeam: '深渊领主',
    championMembers: ['深渊使者', '暗夜君王', '虚空行者', '冥界之主', '深渊猎手'],
    fmvp: '深渊使者',
    memorableMoments: [
      { id: 1, title: '深渊降临', description: '深渊领主在总决赛中3:0横扫对手，统治级表现' },
      { id: 2, title: '深渊使者的完美连招', description: 'FMVP深渊使者用阿卡丽完成1v3极限反杀' },
    ],
    sponsors: [{ id: 1, name: '微星 MSI' }, { id: 2, name: '斗鱼直播' }],
  },
  {
    id: 2, seasonNumber: 5, championTeam: '雷霆战神',
    championMembers: ['雷神', '闪电侠', '暴风之子', '电弧', '雷鸣'],
    fmvp: '雷神',
    memorableMoments: [
      { id: 3, title: '雷霆万钧', description: '雷霆战神在决赛中仅用18分钟推平对手基地' },
    ],
    sponsors: [{ id: 3, name: '华硕 ROG' }, { id: 4, name: '红牛 Red Bull' }],
  },
  {
    id: 3, seasonNumber: 4, championTeam: '星辰守卫',
    championMembers: ['星之子', '银河骑士', '流星', '星光使者', '宇宙行者'],
    fmvp: '星之子',
    memorableMoments: [
      { id: 4, title: '星辰陨落', description: '星辰守卫在半决赛中上演让二追三的奇迹' },
    ],
    sponsors: [{ id: 5, name: '海盗船 Corsair' }],
  },
  {
    id: 4, seasonNumber: 3, championTeam: '烈焰军团',
    championMembers: ['火焰领主', '熔岩巨人', '炎魔', '凤凰涅槃', '灼热之刃'],
    fmvp: '火焰领主',
    memorableMoments: [
      { id: 5, title: '火焰风暴', description: '烈焰军团连续三局使用全AP阵容碾压对手' },
    ],
    sponsors: [{ id: 6, name: '赛睿 SteelSeries' }],
  },
  {
    id: 5, seasonNumber: 2, championTeam: '冰霜之翼',
    championMembers: ['寒冰射手', '冰晶凤凰', '霜之守护', '极地战熊', '凛冬之怒'],
    fmvp: '寒冰射手',
    memorableMoments: [
      { id: 6, title: '冰封千里', description: '冰霜之翼全员选择冰系英雄，冰封对手于水晶前' },
    ],
    sponsors: [{ id: 7, name: '罗技 Logitech' }],
  },
  {
    id: 6, seasonNumber: 1, championTeam: '暗影猎手',
    championMembers: ['夜行者', '影刃', '暗夜精灵', '幽冥刺客', '月影'],
    fmvp: '夜行者',
    memorableMoments: [
      { id: 7, title: '绝境翻盘', description: '决赛第3局，暗影猎手在落后15个人头的情况下完成惊天翻盘' },
    ],
    sponsors: [{ id: 8, name: '雷蛇 Razer' }],
  },
];

export default function HallOfFame() {
  const [champions, setChampions] = useState<SeasonChampion[]>(fallbackChampions);
  const [activeSeason, setActiveSeason] = useState<number | null>(null);

  useEffect(() => {
    hallOfFameApi.getAll()
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped = data.map((item: any) => ({
            id: item.id,
            seasonNumber: item.seasonNumber,
            championTeam: item.championTeam,
            championMembers: Array.isArray(item.championMembers)
              ? item.championMembers
              : JSON.parse(item.championMembers || '[]'),
            fmvp: item.fmvp,
            memorableMoments: item.memorableMoments || [],
            sponsors: item.sponsors || [],
          }));
          setChampions(mapped);
          const maxSeason = Math.max(...mapped.map((c: SeasonChampion) => c.seasonNumber));
          setActiveSeason(maxSeason);
        } else {
          const maxSeason = Math.max(...fallbackChampions.map((c) => c.seasonNumber));
          setActiveSeason(maxSeason);
        }
      })
      .catch(() => {
        const maxSeason = Math.max(...fallbackChampions.map((c) => c.seasonNumber));
        setActiveSeason(maxSeason);
      });
  }, []);

  const seasons = champions.map((c) => c.seasonNumber).sort((a, b) => b - a);
  const champion = champions.find((c) => c.seasonNumber === activeSeason) || champions[0];

  if (activeSeason === null || !champion) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-gold mb-3">
          荣誉殿堂
        </h1>
        <p className="text-gray-400">铭记每一位冠军的荣耀时刻</p>
      </motion.div>

      <div className="flex justify-center gap-2 mb-10 flex-wrap">
        {seasons.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSeason(s)}
            className={`px-4 py-2 rounded-lg text-sm font-bold font-orbitron transition-all ${
              activeSeason === s
                ? 'bg-hex-gold/20 text-hex-gold border border-hex-gold/50 glow-text-gold'
                : 'bg-hex-card border border-hex-border text-gray-400 hover:text-white hover:border-hex-purple/50'
            }`}
          >
            S{s}
          </button>
        ))}
      </div>

      <motion.div
        key={activeSeason}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <GlowCard glowColor="gold" className="mb-8">
          <div className="text-center py-4">
            <Crown size={48} className="text-hex-gold mx-auto mb-4" />
            <h2 className="font-orbitron text-3xl font-bold text-hex-gold glow-text-gold mb-2">
              S{champion.seasonNumber} 冠军
            </h2>
            <h3 className="text-2xl font-bold text-white mb-4">{champion.championTeam}</h3>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {champion.championMembers.map((m) => (
                <span
                  key={m}
                  className="px-3 py-1 bg-hex-gold/10 border border-hex-gold/30 rounded-full text-sm text-hex-gold"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </GlowCard>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlowCard glowColor="cyan">
            <div className="text-center py-4">
              <Star size={32} className="text-hex-cyan mx-auto mb-3" />
              <h3 className="font-orbitron text-lg font-bold text-hex-cyan mb-2">FMVP</h3>
              <p className="text-2xl font-bold text-white">{champion.fmvp}</p>
              <p className="text-gray-400 text-sm mt-1">总决赛最有价值选手</p>
            </div>
          </GlowCard>

          <GlowCard glowColor="purple">
            <div className="text-center py-4">
              <Medal size={32} className="text-hex-purple mx-auto mb-3" />
              <h3 className="font-orbitron text-lg font-bold text-hex-purple mb-2">经典时刻</h3>
              {champion.memorableMoments && champion.memorableMoments.length > 0 ? (
                <div className="space-y-2">
                  {champion.memorableMoments.map((moment) => (
                    <div key={moment.id}>
                      <p className="text-lg font-medium text-white">{moment.title}</p>
                      <p className="text-gray-400 text-sm">{moment.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-lg font-medium text-white">暂无记录</p>
              )}
            </div>
          </GlowCard>
        </div>

        {champion.sponsors && champion.sponsors.length > 0 && (
          <div className="mt-8">
            <h3 className="font-orbitron text-lg font-bold text-white mb-4">赞助商</h3>
            <div className="flex flex-wrap gap-3">
              {champion.sponsors.map((sponsor) => (
                <span
                  key={sponsor.id}
                  className="px-4 py-2 bg-hex-card border border-hex-border rounded-lg text-gray-300 text-sm"
                >
                  {sponsor.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-orbitron text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Image size={18} className="text-hex-cyan" />
            精彩瞬间
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(champion.memorableMoments && champion.memorableMoments.length > 0
              ? champion.memorableMoments
              : [1, 2, 3, 4, 5, 6]
            ).map((item, i) => (
              <div
                key={typeof item === 'number' ? item : item.id}
                className="aspect-video bg-hex-card border border-hex-border rounded-lg flex items-center justify-center text-gray-600 hover:border-hex-purple/50 transition-colors"
              >
                {typeof item === 'object' ? (
                  <div className="text-center px-2">
                    <p className="text-white text-sm font-medium truncate">{item.title}</p>
                  </div>
                ) : (
                  <Image size={24} />
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
