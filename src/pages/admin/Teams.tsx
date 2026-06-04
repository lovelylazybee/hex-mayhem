import { useState, useEffect } from 'react';
import { Plus, Shuffle, Edit3, Save, X, Users, Trash2, Crown, UserPlus, UserMinus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { teamApi, seasonApi, registrationApi } from '@/lib/api';

const positionMap: Record<string, string> = {
  mage: '法师', adc: 'ADC', support: '软辅',
  tank: '坦克', assassin: '刺客', fighter: '战士',
};

export default function AdminTeams() {
  const [teams, setTeams] = useState<any[]>([]);
  const [currentSeasonId, setCurrentSeasonId] = useState<number>(1);
  const [approvedRegs, setApprovedRegs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [memberTeam, setMemberTeam] = useState<any>(null);
  const [form, setForm] = useState({ name: '' });

  const loadTeams = () => {
    teamApi.getAll(`seasonId=${currentSeasonId}`)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.teams || data?.data || []);
        setTeams(list);
      })
      .catch(() => { setTeams([]); });
  };

  const loadApprovedRegs = () => {
    registrationApi.getAll('status=approved')
      .then((data: any) => {
        const list = data.registrations || data;
        if (Array.isArray(list)) setApprovedRegs(list);
      })
      .catch(() => { setApprovedRegs([]); });
  };

  useEffect(() => {
    seasonApi.getAll()
      .then((data: any) => {
        const seasons = Array.isArray(data) ? data : (data?.seasons || data?.data || []);
        const current = seasons.find((s: any) => s.status === 'registering' || s.status === 'in_progress');
        if (current) setCurrentSeasonId(current.id);
      })
      .catch(() => {});
    loadTeams();
    loadApprovedRegs();
  }, []);

  useEffect(() => { loadTeams(); loadApprovedRegs(); }, [currentSeasonId]);

  const openCreate = () => { setEditing(null); setForm({ name: '' }); setShowModal(true); };
  const openEdit = (team: any) => { setEditing(team); setForm({ name: team.name }); setShowModal(true); };
  const openMemberModal = (team: any) => { setMemberTeam(team); setShowMemberModal(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('请输入队伍名称'); return; }
    try {
      if (editing) { await teamApi.update(editing.id, { name: form.name }); }
      else { await teamApi.create({ name: form.name, seasonId: currentSeasonId }); }
      setShowModal(false); loadTeams();
    } catch (err: any) { alert(err.message || '保存失败'); setShowModal(false); }
  };

  const handleAutoAssign = async () => {
    try { await teamApi.autoAssign(currentSeasonId); loadTeams(); loadApprovedRegs(); }
    catch (err: any) { alert(err.message || '自动分队失败'); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此队伍？')) return;
    try { await teamApi.delete(id); loadTeams(); loadApprovedRegs(); } catch {}
  };

  const getAssignedUserIds = (): Set<number> => {
    const ids = new Set<number>();
    teams.forEach((t) => { (t.members || []).forEach((m: any) => ids.add(m.userId || m.user_id)); });
    return ids;
  };

  const handleAddMember = async (reg: any) => {
    if (!memberTeam) return;
    const members = [...(memberTeam.members || [])];
    if (members.length >= 5) { alert('每队最多5人'); return; }
    members.push({
      userId: reg.userId || reg.user_id,
      gameId: reg.gameId || reg.game_id,
      position: (reg.preferredPositions || [])[0] || '随意',
      isCaptain: members.length === 0,
    });
    try {
      await teamApi.updateMembers(memberTeam.id, { members });
      const updated = { ...memberTeam, members };
      setMemberTeam(updated);
      loadTeams();
    } catch (err: any) { alert(err.message || '添加队员失败'); }
  };

  const handleRemoveMember = async (memberIndex: number) => {
    if (!memberTeam) return;
    const members = [...(memberTeam.members || [])];
    members.splice(memberIndex, 1);
    try {
      await teamApi.updateMembers(memberTeam.id, { members });
      const updated = { ...memberTeam, members };
      setMemberTeam(updated);
      loadTeams();
    } catch (err: any) { alert(err.message || '移除队员失败'); }
  };

  const handleSetCaptain = async (memberIndex: number) => {
    if (!memberTeam) return;
    const members = (memberTeam.members || []).map((m: any, i: number) => ({
      ...m,
      isCaptain: i === memberIndex,
    }));
    try {
      await teamApi.updateMembers(memberTeam.id, { members });
      const updated = { ...memberTeam, members };
      setMemberTeam(updated);
      loadTeams();
    } catch (err: any) { alert(err.message || '设置队长失败'); }
  };

  const assignedUserIds = getAssignedUserIds();
  const availableRegs = approvedRegs.filter((r) => {
    const uid = r.userId || r.user_id;
    if (memberTeam) {
      const inThisTeam = (memberTeam.members || []).some((m: any) => (m.userId || m.user_id) === uid);
      if (inThisTeam) return false;
    }
    return !assignedUserIds.has(uid);
  });

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between mb-6">
        <div><h1 className="font-orbitron text-2xl font-bold text-white">分队管理</h1><p className="text-gray-400 text-sm">管理参赛队伍与队员</p></div>
        <div className="flex gap-3">
          <HexButton variant="cyan" onClick={handleAutoAssign}><span className="flex items-center gap-2"><Shuffle size={16} />自动分队</span></HexButton>
          <HexButton variant="primary" onClick={openCreate}><span className="flex items-center gap-2"><Plus size={16} />创建队伍</span></HexButton>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <GlowCard key={team.id}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white text-lg">{team.name}</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => openMemberModal(team)} className="text-hex-gold hover:underline text-sm flex items-center gap-1">
                  <UserPlus size={14} /> 队员
                </button>
                <button onClick={() => openEdit(team)} className="text-hex-cyan hover:underline text-sm flex items-center gap-1">
                  <Edit3 size={14} /> 编辑
                </button>
                <button onClick={() => handleDelete(team.id)} className="text-red-400 hover:underline text-sm flex items-center gap-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
              <Users size={14} />{(team.members || []).length} / 5 名队员
            </div>
            <div className="space-y-1.5">
              {(team.members || []).map((m: any, i: number) => (
                <div key={m.id || i} className="flex items-center justify-between px-2 py-1.5 bg-hex-dark/50 border border-hex-border/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {(m.isCaptain || m.is_captain) && <Crown size={12} className="text-hex-gold" />}
                    <span className="text-sm text-white">{m.gameId || m.game_id || '未知'}</span>
                    <span className="text-xs text-gray-500">{positionMap[m.position] || m.position || ''}</span>
                  </div>
                  {(m.isCaptain || m.is_captain) && <span className="text-xs text-hex-gold">队长</span>}
                </div>
              ))}
              {(team.members || []).length === 0 && <p className="text-xs text-gray-500 text-center py-2">暂无队员</p>}
            </div>
          </GlowCard>
        ))}
      </div>

      {teams.length === 0 && (<GlowCard><p className="text-gray-500 text-center py-8">暂无队伍，点击"自动分队"或"创建队伍"开始</p></GlowCard>)}

      {/* 创建/编辑队伍弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-hex-card border border-hex-border rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron text-lg font-bold text-white">{editing ? '编辑队伍' : '创建队伍'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-4">
                <div><label className="block text-sm text-gray-400 mb-1">队伍名称</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="hex-input-glow" placeholder="输入队伍名称" /></div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <HexButton variant="primary" onClick={() => setShowModal(false)}>取消</HexButton>
                <HexButton variant="gold" onClick={handleSave}><span className="flex items-center gap-1"><Save size={14} /> 保存</span></HexButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 队员管理弹窗 */}
      <AnimatePresence>
        {showMemberModal && memberTeam && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowMemberModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-hex-card border border-hex-border rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron text-lg font-bold text-white">{memberTeam.name} - 队员管理</h3>
                <button onClick={() => setShowMemberModal(false)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>

              {/* 当前队员 */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">当前队员 ({(memberTeam.members || []).length}/5)</h4>
                {(memberTeam.members || []).length === 0 && <p className="text-xs text-gray-500 py-2">暂无队员，从下方添加</p>}
                <div className="space-y-2">
                  {(memberTeam.members || []).map((m: any, i: number) => (
                    <div key={m.id || i} className="flex items-center justify-between px-3 py-2 bg-hex-dark/50 border border-hex-border/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        {(m.isCaptain || m.is_captain) ? (
                          <Crown size={14} className="text-hex-gold" />
                        ) : (
                          <button onClick={() => handleSetCaptain(i)} className="text-gray-500 hover:text-hex-gold transition-colors" title="设为队长">
                            <Crown size={14} />
                          </button>
                        )}
                        <span className="text-sm text-white">{m.gameId || m.game_id || '未知'}</span>
                        <span className="text-xs text-gray-500">{positionMap[m.position] || m.position || ''}</span>
                        {(m.isCaptain || m.is_captain) && <span className="text-xs text-hex-gold font-medium">队长</span>}
                      </div>
                      <button onClick={() => handleRemoveMember(i)} className="p-1 rounded text-red-400 hover:bg-red-500/10 transition-colors" title="移除队员">
                        <UserMinus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 可添加的队员 */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">可添加的报名人员</h4>
                {availableRegs.length === 0 && <p className="text-xs text-gray-500 py-2">没有可添加的人员</p>}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {availableRegs.map((reg: any) => (
                    <div key={reg.id} className="flex items-center justify-between px-3 py-2 bg-hex-dark/30 border border-hex-border/30 rounded-lg hover:border-hex-purple/30 transition-colors">
                      <div>
                        <span className="text-sm text-white">{reg.gameId || reg.game_id}</span>
                        <span className="text-xs text-gray-500 ml-2">{reg.username}</span>
                        <div className="flex gap-1 mt-0.5">
                          {(reg.preferredPositions || []).map((p: string) => (
                            <span key={p} className="text-xs text-hex-purple">{positionMap[p] || p}</span>
                          ))}
                          {(reg.willingCaptain || reg.willing_captain) && <span className="text-xs text-hex-gold">愿当队长</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddMember(reg)}
                        disabled={(memberTeam.members || []).length >= 5}
                        className="p-1.5 rounded-lg bg-hex-purple/10 text-hex-purple hover:bg-hex-purple/20 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title="添加队员"
                      >
                        <UserPlus size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
