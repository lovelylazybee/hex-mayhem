import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, RotateCcw, Star, Zap, Shield, Flame } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { runeApi, authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';

interface Rune {
  id: number;
  name: string;
  description: string;
  effect: string;
  rarity: string;
}

const rarityConfig: Record<string, { label: string; color: string; border: string; icon: any }> = {
  common: { label: '普通', color: 'text-gray-400', border: 'border-gray-500/50', icon: Star },
  rare: { label: '稀有', color: 'text-blue-400', border: 'border-blue-500/50', icon: Zap },
  epic: { label: '史诗', color: 'text-purple-400', border: 'border-purple-500/50', icon: Shield },
  legendary: { label: '传说', color: 'text-hex-gold', border: 'border-hex-gold/50', icon: Flame },
};

export default function HexCard() {
  const { user, isAuthenticated } = useAuthStore();
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentRune, setCurrentRune] = useState<Rune | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [history, setHistory] = useState<Rune[]>([]);
  const [teamId, setTeamId] = useState<number | null>(null);
  const [isCaptain, setIsCaptain] = useState(false);
  const [drawError, setDrawError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      authApi.me()
        .then((data: any) => {
          if (data?.team) {
            setTeamId(data.team.id);
            setIsCaptain(!!data.team.isCaptain);
          }
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const drawCard = async () => {
    if (!teamId) return;
    setIsDrawing(true);
    setIsRevealed(false);
    setCurrentRune(null);
    setDrawError('');

    try {
      const rune = await runeApi.draw(teamId);
      setTimeout(() => {
        setCurrentRune(rune);
        setIsDrawing(false);
        setIsRevealed(true);
        setHistory((prev) => [rune, ...prev].slice(0, 10));
      }, 1500);
    } catch (err: any) {
      setIsDrawing(false);
      setDrawError(err.message || '抽卡失败，请重试');
    }
  };

  const reset = () => {
    setCurrentRune(null);
    setIsRevealed(false);
    setIsDrawing(false);
    setDrawError('');
  };

  const canDraw = teamId !== null && isCaptain;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-purple mb-3">
          海克斯抽卡
        </h1>
        <p className="text-gray-400">抽取符文，为你的战队加持力量</p>
      </motion.div>

      <div className="flex flex-col items-center mb-12">
        <div className="w-64 h-80 flex items-center justify-center mb-8">
          <AnimatePresence mode="wait">
            {!currentRune && !isDrawing && (
              <motion.div
                key="chest"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="w-48 h-64 bg-hex-card border-2 border-hex-purple/30 rounded-xl flex items-center justify-center animate-glow-pulse"
              >
                <Sparkles size={64} className="text-hex-purple/50" />
              </motion.div>
            )}

            {isDrawing && (
              <motion.div
                key="drawing"
                initial={{ opacity: 0, rotateY: 0 }}
                animate={{ opacity: 1, rotateY: 360 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                className="w-48 h-64 bg-hex-card border-2 border-hex-gold/50 rounded-xl flex items-center justify-center"
              >
                <Sparkles size={64} className="text-hex-gold animate-pulse" />
              </motion.div>
            )}

            {isRevealed && currentRune && (
              <motion.div
                key="revealed"
                initial={{ rotateY: 90, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="w-48 h-64"
              >
                {(() => {
                  const config = rarityConfig[currentRune.rarity] || rarityConfig.common;
                  const Icon = config.icon;
                  return (
                    <div
                      className={`w-full h-full bg-hex-card border-2 ${config.border} rounded-xl p-4 flex flex-col items-center justify-center text-center`}
                    >
                      <Icon size={40} className={`${config.color} mb-3`} />
                      <h3 className={`font-bold text-lg ${config.color} mb-1`}>{currentRune.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${config.border} ${config.color} mb-2`}>
                        {config.label}
                      </span>
                      <p className="text-gray-400 text-xs mb-2">{currentRune.description}</p>
                      <p className="text-hex-cyan text-sm font-medium">{currentRune.effect}</p>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {drawError && (
          <div className="text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg mb-4">
            {drawError}
          </div>
        )}

        <div className="flex gap-4">
          {canDraw ? (
            <HexButton
              variant="gold"
              onClick={drawCard}
              disabled={isDrawing}
            >
              <span className="flex items-center gap-2">
                <Sparkles size={16} />
                {isDrawing ? '抽取中...' : '抽取符文'}
              </span>
            </HexButton>
          ) : (
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-2">
                {!isAuthenticated
                  ? '请先登录后再抽取符文'
                  : !teamId
                    ? '你还没有加入战队，无法抽取符文'
                    : '只有队长可以抽取符文'}
              </p>
            </div>
          )}
          {isRevealed && canDraw && (
            <HexButton variant="cyan" onClick={reset}>
              <span className="flex items-center gap-2">
                <RotateCcw size={16} />
                再抽一次
              </span>
            </HexButton>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <section>
          <h2 className="font-orbitron text-xl font-bold text-white mb-4">抽取记录</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {history.map((rune, i) => {
              const config = rarityConfig[rune.rarity] || rarityConfig.common;
              const Icon = config.icon;
              return (
                <motion.div
                  key={`${rune.id}-${i}`}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div
                    className={`bg-hex-card border ${config.border} rounded-lg p-3 text-center`}
                  >
                    <Icon size={20} className={`${config.color} mx-auto mb-1`} />
                    <p className={`text-sm font-medium ${config.color}`}>{rune.name}</p>
                    <p className="text-xs text-gray-500">{config.label}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
