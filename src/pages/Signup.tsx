import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserPlus, User, Lock, Mail, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { useAuthStore } from '@/store/auth';

const WechatIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zM14.033 13.3c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982z"/>
  </svg>
);

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

export default function Signup() {
  const navigate = useNavigate();
  const { register } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => getPasswordStrength(password), [password]);

  const requirements = [
    { label: '至少8位', met: password.length >= 8 },
    { label: '包含大写字母', met: /[A-Z]/.test(password) },
    { label: '包含小写字母', met: /[a-z]/.test(password) },
    { label: '包含数字', met: /[0-9]/.test(password) },
  ];

  const allMet = requirements.every(r => r.met);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username.length < 3 || username.length > 20) {
      setError('用户名长度需在3-20位之间');
      return;
    }

    if (!allMet) {
      setError('密码不满足强度要求');
      return;
    }

    setLoading(true);
    try {
      await register(username, password, email);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '注册失败');
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
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-gradient-purple">注册</h1>
          <p className="text-gray-400 mt-2">加入海克斯大乱斗战术探讨</p>
        </div>

        <GlowCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User size={14} className="inline mr-1" />
                用户名
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="hex-input-glow"
                placeholder="3-20位字符"
                required
                minLength={3}
                maxLength={20}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Mail size={14} className="inline mr-1" />
                邮箱
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hex-input-glow"
                placeholder="请输入邮箱"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Lock size={14} className="inline mr-1" />
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="hex-input-glow pr-10"
                  placeholder="至少8位，含大小写字母和数字"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
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

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 px-4 py-2 rounded-lg">
                <AlertTriangle size={14} />
                {error}
              </div>
            )}

            <div className="bg-hex-dark/50 border border-hex-border rounded-lg p-3 space-y-2">
              <p className="text-xs text-gray-400 leading-relaxed">
                根据《中华人民共和国网络安全法》第二十四条规定，用户在注册时须提供真实的身份信息。
              </p>
              <p className="text-xs text-gray-400 leading-relaxed">
                注册即表示您已阅读并同意
                <a href="/agreement" className="text-hex-cyan hover:underline mx-0.5">《用户协议》</a>
                和
                <a href="/privacy" className="text-hex-cyan hover:underline mx-0.5">《隐私政策》</a>
              </p>
            </div>

            <HexButton type="submit" variant="primary" disabled={loading || !allMet} className="w-full">
              {loading ? '注册中...' : '注册'}
            </HexButton>
          </form>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-hex-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-hex-card px-3 text-xs text-gray-500">或</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-green-600/50 bg-green-600/10 text-green-400 hover:bg-green-600/20 transition-all text-sm font-medium"
            onClick={() => alert('微信扫码注册功能即将上线，敬请期待！')}
          >
            <WechatIcon />
            微信扫码注册
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            已有账号？
            <button
              onClick={() => navigate('/login')}
              className="text-hex-cyan hover:underline ml-1"
            >
              立即登录
            </button>
          </p>
        </GlowCard>
      </motion.div>
    </div>
  );
}
