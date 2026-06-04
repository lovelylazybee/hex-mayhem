import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Shield, Mail, Phone, FileWarning } from 'lucide-react';
import HexButton from '@/components/HexButton';

const reportTypes = [
  '危害国家安全',
  '煽动民族仇恨',
  '散布谣言扰乱社会秩序',
  '散布淫秽色情内容',
  '侮辱诽谤他人',
  '侵犯他人隐私',
  '赌博或诈骗信息',
  '其他违法违规内容',
];

export default function Report() {
  const [form, setForm] = useState({
    type: '',
    url: '',
    description: '',
    contact: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={32} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">举报已提交</h2>
          <p className="text-gray-400 mb-2">感谢您的举报，我们将在24小时内进行审核处理。</p>
          <p className="text-gray-500 text-sm mb-6">如情况紧急，请直接联系公安机关或拨打110。</p>
          <HexButton onClick={() => { setSubmitted(false); setForm({ type: '', url: '', description: '', contact: '' }); }}>
            继续举报
          </HexButton>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="w-14 h-14 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FileWarning size={24} className="text-red-400" />
        </div>
        <h1 className="font-orbitron text-3xl font-bold text-white mb-2">不良信息举报</h1>
        <p className="text-gray-400 text-sm">如发现本平台存在违法违规信息，请及时举报</p>
      </motion.div>

      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-8">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div className="text-sm text-gray-300">
            <p className="font-medium text-red-400 mb-1">紧急情况</p>
            <p>如涉及危害国家安全、恐怖活动等紧急情况，请立即拨打 <span className="text-white font-bold">110</span> 报警，或登录 <a href="https://www.12377.cn/" target="_blank" rel="noopener noreferrer" className="text-hex-cyan hover:underline">中央网信办违法和不良信息举报中心</a>。</p>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-hex-dark/50 border border-hex-border rounded-xl p-6 mb-8"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">举报类型 *</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="hex-select"
              required
            >
              <option value="">请选择举报类型</option>
              {reportTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">涉事页面/内容位置</label>
            <input
              type="text"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="hex-input-glow"
              placeholder="请描述或粘贴涉事内容的页面地址"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">举报详情 *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="hex-input-glow min-h-[120px] resize-y"
              placeholder="请详细描述违法违规内容的情况"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">联系方式</label>
            <input
              type="text"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
              className="hex-input-glow"
              placeholder="邮箱或QQ（选填，方便我们反馈处理结果）"
            />
          </div>

          <HexButton type="submit" variant="primary" className="w-full">
            提交举报
          </HexButton>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-hex-dark/50 border border-hex-border rounded-xl p-6"
      >
        <h2 className="text-lg font-bold text-hex-cyan mb-4">举报须知</h2>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex gap-2"><span className="text-hex-purple">•</span>举报人须对举报内容的真实性负责，不得捏造事实、诬告陷害他人。</li>
          <li className="flex gap-2"><span className="text-hex-purple">•</span>我们将依法保护举报人的个人信息，不会向被举报人透露举报人身份。</li>
          <li className="flex gap-2"><span className="text-hex-purple">•</span>我们将在收到举报后24小时内进行审核，并依法依规处理。</li>
          <li className="flex gap-2"><span className="text-hex-purple">•</span>对于确认违规的内容，我们将立即删除，并对发布者依法依规处理。</li>
        </ul>

        <div className="mt-6 pt-4 border-t border-hex-border">
          <h3 className="text-sm font-bold text-gray-300 mb-3">其他举报渠道</h3>
          <div className="space-y-2 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-hex-cyan" />
              <span>中央网信办举报热线：<span className="text-white">12377</span></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail size={14} className="text-hex-cyan" />
              <span>违法和不良信息举报中心：<a href="https://www.12377.cn/" target="_blank" rel="noopener noreferrer" className="text-hex-cyan hover:underline">www.12377.cn</a></span>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-hex-cyan" />
              <span>网络违法犯罪举报：<a href="https://cyberpolice.mps.gov.cn/" target="_blank" rel="noopener noreferrer" className="text-hex-cyan hover:underline">cyberpolice.mps.gov.cn</a></span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
