import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut, Shield, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: '首页' },
  { path: '/rules', label: '赛制公告' },
  { path: '/register', label: '报名' },
  { path: '/hexcard', label: '海克斯抽卡' },
  { path: '/hall-of-fame', label: '荣誉殿堂' },
  { path: '/schedule', label: '赛程积分' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();
  const { isAuthenticated, user, isAdmin, logout } = useAuthStore();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-hex-dark/90 backdrop-blur-md border-b border-hex-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-hex-gradient rounded-lg flex items-center justify-center">
              <span className="font-orbitron text-sm font-bold text-white">H</span>
            </div>
            <span className="font-orbitron text-lg font-bold text-gradient-purple hidden sm:block">
              海克斯大乱斗战术探讨
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300',
                  location.pathname === item.path
                    ? 'text-hex-cyan glow-text-cyan bg-hex-purple/10'
                    : 'text-gray-300 hover:text-white hover:bg-hex-card/50'
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-hex-card border border-hex-border hover:border-hex-purple/50 transition-all"
                >
                  <User size={16} className="text-hex-cyan" />
                  <span className="text-sm text-gray-300">{user?.username}</span>
                </button>
                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-hex-card border border-hex-border rounded-lg shadow-lg overflow-hidden"
                    >
                      <Link
                        to="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-hex-purple/10 hover:text-white transition-colors"
                      >
                        <User size={14} />
                        个人中心
                      </Link>
                      <Link
                        to="/change-password"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-hex-purple/10 hover:text-white transition-colors"
                      >
                        <KeyRound size={14} />
                        修改密码
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:bg-hex-purple/10 hover:text-white transition-colors"
                        >
                          <Shield size={14} />
                          管理后台
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 w-full transition-colors"
                      >
                        <LogOut size={14} />
                        退出登录
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-bold bg-hex-gradient rounded-lg text-white hover:opacity-90 transition-opacity"
                >
                  注册
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-hex-dark/95 border-b border-hex-border overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    location.pathname === item.path
                      ? 'text-hex-cyan bg-hex-purple/10'
                      : 'text-gray-300 hover:text-white hover:bg-hex-card/50'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-hex-border pt-3 mt-3 flex flex-col gap-2">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/profile"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white"
                    >
                      <User size={14} />
                      个人中心
                    </Link>
                    <Link
                      to="/change-password"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white"
                    >
                      <KeyRound size={14} />
                      修改密码
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white"
                      >
                        <Shield size={14} />
                        管理后台
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        logout();
                        setMobileOpen(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-400"
                    >
                      <LogOut size={14} />
                      退出登录
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 text-sm text-gray-300 hover:text-white"
                    >
                      登录
                    </Link>
                    <Link
                      to="/signup"
                      onClick={() => setMobileOpen(false)}
                      className="block px-3 py-2 text-sm font-bold text-white bg-hex-gradient rounded-lg text-center"
                    >
                      注册
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
