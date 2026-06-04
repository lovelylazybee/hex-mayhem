import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Trophy,
  ClipboardList,
  Users,
  Sparkles,
  Calendar,
  FileText,
  UserCog,
  Menu,
  X,
  ChevronLeft,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

const adminNavItems = [
  { path: '/admin', label: '仪表盘', icon: LayoutDashboard },
  { path: '/admin/seasons', label: '赛季管理', icon: Trophy },
  { path: '/admin/registrations', label: '报名管理', icon: ClipboardList },
  { path: '/admin/teams', label: '分队管理', icon: Users },
  { path: '/admin/runes', label: '符文管理', icon: Sparkles },
  { path: '/admin/matches', label: '赛程管理', icon: Calendar },
  { path: '/admin/content', label: '内容管理', icon: FileText },
  { path: '/admin/reports', label: '举报管理', icon: ShieldAlert },
  { path: '/admin/users', label: '用户管理', icon: UserCog },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen flex bg-hex-dark">
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40 w-64 bg-hex-card border-r border-hex-border transition-transform duration-300 lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-hex-border">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-hex-gradient rounded-lg flex items-center justify-center">
              <span className="font-orbitron text-sm font-bold text-white">H</span>
            </div>
            <span className="font-orbitron text-sm font-bold text-gradient-purple">管理后台</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="p-3 space-y-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-hex-purple/20 text-hex-cyan border border-hex-purple/30'
                    : 'text-gray-400 hover:text-white hover:bg-hex-dark/50'
                )}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-hex-border">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            返回前台
          </Link>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-hex-card/50 border-b border-hex-border flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            <Menu size={24} />
          </button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <UserCog size={16} className="text-hex-purple" />
            <span>{user?.username || '管理员'}</span>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
