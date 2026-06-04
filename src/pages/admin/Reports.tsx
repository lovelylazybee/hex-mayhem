import { useState, useEffect } from 'react';
import { Check, X, Eye, Trash2, Filter, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import HexButton from '@/components/HexButton';
import StatusBadge from '@/components/StatusBadge';
import { reportApi } from '@/lib/api';

interface Report {
  id: number;
  type: string;
  url: string;
  description: string;
  contact: string;
  status: string;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

const statusMap: Record<string, string> = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已处理',
  dismissed: '已驳回',
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400',
  processing: 'bg-blue-500/20 text-blue-400',
  resolved: 'bg-green-500/20 text-green-400',
  dismissed: 'bg-gray-500/20 text-gray-400',
};

export default function AdminReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [adminNote, setAdminNote] = useState('');

  const loadReports = () => {
    reportApi.getAll(statusFilter ? `status=${statusFilter}` : undefined)
      .then((data: any) => {
        const list = Array.isArray(data) ? data : (data?.reports || data?.data || []);
        setReports(list);
      })
      .catch(() => { setReports([]); });
  };

  useEffect(() => { loadReports(); }, [statusFilter]);

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await reportApi.update(id, { status, adminNote });
      setSelectedReport(null);
      setAdminNote('');
      loadReports();
    } catch (err: any) {
      alert(err.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此举报记录？')) return;
    try {
      await reportApi.delete(id);
      loadReports();
    } catch {}
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="font-orbitron text-2xl font-bold text-white">举报管理</h1>
        <p className="text-gray-400 text-sm">审核与处理用户举报信息</p>
      </motion.div>

      <div className="flex items-center gap-2 mb-4">
        <Filter size={16} className="text-gray-400" />
        <span className="text-sm text-gray-400">筛选：</span>
        {['', 'pending', 'processing', 'resolved', 'dismissed'].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
              statusFilter === s
                ? 'bg-hex-purple/20 border-hex-purple/50 text-hex-cyan'
                : 'bg-hex-dark border-hex-border text-gray-400 hover:text-white'
            }`}
          >
            {s === '' ? '全部' : statusMap[s] || s}
          </button>
        ))}
      </div>

      <GlowCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hex-border">
                <th className="text-left px-4 py-3 text-gray-400">ID</th>
                <th className="text-left px-4 py-3 text-gray-400">类型</th>
                <th className="text-left px-4 py-3 text-gray-400">详情</th>
                <th className="text-left px-4 py-3 text-gray-400">联系方式</th>
                <th className="text-left px-4 py-3 text-gray-400">状态</th>
                <th className="text-left px-4 py-3 text-gray-400">时间</th>
                <th className="text-left px-4 py-3 text-gray-400">操作</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id} className="border-b border-hex-border/50 hover:bg-hex-purple/5">
                  <td className="px-4 py-3 text-gray-400">#{report.id}</td>
                  <td className="px-4 py-3 text-white text-xs">{report.type}</td>
                  <td className="px-4 py-3 text-gray-300 text-xs max-w-[200px] truncate">{report.description}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{report.contact || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusColors[report.status] || 'bg-gray-500/20 text-gray-400'}`}>
                      {statusMap[report.status] || report.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{report.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setSelectedReport(report); setAdminNote(report.adminNote || ''); }} className="p-1.5 rounded-lg bg-hex-purple/10 text-hex-purple hover:bg-hex-purple/20 transition-colors" title="查看详情">
                        <Eye size={14} />
                      </button>
                      {report.status === 'pending' && (
                        <>
                          <button onClick={() => handleUpdateStatus(report.id, 'processing')} className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors" title="开始处理">
                            <MessageSquare size={14} />
                          </button>
                          <button onClick={() => handleUpdateStatus(report.id, 'resolved')} className="p-1.5 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors" title="已处理">
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleUpdateStatus(report.id, 'dismissed')} className="p-1.5 rounded-lg bg-gray-500/10 text-gray-400 hover:bg-gray-500/20 transition-colors" title="驳回">
                            <X size={14} />
                          </button>
                        </>
                      )}
                      <button onClick={() => handleDelete(report.id)} className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors" title="删除">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">暂无举报记录</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </GlowCard>

      {/* 举报详情弹窗 */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setSelectedReport(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} onClick={(e) => e.stopPropagation()} className="bg-hex-card border border-hex-border rounded-xl p-6 w-full max-w-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-orbitron text-lg font-bold text-white">举报详情 #{selectedReport.id}</h3>
                <button onClick={() => setSelectedReport(null)} className="text-gray-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">举报类型</span>
                  <p className="text-sm text-white">{selectedReport.type}</p>
                </div>
                {selectedReport.url && (
                  <div>
                    <span className="text-xs text-gray-500">涉事页面</span>
                    <p className="text-sm text-hex-cyan break-all">{selectedReport.url}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500">举报详情</span>
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{selectedReport.description}</p>
                </div>
                {selectedReport.contact && (
                  <div>
                    <span className="text-xs text-gray-500">联系方式</span>
                    <p className="text-sm text-gray-300">{selectedReport.contact}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-500">当前状态</span>
                  <p className={`text-sm ${statusColors[selectedReport.status] || 'text-gray-400'}`}>{statusMap[selectedReport.status] || selectedReport.status}</p>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">管理员备注</label>
                  <textarea
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    className="hex-input-glow min-h-[80px] resize-y text-sm"
                    placeholder="填写处理备注..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                {selectedReport.status !== 'resolved' && (
                  <HexButton variant="primary" onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}>
                    <span className="flex items-center gap-1"><Check size={14} /> 标记已处理</span>
                  </HexButton>
                )}
                {selectedReport.status !== 'dismissed' && (
                  <HexButton variant="primary" onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}>
                    <span className="flex items-center gap-1"><X size={14} /> 驳回</span>
                  </HexButton>
                )}
                <HexButton variant="gold" onClick={() => setSelectedReport(null)}>关闭</HexButton>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
