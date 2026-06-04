import { Users, ClipboardList, Trophy, Calendar, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { useNavigate } from 'react-router-dom';

const stats = [
  { label: '总用户', value: '128', icon: Users, color: 'text-hex-cyan', bg: 'bg-hex-cyan/10' },
  { label: '报名数', value: '64', icon: ClipboardList, color: 'text-hex-purple', bg: 'bg-hex-purple/10' },
  { label: '队伍数', value: '12', icon: Trophy, color: 'text-hex-gold', bg: 'bg-hex-gold/10' },
  { label: '比赛数', value: '24', icon: Calendar, color: 'text-green-400', bg: 'bg-green-500/10' },
];

const recentActivity = [
  { action: '新用户注册', detail: '玩家XYZ 完成注册', time: '5分钟前' },
  { action: '报名提交', detail: '玩家ABC 提交了S7报名', time: '15分钟前' },
  { action: '比赛结果', detail: '暗影岛之怒 2:1 弗雷尔卓德', time: '1小时前' },
  { action: '报名审核', detail: '管理员审核通过了3个报名', time: '2小时前' },
  { action: '符文抽取', detail: '玩家DEF 抽取了传说符文', time: '3小时前' },
];

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="font-orbitron text-2xl font-bold text-white mb-2">仪表盘</h1>
        <p className="text-gray-400">S7 海克斯大乱斗战术探讨管理概览</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <GlowCard>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <Icon size={24} className={stat.color} />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="font-orbitron text-2xl font-bold text-white">{stat.value}</p>
                  </div>
                </div>
              </GlowCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GlowCard>
          <h2 className="flex items-center gap-2 font-orbitron text-lg font-bold text-hex-cyan mb-4">
            <TrendingUp size={18} />
            快捷操作
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <HexButton variant="primary" onClick={() => navigate('/admin/registrations')} className="text-sm">
              审核报名
            </HexButton>
            <HexButton variant="gold" onClick={() => navigate('/admin/teams')} className="text-sm">
              分队管理
            </HexButton>
            <HexButton variant="cyan" onClick={() => navigate('/admin/matches')} className="text-sm">
              赛程管理
            </HexButton>
            <HexButton variant="primary" onClick={() => navigate('/admin/runes')} className="text-sm">
              符文管理
            </HexButton>
          </div>
        </GlowCard>

        <GlowCard>
          <h2 className="flex items-center gap-2 font-orbitron text-lg font-bold text-hex-cyan mb-4">
            <Activity size={18} />
            最近动态
          </h2>
          <div className="space-y-3">
            {recentActivity.map((act, i) => (
              <div key={i} className="flex items-start justify-between py-2 border-b border-hex-border/50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-white">{act.action}</p>
                  <p className="text-xs text-gray-400">{act.detail}</p>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{act.time}</span>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>
    </div>
  );
}
