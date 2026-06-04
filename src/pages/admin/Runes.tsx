import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Save, X, Star, Zap, Shield, Flame } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { runeApi } from '@/lib/api';

interface Rune {
  id: number;
  name: string;
  description: string;
  effect: string;
  rarity: string;
}

const rarityIcons: Record<string, any> = {
  common: Star,
  rare: Zap,
  epic: Shield,
  legendary: Flame,
};

const rarityColors: Record<string, string> = {
  common: 'text-gray-400 border-gray-500/50',
  rare: 'text-blue-400 border-blue-500/50',
  epic: 'text-purple-400 border-purple-500/50',
  legendary: 'text-hex-gold border-hex-gold/50',
};

const defaultRunes: Rune[] = [
  { id: 1, name: '虚空之力', description: '来自虚空的神秘能量', effect: '攻击力+10%', rarity: 'common' },
  { id: 2, name: '冰霜之息', description: '冰霜女巫的祝福', effect: '冷却缩减+15%', rarity: 'rare' },
  { id: 3, name: '暗影步', description: '暗影中的行者', effect: '移速+20%', rarity: 'epic' },
  { id: 4, name: '海克斯核心', description: '海克斯科技的核心能量', effect: '全属性+5%', rarity: 'legendary' },
  { id: 5, name: '荆棘之甲', description: '反弹一切伤害', effect: '反弹伤害10%', rarity: 'rare' },
];

const emptyRune = { name: '', description: '', effect: '', rarity: 'common' };

export default function AdminRunes() {
  const [runes, setRunes] = useState<Rune[]>(defaultRunes);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Rune | null>(null);
  const [form, setForm] = useState(emptyRune);

  useEffect(() => {
    runeApi.getAll().then(setRunes).catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyRune);
    setShowModal(true);
  };

  const openEdit = (rune: Rune) => {
    setEditing(rune);
    setForm(rune);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await runeApi.update(editing.id, form);
      } else {
        await runeApi.create(form);
      }
      setShowModal(false);
      runeApi.getAll().then(setRunes).catch(() => {});
    } catch {
      if (editing) {
        setRunes((prev) => prev.map((r) => (r.id === editing.id ? { ...editing, ...form } : r)));
      } else {
        setRunes((prev) => [...prev, { ...form, id: Date.now() }]);
      }
      setShowModal(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此符文？')) return;
    try {
      await runeApi.delete(id);
      setRunes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setRunes((prev) => prev.filter((r) => r.id !== id));
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
          <h1 className="font-orbitron text-2xl font-bold text-white">符文管理</h1>
          <p className="text-gray-400 text-sm">管理海克斯抽卡符文</p>
        </div>
        <HexButton variant="primary" onClick={openCreate}>
          <span className="flex items-center gap-2"><Plus size={16} />创建符文</span>
        </HexButton>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {runes.map((rune) => {
          const Icon = rarityIcons[rune.rarity] || Star;
          const colorClass = rarityColors[rune.rarity] || rarityColors.common;
          return (
            <GlowCard key={rune.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={20} className={colorClass.split(' ')[0]} />
                  <h3 className="font-bold text-white">{rune.name}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${colorClass}`}>
                  {rune.rarity === 'common' ? '普通' : rune.rarity === 'rare' ? '稀有' : rune.rarity === 'epic' ? '史诗' : '传说'}
                </span>
              </div>
              <p className="text-gray-400 text-sm mb-2">{rune.description}</p>
              <p className="text-hex-cyan text-sm font-medium mb-3">{rune.effect}</p>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(rune)} className="text-hex-cyan hover:underline text-sm flex items-center gap-1">
                  <Edit3 size={14} /> 编辑
                </button>
                <button onClick={() => handleDelete(rune.id)} className="text-red-400 hover:underline text-sm flex items-center gap-1">
                  <Trash2 size={14} /> 删除
                </button>
              </div>
            </GlowCard>
          );
        })}
      </div>

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
                  {editing ? '编辑符文' : '创建符文'}
                </h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">符文名称</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="hex-input-glow" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">描述</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="hex-input-glow min-h-[60px] resize-none" rows={2} />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">效果</label>
                  <input value={form.effect} onChange={(e) => setForm({ ...form, effect: e.target.value })} className="hex-input-glow" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">稀有度</label>
                  <select value={form.rarity} onChange={(e) => setForm({ ...form, rarity: e.target.value })} className="hex-select">
                    <option value="common">普通</option>
                    <option value="rare">稀有</option>
                    <option value="epic">史诗</option>
                    <option value="legendary">传说</option>
                  </select>
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
