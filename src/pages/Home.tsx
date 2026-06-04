import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swords, Scroll, Trophy, Calendar, Sparkles, ChevronRight } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import CountdownTimer from '@/components/CountdownTimer';
import StatusBadge from '@/components/StatusBadge';
import { useSeasonStore } from '@/store/season';

const quickNav = [
  { path: '/register', label: '立即报名', icon: Swords, bgColor: 'bg-hex-purple/10', textColor: 'text-hex-purple', desc: '加入S7赛季' },
  { path: '/schedule', label: '赛程积分', icon: Calendar, bgColor: 'bg-hex-cyan/10', textColor: 'text-hex-cyan', desc: '查看对阵与排名' },
  { path: '/hall-of-fame', label: '荣誉殿堂', icon: Trophy, bgColor: 'bg-hex-gold/10', textColor: 'text-hex-gold', desc: '历届冠军回顾' },
  { path: '/rules', label: '赛制公告', icon: Scroll, bgColor: 'bg-hex-purple/10', textColor: 'text-hex-purple', desc: '了解比赛规则' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function Home() {
  const { currentSeason, fetchCurrentSeason } = useSeasonStore();

  useEffect(() => {
    fetchCurrentSeason();
  }, [fetchCurrentSeason]);

  return (
    <div className="relative">
      <section className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-orbitron text-5xl md:text-7xl font-black text-gradient-purple mb-4">
            海克斯大乱斗战术探讨
          </h1>
          <p className="font-orbitron text-xl md:text-2xl text-hex-gold glow-text-gold mb-2">
            SEASON 7
          </p>
          <p className="text-gray-400 text-lg mb-8 font-noto-sans">
            大乱斗模式 · 全新赛制 · 荣耀再临
          </p>
        </motion.div>

        {currentSeason && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <StatusBadge status={currentSeason.status} />
            <p className="text-gray-400 text-sm">
              报名截止倒计时
            </p>
            <CountdownTimer targetDate={currentSeason.registrationDeadline} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8"
        >
          <Link to="/register">
            <HexButton variant="primary" className="text-lg px-8 py-3">
              <span className="flex items-center gap-2">
                <Sparkles size={20} />
                立即报名 S7
              </span>
            </HexButton>
          </Link>
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {quickNav.map((nav) => {
            const Icon = nav.icon;
            return (
              <motion.div key={nav.path} variants={item}>
                <Link to={nav.path}>
                  <GlowCard className="cursor-pointer h-full">
                    <div className="flex flex-col items-center text-center gap-3">
                      <div className={`p-3 rounded-xl ${nav.bgColor}`}>
                        <Icon size={28} className={nav.textColor} />
                      </div>
                      <h3 className="font-bold text-white text-lg">{nav.label}</h3>
                      <p className="text-gray-400 text-sm">{nav.desc}</p>
                      <ChevronRight size={16} className="text-gray-500" />
                    </div>
                  </GlowCard>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      <section className="max-w-7xl mx-auto px-4 pb-16">
        <h2 className="font-orbitron text-2xl font-bold text-white mb-6 glow-text-purple">
          最新公告
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { title: 'S7赛季报名开启', date: '2026-05-20', tag: '报名' },
            { title: 'S7赛制更新说明', date: '2026-05-18', tag: '公告' },
            { title: '海克斯抽卡系统上线', date: '2026-05-15', tag: '活动' },
          ].map((notice) => (
            <GlowCard key={notice.title} className="cursor-pointer">
              <div className="flex items-start justify-between">
                <div>
                  <span className="inline-block px-2 py-0.5 text-xs bg-hex-purple/20 text-hex-purple rounded mb-2">
                    {notice.tag}
                  </span>
                  <h3 className="text-white font-medium">{notice.title}</h3>
                </div>
                <span className="text-xs text-gray-500">{notice.date}</span>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>
    </div>
  );
}
