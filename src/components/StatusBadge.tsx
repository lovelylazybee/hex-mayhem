import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; colorClass: string }> = {
  upcoming: { label: '即将开始', colorClass: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  registering: { label: '报名中', colorClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
  in_progress: { label: '进行中', colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  completed: { label: '已结束', colorClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30' },
  pending: { label: '待审核', colorClass: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  approved: { label: '已通过', colorClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
  rejected: { label: '已拒绝', colorClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || { label: status, colorClass: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.colorClass,
        className
      )}
    >
      {config.label}
    </span>
  );
}
