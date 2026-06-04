import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Gamepad2, Trophy, Edit3, Save, AlertTriangle } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import StatusBadge from '@/components/StatusBadge';
import { useAuthStore } from '@/store/auth';
import { registrationApi } from '@/lib/api';

export default function Profile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, fetchMe } = useAuthStore();
  const [registration, setRegistration] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchMe();
    registrationApi.getMine().then(setRegistration).catch(() => {});
  }, [isAuthenticated, navigate, fetchMe]);

  if (!isAuthenticated || !user) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-purple mb-3">
          个人中心
        </h1>
      </motion.div>

      <GlowCard className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-hex-gradient rounded-xl flex items-center justify-center">
            <User size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">{user.username}</h2>
            <p className="text-gray-400 text-sm">{user.email}</p>
            <span className="text-xs px-2 py-0.5 bg-hex-purple/20 text-hex-purple rounded-full mt-1 inline-block">
              {user.role === 'admin' ? '管理员' : '用户'}
            </span>
          </div>
        </div>
      </GlowCard>

      <GlowCard className="mb-6">
        <h3 className="flex items-center gap-2 font-orbitron text-lg font-bold text-hex-cyan mb-4">
          <Gamepad2 size={18} />
          报名状态
        </h3>
        {registration ? (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">游戏ID</span>
              <span className="text-white font-medium">{registration.gameId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">段位</span>
              <span className="text-white font-medium">{registration.rank}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">偏好位置</span>
              <span className="text-white font-medium">
                {registration.preferredPositions?.join('、') || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">审核状态</span>
              <StatusBadge status={registration.status || 'pending'} />
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500 mb-3">尚未报名本赛季</p>
            <HexButton onClick={() => navigate('/register')}>前往报名</HexButton>
          </div>
        )}
      </GlowCard>

      {registration?.team && (
        <GlowCard glowColor="gold">
          <h3 className="flex items-center gap-2 font-orbitron text-lg font-bold text-hex-gold mb-4">
            <Trophy size={18} />
            队伍信息
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">队伍名称</span>
              <span className="text-white font-medium">{registration.team.name}</span>
            </div>
            <div>
              <span className="text-gray-400 text-sm">队员</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {(registration.team.members || []).map((m: string) => (
                  <span
                    key={m}
                    className="px-3 py-1 bg-hex-purple/10 border border-hex-purple/30 rounded-full text-sm text-hex-purple"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </GlowCard>
      )}
    </div>
  );
}
