import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Gamepad2, CheckCircle, AlertTriangle } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { useAuthStore } from '@/store/auth';
import { registrationApi } from '@/lib/api';

const positions = [
  { key: 'mage', label: '法师' },
  { key: 'adc', label: 'ADC' },
  { key: 'support', label: '软辅' },
  { key: 'tank', label: '坦克' },
  { key: 'assassin', label: '刺客' },
  { key: 'fighter', label: '战士' },
];

export default function Register() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [followConfirmed, setFollowConfirmed] = useState(false);
  const [form, setForm] = useState({
    gameId: '',
    preferredPositions: [] as string[],
    willingCaptain: false,
    contactInfo: '',
    declaration: '',
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <GlowCard>
          <AlertTriangle size={48} className="text-hex-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">请先登录</h2>
          <p className="text-gray-400 mb-4">报名需要登录后才能进行</p>
          <HexButton onClick={() => navigate('/login')}>前往登录</HexButton>
        </GlowCard>
      </div>
    );
  }

  const togglePosition = (key: string) => {
    setForm((prev) => ({
      ...prev,
      preferredPositions: prev.preferredPositions.includes(key)
        ? prev.preferredPositions.filter((p) => p !== key)
        : [...prev.preferredPositions, key],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!followConfirmed) {
      setError('请确认已关注公众号"海克斯大乱斗"');
      return;
    }

    setLoading(true);
    try {
      await registrationApi.register({
        ...form,
        willingCaptain: form.willingCaptain,
        rank: '未填写',
        verificationCode: 'SKIP',
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || '报名失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <GlowCard glowColor="cyan">
          <CheckCircle size={48} className="text-hex-cyan mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">报名成功！</h2>
          <p className="text-gray-400 mb-4">请等待管理员审核，审核结果将通过站内消息通知</p>
          <HexButton variant="cyan" onClick={() => navigate('/')}>返回首页</HexButton>
        </GlowCard>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-purple mb-3">
          S7 报名
        </h1>
        <p className="text-gray-400">填写信息，加入海克斯大乱斗战术探讨</p>
      </motion.div>

      <GlowCard>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              <Gamepad2 size={14} className="inline mr-1" />
              游戏ID *
            </label>
            <input
              type="text"
              value={form.gameId}
              onChange={(e) => setForm({ ...form, gameId: e.target.value })}
              className="hex-input-glow"
              placeholder="请输入你的英雄联盟游戏ID"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">偏好位置 *</label>
            <div className="flex flex-wrap gap-2">
              {positions.map((pos) => (
                <button
                  key={pos.key}
                  type="button"
                  onClick={() => togglePosition(pos.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.preferredPositions.includes(pos.key)
                      ? 'bg-hex-purple/20 border-hex-purple text-hex-purple'
                      : 'bg-hex-dark/50 border-hex-border text-gray-400 hover:border-hex-purple/50'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-hex-dark/50 border border-hex-border rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={form.willingCaptain}
                onChange={(e) => setForm({ ...form, willingCaptain: e.target.checked })}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-hex-dark text-hex-gold focus:ring-hex-gold accent-[#ffd700]"
              />
              <div>
                <span className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                  我愿意担任队长
                </span>
                <div className="mt-1.5 space-y-1 text-xs text-gray-500 leading-relaxed">
                  <p>队长需要有<strong className="text-hex-gold">责任心</strong>，具备一定的<strong className="text-hex-gold">沟通和协调能力</strong>，能够组织队友、安排战术。</p>
                  <p>队长可以<strong className="text-hex-cyan">选人组建队伍</strong>，带领团队征战赛场。</p>
                  <p>赛后<strong className="text-hex-gold">优秀队长</strong>将获得专属奖励！</p>
                </div>
              </div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">微信号/微信昵称 *</label>
            <input
              type="text"
              value={form.contactInfo}
              onChange={(e) => setForm({ ...form, contactInfo: e.target.value })}
              className="hex-input-glow"
              placeholder="请输入微信号或微信昵称，方便赛事联系"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">参赛宣言</label>
            <textarea
              value={form.declaration}
              onChange={(e) => setForm({ ...form, declaration: e.target.value })}
              className="hex-input-glow min-h-[80px] resize-y"
              placeholder="写下你的参赛宣言，让大家看到你的态度！"
              maxLength={200}
            />
            <p className="text-xs text-gray-500 mt-1 text-right">{form.declaration.length}/200</p>
          </div>

          <div className="bg-hex-dark/50 border border-hex-border rounded-xl p-4 space-y-4">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-300 mb-3">关注公众号"海克斯大乱斗"</p>
              <div className="w-32 h-32 mx-auto bg-hex-card border border-hex-border rounded-lg flex items-center justify-center mb-2">
                <div className="text-center">
                  <svg className="w-10 h-10 mx-auto text-green-400 mb-1" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zM14.033 13.3c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
                  </svg>
                  <p className="text-xs text-gray-500">公众号二维码</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">扫码关注获取最新赛事资讯</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={followConfirmed}
                onChange={(e) => setFollowConfirmed(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-hex-dark text-hex-purple focus:ring-hex-purple accent-[#7c3aed]"
              />
              <span className="text-sm text-gray-300 leading-relaxed group-hover:text-white transition-colors">
                我已关注公众号<strong className="text-hex-cyan">"海克斯大乱斗"</strong>，确认未关注将取消参赛资格 *
              </span>
            </label>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
              <AlertTriangle size={14} />
              {error}
            </div>
          )}

          <div className="bg-hex-dark/50 border border-hex-border rounded-lg p-3">
            <p className="text-xs text-gray-400 leading-relaxed">
              报名即表示您同意遵守赛事规则，并确认所填信息真实有效。根据《中华人民共和国网络安全法》，用户须提供真实身份信息。
            </p>
          </div>

          <HexButton type="submit" variant="primary" disabled={loading || !followConfirmed} className="w-full">
            <span className="flex items-center justify-center gap-2">
              <Send size={16} />
              {loading ? '提交中...' : '提交报名'}
            </span>
          </HexButton>
        </form>
      </GlowCard>
    </div>
  );
}
