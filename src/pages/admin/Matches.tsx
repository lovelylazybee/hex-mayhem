import { useState, useEffect } from 'react';
import { Plus, Edit3, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import StatusBadge from '@/components/StatusBadge';
import { matchApi, teamApi } from '@/lib/api';

interface TeamOption {
  id: number;
  name: string;
}

interface MatchRow {
  id: number;
  round: string;
  team1Id: number;
  team2Id: number;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  status: string;
  scheduledAt: string;
}

const emptyForm = {
  seasonId: 7,
  round: '',
  team1Id: 0,
  team2Id: 0,
  team1Score: 0,
  team2Score: 0,
  status: 'upcoming',
  scheduledAt: '',
};

export default function AdminMatches() {
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [teams, setTeams] = useState<TeamOption[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<MatchRow | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    matchApi.getAll()
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: MatchRow[] = data.map((m: any) => ({
            id: m.id,
            round: m.round || '',
            team1Id: m.team1Id || m.team1?.id || 0,
            team2Id: m.team2Id || m.team2?.id || 0,
            team1Name: m.team1?.name || '未知',
            team2Name: m.team2?.name || '未知',
            team1Score: m.team1Score ?? 0,
            team2Score: m.team2Score ?? 0,
            status: m.status || 'upcoming',
            scheduledAt: m.scheduledAt || '',
          }));
          setMatches(mapped);
        }
      })
      .catch(() => {});

    teamApi.getAll()
      .then((data: any[]) => {
        if (data && data.length > 0) {
          setTeams(data.map((t: any) => ({ id: t.id, name: t.name })));
        }
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (match: MatchRow) => {
    setEditing(match);
    setForm({
      seasonId: 7,
      round: match.round,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      team1Score: match.team1Score,
      team2Score: match.team2Score,
      status: match.status,
      scheduledAt: match.scheduledAt,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        if (form.team1Score !== editing.team1Score || form.team2Score !== editing.team2Score) {
          await matchApi.updateScore(editing.id, {
            team1Score: form.team1Score,
            team2Score: form.team2Score,
          });
        }
        await matchApi.update(editing.id, {
          round: form.round,
          team1Id: form.team1Id,
          team2Id: form.team2Id,
          status: form.status,
          scheduledAt: form.scheduledAt,
        });
      } else {
        await matchApi.create({
          seasonId: form.seasonId,
          round: form.round,
          team1Id: form.team1Id,
          team2Id: form.team2Id,
          scheduledAt: form.scheduledAt,
        });
      }
      setShowModal(false);
      const data = await matchApi.getAll();
      if (data && data.length > 0) {
        const mapped: MatchRow[] = data.map((m: any) => ({
          id: m.id,
          round: m.round || '',
          team1Id: m.team1Id || m.team1?.id || 0,
          team2Id: m.team2Id || m.team2?.id || 0,
          team1Name: m.team1?.name || '未知',
          team2Name: m.team2?.name || '未知',
          team1Score: m.team1Score ?? 0,
          team2Score: m.team2Score ?? 0,
          status: m.status || 'upcoming',
          scheduledAt: m.scheduledAt || '',
        }));
        setMatches(mapped);
      }
    } catch {
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
          <h1 className="font-orbitron text-2xl font-bold text-white">赛程管理</h1>
          <p className="text-gray-400 text-sm">管理比赛对阵与结果</p>
        </div>
        <HexButton variant="primary" onClick={openCreate}>
          <span className="flex items-center gap-2"><Plus size={16} />创建比赛</span>
        </HexButton>
      </motion.div>

      <GlowCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hex-border">
                <th className="text-left px-4 py-3 text-gray-400">轮次</th>
                <th className="text-left px-4 py-3 text-gray-400">队伍1</th>
                <th className="text-center px-4 py-3 text-gray-400">比分</th>
                <th className="text-left px-4 py-3 text-gray-400">队伍2</th>
                <th className="text-left px-4 py-3 text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-gray-400">日期</th>
                <th className="text-left px-4 py-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match.id} className="border-b border-hex-border/50 hover:bg-hex-purple/5">
                  <td className="px-4 py-3 text-gray-300">{match.round}</td>
                  <td className="px-4 py-3 text-white font-medium">{match.team1Name}</td>
                  <td className="px-4 py-3 text-center font-orbitron font-bold">
                    <span className={match.team1Score > match.team2Score ? 'text-hex-gold' : 'text-gray-400'}>{match.team1Score}</span>
                    <span className="text-gray-600 mx-1">:</span>
                    <span className={match.team2Score > match.team1Score ? 'text-hex-gold' : 'text-gray-400'}>{match.team2Score}</span>
                  </td>
                  <td className="px-4 py-3 text-white font-medium">{match.team2Name}</td>
                  <td className="px-4 py-3"><StatusBadge status={match.status} /></td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{match.scheduledAt}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => openEdit(match)} className="text-hex-cyan hover:underline text-sm flex items-center gap-1">
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
                  {editing ? '编辑比赛' : '创建比赛'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">轮次</label>
                  <input value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} className="hex-input-glow" placeholder="如：小组赛A组" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">队伍1</label>
                    <select value={form.team1Id} onChange={(e) => setForm({ ...form, team1Id: Number(e.target.value) })} className="hex-select">
                      <option value={0}>选择队伍</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">队伍2</label>
                    <select value={form.team2Id} onChange={(e) => setForm({ ...form, team2Id: Number(e.target.value) })} className="hex-select">
                      <option value={0}>选择队伍</option>
                      {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">队伍1得分</label>
                    <input type="number" value={form.team1Score} onChange={(e) => setForm({ ...form, team1Score: Number(e.target.value) })} className="hex-input-glow" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-1">队伍2得分</label>
                    <input type="number" value={form.team2Score} onChange={(e) => setForm({ ...form, team2Score: Number(e.target.value) })} className="hex-input-glow" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">状态</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="hex-select">
                    <option value="upcoming">即将开始</option>
                    <option value="in_progress">进行中</option>
                    <option value="completed">已结束</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">比赛日期</label>
                  <input type="date" value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} className="hex-input-glow" />
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
