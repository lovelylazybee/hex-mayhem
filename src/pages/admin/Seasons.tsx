import { useState, useEffect } from 'react';
import { Plus, Edit3, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import StatusBadge from '@/components/StatusBadge';
import { seasonApi } from '@/lib/api';

interface Season {
  id: number;
  title: string;
  number: number;
  status: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
}

const defaultSeasons: Season[] = [
  { id: 7, title: '海克斯大乱斗战术探讨 S7', number: 7, status: 'registering', startDate: '2026-06-15', endDate: '2026-07-15', registrationDeadline: '2026-06-10' },
  { id: 6, title: '海克斯大乱斗战术探讨 S6', number: 6, status: 'completed', startDate: '2025-12-01', endDate: '2026-01-15', registrationDeadline: '2025-11-25' },
  { id: 5, title: '海克斯大乱斗战术探讨 S5', number: 5, status: 'completed', startDate: '2025-06-01', endDate: '2025-07-15', registrationDeadline: '2025-05-25' },
];

const emptySeason = { title: '', number: 0, status: 'upcoming', startDate: '', endDate: '', registrationDeadline: '' };

export default function AdminSeasons() {
  const [seasons, setSeasons] = useState<Season[]>(defaultSeasons);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Season | null>(null);
  const [form, setForm] = useState(emptySeason);

  useEffect(() => {
    seasonApi.getAll().then(setSeasons).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptySeason);
    setShowModal(true);
  };

  const openEdit = (season: Season) => {
    setEditing(season);
    setForm(season);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await seasonApi.update(editing.id, form);
      } else {
        await seasonApi.create(form);
      }
      setShowModal(false);
      seasonApi.getAll().then(setSeasons).catch(() => {});
    } catch {
      if (editing) {
        setSeasons((prev) => prev.map((s) => (s.id === editing.id ? { ...editing, ...form } : s)));
      } else {
        setSeasons((prev) => [...prev, { ...form, id: Date.now() } as Season]);
      }
      setShowModal(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div>
          <h1 className="font-orbitron text-2xl font-bold text-white">赛季管理</h1>
          <p className="text-gray-400 text-sm">管理所有赛季信息</p>
        </div>
        <HexButton variant="primary" onClick={openCreate}>
          <span className="flex items-center gap-2"><Plus size={16} />创建赛季</span>
        </HexButton>
      </motion.div>

      <GlowCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hex-border">
                <th className="text-left px-4 py-3 text-gray-400">赛季</th>
                <th className="text-left px-4 py-3 text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-gray-400">开始日期</th>
                <th className="text-left px-4 py-3 text-gray-400">结束日期</th>
                <th className="text-left px-4 py-3 text-gray-400">报名截止</th>
                <th className="text-left px-4 py-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((season) => (
                <tr key={season.id} className="border-b border-hex-border/50 hover:bg-hex-purple/5">
                  <td className="px-4 py-3 font-bold text-white">{season.title}</td>
                  <td className="px-4 py-3"><StatusBadge status={season.status} /></td>
                  <td className="px-4 py-3 text-gray-300">{season.startDate}</td>
                  <td className="px-4 py-3 text-gray-300">{season.endDate}</td>
                  <td className="px-4 py-3 text-gray-300">{season.registrationDeadline}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(season)} className="text-hex-cyan hover:underline text-sm flex items-center gap-1">
                      <Edit3 size={14} /> 编辑
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlowCard>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-hex-card border border-hex-border rounded-xl p-6 w-full max-w-lg"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron text-lg font-bold text-white">
                  {editing ? '编辑赛季' : '创建赛季'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">赛季名称</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="hex-input-glow" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">赛季编号</label>
                  <input type="number" value={form.number} onChange={(e) => setForm({ ...form, number: Number(e.target.value) })} className="hex-input-glow" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="hex-select">
                    <option value="upcoming">即将开始</option>
                    <option value="registering">报名中</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已结束</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">开始日期</label>
                    <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="hex-input-glow" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">结束日期</label>
                    <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="hex-input-glow" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">报名截止日期</label>
                  <input type="date" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} className="hex-input-glow" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <HexButton variant="primary" onClick={() => setShowModal(false)}>取消</HexButton>
                <HexButton variant="gold" onClick={handleSave}>
                  <span className="flex items-center gap-1"><Save size={14} /> 保存</span>
                </HexButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
