import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Diamond, ShieldCheck, Coins, Sparkles } from 'lucide-react';
import { hextechApi } from '@/lib/api';

interface HextechChampion {
  id: number;
  hextechId: number;
  championName: string;
  championTitle: string;
  championImage: string | null;
}

interface HextechItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  tier: string;
  imageUrl: string | null;
  lore: string;
  category: string;
  champions: HextechChampion[];
}

const tierConfig: Record<string, { label: string; color: string; border: string; bg: string; icon: any; glow: string }> = {
  prismatic: {
    label: '棱彩阶',
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'bg-pink-500/10',
    icon: Diamond,
    glow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.4)]',
  },
  gold: {
    label: '黄金阶',
    color: 'text-hex-gold',
    border: 'border-hex-gold/40',
    bg: 'bg-hex-gold/10',
    icon: ShieldCheck,
    glow: 'hover:shadow-[0_0_30px_rgba(255,215,0,0.4)]',
  },
  silver: {
    label: '白银阶',
    color: 'text-blue-300',
    border: 'border-blue-400/40',
    bg: 'bg-blue-400/10',
    icon: Coins,
    glow: 'hover:shadow-[0_0_30px_rgba(96,165,250,0.4)]',
  },
};

const tierOrder = ['all', 'prismatic', 'gold', 'silver'];

export default function HextechOverview() {
  const [items, setItems] = useState<HextechItem[]>([]);
  const [activeTier, setActiveTier] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hextechApi.getAll()
      .then((data: any[]) => {
        setItems(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = useMemo(() => {
    let result = items;
    if (activeTier !== 'all') {
      result = result.filter((item) => item.tier === activeTier);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.champions.some((c) => c.championName.toLowerCase().includes(q))
      );
    }
    return result;
  }, [items, activeTier, searchQuery]);

  const tierCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const item of items) {
      counts[item.tier] = (counts[item.tier] || 0) + 1;
    }
    return counts;
  }, [items]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-purple mb-3">
          海克斯总览
        </h1>
        <p className="text-gray-400">探索符文之地的海克斯造物与传奇神器</p>
      </motion.div>

      {/* 搜索栏 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <div className="relative max-w-md mx-auto">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索海克斯物品、分类或关联英雄..."
            className="hex-input-glow pl-11 pr-4"
          />
        </div>
      </motion.div>

      {/* 阶位筛选 */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex justify-center gap-2 mb-10 flex-wrap"
      >
        {tierOrder.map((tier) => {
          const config = tier !== 'all' ? tierConfig[tier] : null;
          const isActive = activeTier === tier;
          return (
            <button
              key={tier}
              onClick={() => setActiveTier(tier)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold font-orbitron transition-all ${
                isActive
                  ? tier === 'all'
                    ? 'bg-hex-purple/20 text-hex-cyan border border-hex-purple/50 glow-text-cyan'
                    : `${config!.bg} ${config!.color} border ${config!.border}`
                  : 'bg-hex-card border border-hex-border text-gray-400 hover:text-white hover:border-hex-purple/50'
              }`}
            >
              {tier === 'all' ? (
                <Sparkles size={14} />
              ) : (
                (() => {
                  const Icon = config!.icon;
                  return <Icon size={14} />;
                })()
              )}
              {tier === 'all' ? '全部' : config!.label}
              <span className="text-xs opacity-70">({tierCounts[tier] || 0})</span>
            </button>
          );
        })}
      </motion.div>

      {/* 物品列表 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-2 border-hex-purple border-t-transparent rounded-full" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-20">
          <Sparkles size={48} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500">未找到匹配的海克斯物品</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item, i) => {
            const config = tierConfig[item.tier] || tierConfig.silver;
            const Icon = config.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/hextech/${item.slug}`} className="block">
                  <div
                    className={`bg-hex-card/80 backdrop-blur-sm border ${config.border} rounded-xl p-5 transition-all duration-300 ${config.glow} hover:scale-[1.02] h-full flex flex-col`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={20} className={config.color} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`font-bold text-lg ${config.color} truncate`}>{item.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${config.border} ${config.color}`}>
                            {config.label}
                          </span>
                          <span className="text-xs text-gray-500">{item.category}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed flex-1 line-clamp-3 mb-3">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1 flex-wrap">
                      {item.champions.slice(0, 3).map((champ) => (
                        <span
                          key={champ.id}
                          className="text-xs px-2 py-0.5 bg-hex-dark/50 border border-hex-border rounded-full text-gray-400"
                        >
                          {champ.championName}
                        </span>
                      ))}
                      {item.champions.length > 3 && (
                        <span className="text-xs text-gray-500">+{item.champions.length - 3}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
