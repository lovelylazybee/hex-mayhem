import { useState, useEffect } from 'react';
import { Search, Shield, Trash2, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { userApi } from '@/lib/api';

interface UserItem {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

const defaultUsers: UserItem[] = [
  { id: 1, username: 'admin', email: 'admin@hex.com', role: 'admin', createdAt: '2026-01-01' },
  { id: 2, username: '玩家A', email: 'playerA@hex.com', role: 'user', createdAt: '2026-05-20' },
  { id: 3, username: '玩家B', email: 'playerB@hex.com', role: 'user', createdAt: '2026-05-21' },
  { id: 4, username: '玩家C', email: 'playerC@hex.com', role: 'user', createdAt: '2026-05-21' },
  { id: 5, username: '玩家D', email: 'playerD@hex.com', role: 'user', createdAt: '2026-05-22' },
];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserItem[]>(defaultUsers);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  useEffect(() => {
    userApi.getAll().then(setUsers).catch(() => {});
  }, []);

  const filtered = users.filter(
    (u) => u.username.includes(search) || u.email.includes(search)
  );

  const toggleRole = async (user: UserItem) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      await userApi.update(user.id, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    } catch {
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role: newRole } : u)));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此用户？')) return;
    try {
      await userApi.delete(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch {
      setUsers((prev) => prev.filter((u) => u.id !== id));
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-orbitron text-2xl font-bold text-white">用户管理</h1>
        <p className="text-gray-400 text-sm">管理用户账号与权限</p>
      </motion.div>

      <div className="mb-4 relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户名或邮箱..."
          className="hex-input-glow pl-10"
        />
      </div>

      <GlowCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hex-border">
                <th className="text-left px-4 py-3 text-gray-400">用户名</th>
                <th className="text-left px-4 py-3 text-gray-400">邮箱</th>
                <th className="text-left px-4 py-3 text-gray-400">角色</th>
                <th className="text-left px-4 py-3 text-gray-400">注册日期</th>
                <th className="text-left px-4 py-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className="border-b border-hex-border/50 hover:bg-hex-purple/5">
                  <td className="px-4 py-3 text-white font-medium">{user.username}</td>
                  <td className="px-4 py-3 text-gray-300">{user.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${
                      user.role === 'admin'
                        ? 'bg-hex-gold/10 border-hex-gold/30 text-hex-gold'
                        : 'bg-hex-purple/10 border-hex-purple/30 text-hex-purple'
                    }`}>
                      {user.role === 'admin' ? '管理员' : '用户'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{user.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleRole(user)}
                        className="p-1.5 rounded-lg bg-hex-purple/10 text-hex-purple hover:bg-hex-purple/20 transition-colors"
                        title={user.role === 'admin' ? '设为用户' : '设为管理员'}
                      >
                        <Shield size={14} />
                      </button>
                      <button
                        onClick={() => setSelectedUser(user)}
                        className="p-1.5 rounded-lg bg-hex-cyan/10 text-hex-cyan hover:bg-hex-cyan/20 transition-colors"
                        title="查看详情"
                      >
                        <UserCog size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        title="删除用户"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>

      {selectedUser && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedUser(null)}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-hex-card border border-hex-border rounded-xl p-6 w-full max-w-md"
          >
            <h3 className="font-orbitron text-lg font-bold text-white mb-4">用户详情</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">用户名</span>
                <span className="text-white font-medium">{selectedUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">邮箱</span>
                <span className="text-white">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">角色</span>
                <span className={selectedUser.role === 'admin' ? 'text-hex-gold' : 'text-hex-purple'}>
                  {selectedUser.role === 'admin' ? '管理员' : '用户'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">注册日期</span>
                <span className="text-white">{selectedUser.createdAt}</span>
              </div>
            </div>
            <HexButton variant="primary" onClick={() => setSelectedUser(null)} className="w-full mt-6">
              关闭
            </HexButton>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
