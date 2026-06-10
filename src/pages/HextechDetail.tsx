import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Diamond, ShieldCheck, Coins } from 'lucide-react';
import { hextechApi } from '@/lib/api';

interface HextechItem {
  id: number;
  name: string;
  slug: string;
  description: string;
  tier: string;
  imageUrl: string | null;
  lore: string | null;
  category: string | null;
}

const tierConfig: Record<string, { label: string; color: string; border: string; bg: string; icon: any; glowColor: string; gradient: string }> = {
  prismatic: {
    label: '棱彩阶',
    color: 'text-pink-400',
    border: 'border-pink-500/40',
    bg: 'bg-pink-500/10',
    icon: Diamond,
    glowColor: 'purple',
    gradient: 'from-pink-500/20 to-purple-500/20',
  },
  gold: {
    label: '黄金阶',
    color: 'text-hex-gold',
    border: 'border-hex-gold/40',
    bg: 'bg-hex-gold/10',
    icon: ShieldCheck,
    glowColor: 'gold',
    gradient: 'from-hex-gold/20 to-yellow-600/20',
  },
  silver: {
    label: '白银阶',
    color: 'text-blue-300',
    border: 'border-blue-400/40',
    bg: 'bg-blue-400/10',
    icon: Coins,
    glowColor: 'cyan',
    gradient: 'from-blue-400/20 to-cyan-500/20',
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
    hextechApi.getBySlug(decodeURIComponent(slug))
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
        className="bg-hex-card/80 backdrop-blur-sm border border-hex-border rounded-xl overflow-hidden mb-8"
      >
        <div className="flex flex-col md:flex-row">
          {/* 图片区域 */}
          <div className={`md:w-64 flex-shrink-0 bg-gradient-to-br ${config.gradient} flex items-center justify-center p-6`}>
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.name}
                className="w-full max-w-[200px] h-auto object-contain"
              />
            ) : (
              <Icon size={80} className={`${config.color} opacity-30`} />
            )}
          </div>

          {/* 信息区域 */}
          <div className="flex-1 p-6">
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <h1 className={`font-orbitron text-2xl font-bold ${config.color}`}>
                {item.name}
              </h1>
              <span className={`text-xs px-2.5 py-1 rounded-full border ${config.border} ${config.color} font-bold`}>
                {config.label}
              </span>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center`}>
                <Icon size={16} className={config.color} />
              </div>
              <span className={`text-sm font-medium ${config.color}`}>{config.label}海克斯</span>
            </div>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">{item.description}</p>
          </div>
        </div>
      </motion.div>

      {/* 阶位说明 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-hex-card/80 backdrop-blur-sm border border-hex-border rounded-xl p-6"
      >
        <h2 className="font-orbitron text-lg font-bold text-white mb-3">阶位说明</h2>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0`}>
            <Icon size={20} className={config.color} />
          </div>
          <div>
            <p className={`font-bold ${config.color}`}>{config.label}</p>
            <p className="text-gray-400 text-sm">
              {item.tier === 'prismatic' && '棱彩阶是最高品阶的海克斯，拥有最强大的效果和改变战局的能力。'}
              {item.tier === 'gold' && '黄金阶海克斯拥有强力的增益效果，能显著提升作战能力。'}
              {item.tier === 'silver' && '白银阶海克斯提供基础属性加成，是构建战术的基石。'}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
