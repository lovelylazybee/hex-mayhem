import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Diamond, ShieldCheck, Coins, BookOpen, Users } from 'lucide-react';
import { hextechApi } from '@/lib/api';
import GlowCard from '@/components/GlowCard';

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

const tierConfig: Record<string, { label: string; color: string; border: string; bg: string; icon: any; glowColor: string }> = {
  prismatic: {
    label: '棱彩阶',
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'bg-pink-500/10',
    icon: Diamond,
    glowColor: 'purple',
  },
  gold: {
    label: '黄金阶',
    color: 'text-hex-gold',
    border: 'border-hex-gold/40',
    bg: 'bg-hex-gold/10',
    icon: ShieldCheck,
    glowColor: 'gold',
  },
  silver: {
    label: '白银阶',
    color: 'text-blue-300',
    border: 'border-blue-400/40',
    bg: 'bg-blue-400/10',
    icon: Coins,
    glowColor: 'cyan',
  },
};

export default function HextechDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [item, setItem] = useState<HextechItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    hextechApi.getBySlug(slug)
      .then((data: any) => {
        setItem(data);
      })
      .catch((err) => {
        if (err.message?.includes('不存在')) {
          setNotFound(true);
        }
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin w-8 h-8 border-2 border-hex-purple border-t-transparent rounded-full" />
      </div>
    );
  }

  if (notFound || !item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Diamond size={48} className="text-gray-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-gray-400 mb-2">海克斯物品不存在</h2>
        <Link to="/hextech" className="text-hex-cyan hover:underline text-sm">
          返回海克斯总览
        </Link>
      </div>
    );
  }

  const config = tierConfig[item.tier] || tierConfig.silver;
  const Icon = config.icon;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* 返回按钮 */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="mb-6"
      >
        <Link
          to="/hextech"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          返回海克斯总览
        </Link>
      </motion.div>

      {/* 主信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <GlowCard glowColor={config.glowColor} className="mb-8">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className={`w-16 h-16 rounded-xl ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
              <Icon size={32} className={config.color} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <h1 className={`font-orbitron text-2xl font-bold ${config.color}`}>
                  {item.name}
                </h1>
                <span className={`text-xs px-2.5 py-1 rounded-full border ${config.border} ${config.color} font-bold`}>
                  {config.label}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-hex-dark/50 border border-hex-border text-gray-400">
                  {item.category}
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">{item.description}</p>
            </div>
          </div>
        </GlowCard>
      </motion.div>

      {/* 背景故事 */}
      {item.lore && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <GlowCard glowColor="purple">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen size={18} className="text-hex-purple" />
              <h2 className="font-orbitron text-lg font-bold text-white">背景故事</h2>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{item.lore}</p>
          </GlowCard>
        </motion.div>
      )}

      {/* 关联英雄 */}
      {item.champions && item.champions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-5">
            <Users size={18} className="text-hex-cyan" />
            <h2 className="font-orbitron text-lg font-bold text-white">关联英雄</h2>
            <span className="text-xs text-gray-500">({item.champions.length})</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {item.champions.map((champ, i) => (
              <motion.div
                key={champ.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25 + i * 0.05 }}
              >
                <div className="bg-hex-card/80 backdrop-blur-sm border border-hex-border rounded-xl p-4 hover:border-hex-purple/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,77,255,0.2)]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-hex-gradient flex items-center justify-center flex-shrink-0">
                      <span className="font-orbitron text-lg font-bold text-white">
                        {champ.championName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{champ.championName}</h3>
                      <p className="text-sm text-gray-400">{champ.championTitle}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
