import { useState, useEffect } from 'react';
import { Check, X, Download, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import StatusBadge from '@/components/StatusBadge';
import { registrationApi } from '@/lib/api';

interface Registration {
  id: number;
  userId: number;
  username: string;
  gameId: string;
  preferredPositions: string[];
  contactInfo: string;
  declaration: string;
  willingCaptain: boolean;
  status: string;
  createdAt: string;
}

const positionMap: Record<string, string> = {
  mage: '法师', adc: 'ADC', support: '软辅',
  tank: '坦克', assassin: '刺客', fighter: '战士',
};

export default function AdminRegistrations() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    registrationApi.getAll(statusFilter ? `status=${statusFilter}` : undefined)
      .then((data: any) => {
        const list = data.registrations || data;
        if (Array.isArray(list)) setRegistrations(list);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleApprove = async (id: number) => {
    try {
      await registrationApi.approve(id);
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    } catch {
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    }
  };

  const handleReject = async (id: number) => {
    try {
      await registrationApi.reject(id);
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    } catch {
      setRegistrations((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'rejected' } : r)));
    }
  };

  const filtered = statusFilter
    ? registrations.filter((r) => r.status === statusFilter)
    : registrations;

  const translatePositions = (positions: string[]): string[] => {
    return positions.map((p) => positionMap[p] || p);
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white">报名管理</h1>
          <p className="text-gray-400 text-sm">审核与管理参赛报名</p>
        </div>
        <HexButton variant="cyan">
          <span className="flex items-center gap-2"><Download size={16} />导出</span>
        </HexButton>
      </motion.div>

      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-gray-400" />
        <span className="text-sm text-gray-400">筛选：</span>
        {['', 'pending', 'approved', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === s
                ? 'bg-hex-purple/20 border-hex-purple/50 text-hex-cyan'
                : 'bg-hex-dark border-hex-border text-gray-400 hover:text-white'
            }`}
          >
            {s === '' ? '全部' : s === 'pending' ? '待审核' : s === 'approved' ? '已通过' : '已拒绝'}
          </button>
        ))}
      </div>

      <GlowCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hex-border">
                <th className="text-left px-4 py-3 text-gray-400">用户</th>
                <th className="text-left px-4 py-3 text-gray-400">游戏ID</th>
                <th className="text-left px-4 py-3 text-gray-400">偏好位置</th>
                <th className="text-left px-4 py-3 text-gray-400">微信号</th>
                <th className="text-left px-4 py-3 text-gray-400">队长</th>
                <th className="text-left px-4 py-3 text-gray-400">参赛宣言</th>
                <th className="text-left px-4 py-3 text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-gray-400">日期</th>
                <th className="text-left px-4 py-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((reg) => (
                <tr key={reg.id} className="border-b border-hex-border/50 hover:bg-hex-purple/5">
                  <td className="px-4 py-3 text-white font-medium">{reg.username}</td>
                  <td className="px-4 py-3 text-gray-300">{reg.gameId}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {translatePositions(reg.preferredPositions || []).map((p) => (
                        <span key={p} className="px-2 py-0.5 bg-hex-purple/10 text-hex-purple text-xs rounded">
                          {p}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-xs">{reg.contactInfo || '-'}</td>
                  <td className="px-4 py-3">
                    {reg.willingCaptain ? (
                      <span className="px-2 py-0.5 bg-hex-gold/20 text-hex-gold text-xs rounded">愿意</span>
                    ) : (
                      <span className="text-gray-500 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs max-w-[150px] truncate">{reg.declaration || '-'}</td>
                  <td className="px-4 py-3"><StatusBadge status={reg.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{reg.createdAt}</td>
                  <td className="px-4 py-3">
                    {reg.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(reg.id)}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleReject(reg.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>
    </div>
  );
}
