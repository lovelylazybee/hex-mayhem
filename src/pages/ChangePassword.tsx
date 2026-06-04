import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { KeyRound, Lock, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { useAuthStore } from '@/store/auth';

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: '弱', color: 'bg-red-500' };
  if (score <= 4) return { score, label: '中', color: 'bg-yellow-500' };
  return { score, label: '强', color: 'bg-green-500' };
}

export default function ChangePassword() {
  const navigate = useNavigate();
  const { changePassword, mustChangePassword } = useAuthStore();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const requirements = [
    { label: '至少8位', met: newPassword.length >= 8 },
    { label: '包含大写字母', met: /[A-Z]/.test(newPassword) },
    { label: '包含小写字母', met: /[a-z]/.test(newPassword) },
    { label: '包含数字', met: /[0-9]/.test(newPassword) },
  ];

  const allMet = requirements.every(r => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!allMet) {
      setError('密码不满足强度要求');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (oldPassword === newPassword) {
      setError('新密码不能与旧密码相同');
      return;
    }

    setLoading(true);
    try {
      await changePassword(oldPassword, newPassword);
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-hex-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <KeyRound size={28} className="text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-gradient-purple">修改密码</h1>
          {mustChangePassword ? (
            <p className="text-amber-400 mt-2 text-sm">⚠️ 首次登录需修改默认密码</p>
          ) : (
            <p className="text-gray-400 mt-2">请设置一个安全的新密码</p>
          )}
        </div>

        <GlowCard>
          {success ? (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle size={48} className="text-green-400" />
              <p className="text-green-400 text-lg font-medium">密码修改成功</p>
              <p className="text-gray-400 text-sm">正在跳转到首页...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock size={14} className="inline mr-1" />
                  旧密码
                </label>
                <div className="relative">
                  <input
                    type={showOld ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    className="hex-input-glow pr-10"
                    placeholder="请输入旧密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowOld(!showOld)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock size={14} className="inline mr-1" />
                  新密码
                </label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="hex-input-glow pr-10"
                    placeholder="至少8位，含大小写字母和数字"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${strength.color} transition-all duration-300`}
                          style={{ width: `${(strength.score / 6) * 100}%` }}
                        />
                      </div>
                      <span className={`text-xs ${strength.color.replace('bg-', 'text-')}`}>
                        {strength.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      {requirements.map((req) => (
                        <div
                          key={req.label}
                          className={`text-xs flex items-center gap-1 ${
                            req.met ? 'text-green-400' : 'text-gray-500'
                          }`}
                        >
                          {req.met ? <CheckCircle size={10} /> : <span className="w-2.5 h-2.5 rounded-full border border-gray-600 inline-block" />}
                          {req.label}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Lock size={14} className="inline mr-1" />
                  确认新密码
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="hex-input-glow"
                  placeholder="请再次输入新密码"
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">两次输入的密码不一致</p>
                )}
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
                  <AlertTriangle size={14} />
                  {error}
                </div>
              )}

              <HexButton type="submit" variant="primary" disabled={loading || !allMet} className="w-full">
                {loading ? '提交中...' : '确认修改'}
              </HexButton>
            </form>
          )}
        </GlowCard>
      </motion.div>
    </div>
  );
}
