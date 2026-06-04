import { useState, useEffect } from 'react';
import { Save, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import { contentApi } from '@/lib/api';

interface ContentBlock {
  key: string;
  title: string;
  content: string;
  updatedAt: string;
}

const defaultBlocks: ContentBlock[] = [
  { key: 'rules', title: '比赛规则', content: '1. ARAM模式5v5对抗\n2. 系统随机分队\n3. 小组循环+淘汰赛制', updatedAt: '2026-05-20' },
  { key: 'home_banner', title: '首页横幅', content: 'S7 海克斯大乱斗战术探讨\n大乱斗模式 · 全新赛制 · 荣耀再临', updatedAt: '2026-05-19' },
  { key: 'prizes', title: '奖品说明', content: '冠军：专属皮肤 + 海克斯冠军头像 + 2000点券\n亚军：海克斯亚军头像 + 1000点券', updatedAt: '2026-05-18' },
];

export default function AdminContent() {
  const [blocks, setBlocks] = useState<ContentBlock[]>(defaultBlocks);
  const [activeKey, setActiveKey] = useState('rules');
  const [content, setContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const activeBlock = blocks.find((b) => b.key === activeKey);

  useEffect(() => {
    if (activeBlock) {
      setContent(activeBlock.content);
    }
  }, [activeKey, activeBlock]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await contentApi.update(activeKey, content);
      setBlocks((prev) =>
        prev.map((b) => (b.key === activeKey ? { ...b, content, updatedAt: new Date().toISOString().split('T')[0] } : b))
      );
    } catch {
      setBlocks((prev) =>
        prev.map((b) => (b.key === activeKey ? { ...b, content, updatedAt: new Date().toISOString().split('T')[0] } : b))
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="font-orbitron text-2xl font-bold text-white">内容管理</h1>
        <p className="text-gray-400 text-sm">管理网站内容与公告</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <GlowCard className="p-2">
            <nav className="space-y-1">
              {blocks.map((block) => (
                <button
                  key={block.key}
                  onClick={() => { setActiveKey(block.key); setPreview(false); }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    activeKey === block.key
                      ? 'bg-hex-purple/20 text-hex-cyan border border-hex-purple/30'
                      : 'text-gray-400 hover:text-white hover:bg-hex-dark/50'
                  }`}
                >
                  {block.title}
                </button>
              ))}
            </nav>
          </GlowCard>
        </div>

        <div className="lg:col-span-3">
          <GlowCard>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-white">{activeBlock?.title}</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPreview(!preview)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    preview
                      ? 'bg-hex-purple/20 border-hex-purple/50 text-hex-cyan'
                      : 'bg-hex-dark border-hex-border text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye size={14} />
                  {preview ? '编辑' : '预览'}
                </button>
                <HexButton variant="gold" onClick={handleSave} disabled={saving}>
                  <span className="flex items-center gap-1"><Save size={14} /> {saving ? '保存中...' : '保存'}</span>
                </HexButton>
              </div>
            </div>

            {preview ? (
              <div className="bg-hex-dark/50 rounded-lg p-4 min-h-[300px] whitespace-pre-wrap text-gray-300">
                {content}
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="hex-input-glow min-h-[300px] resize-y font-mono text-sm"
              />
            )}

            {activeBlock && (
              <p className="text-xs text-gray-500 mt-3">
                最后更新：{activeBlock.updatedAt}
              </p>
            )}
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
