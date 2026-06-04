import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Swords, Trophy } from 'lucide-react';
import GlowCard from '@/components/GlowCard';
import StatusBadge from '@/components/StatusBadge';
import { cn } from '@/lib/utils';
import { matchApi } from '@/lib/api';

type TabType = 'bracket' | 'standings';

interface DisplayMatch {
  id: number;
  round: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  status: string;
  scheduledAt: string;
}

const placeholderMatches: DisplayMatch[] = [
  { id: 1, round: '小组赛', teamA: '暗影岛之怒', teamB: '弗雷尔卓德', scoreA: 2, scoreB: 1, status: 'completed', scheduledAt: '' },
  { id: 2, round: '小组赛', teamA: '德玛西亚之力', teamB: '诺克萨斯军团', scoreA: 1, scoreB: 2, status: 'completed', scheduledAt: '' },
  { id: 3, round: '小组赛', teamA: '艾欧尼亚守护者', teamB: '皮尔特沃夫科技', scoreA: 0, scoreB: 0, status: 'in_progress', scheduledAt: '' },
  { id: 4, round: '淘汰赛', teamA: '暗影岛之怒', teamB: '诺克萨斯军团', scoreA: 0, scoreB: 0, status: 'upcoming', scheduledAt: '' },
  { id: 5, round: '淘汰赛', teamA: '弗雷尔卓德', teamB: '德玛西亚之力', scoreA: 0, scoreB: 0, status: 'upcoming', scheduledAt: '' },
];

const placeholderStandings = [
  { team: '暗影岛之怒', wins: 3, losses: 0, points: 9, diff: 6 },
  { team: '弗雷尔卓德', wins: 2, losses: 1, points: 6, diff: 3 },
  { team: '诺克萨斯军团', wins: 2, losses: 1, points: 6, diff: 2 },
  { team: '德玛西亚之力', wins: 1, losses: 2, points: 3, diff: -1 },
  { team: '艾欧尼亚守护者', wins: 0, losses: 2, points: 0, diff: -4 },
  { team: '皮尔特沃夫科技', wins: 0, losses: 3, points: 0, diff: -6 },
];

export default function Schedule() {
  const [activeTab, setActiveTab] = useState<TabType>('bracket');
  const [matches, setMatches] = useState<DisplayMatch[]>(placeholderMatches);

  useEffect(() => {
    matchApi.getAll('seasonId=7')
      .then((data: any[]) => {
        if (data && data.length > 0) {
          const mapped: DisplayMatch[] = data.map((m: any) => ({
            id: m.id,
            round: m.round ? `第${m.round}轮` : '小组赛',
            teamA: m.team1?.name || '未知',
            teamB: m.team2?.name || '未知',
            scoreA: m.team1Score ?? 0,
            scoreB: m.team2Score ?? 0,
            status: m.status || 'upcoming',
            scheduledAt: m.scheduledAt || '',
          }));
          setMatches(mapped);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-purple mb-3">
          赛程积分
        </h1>
        <p className="text-gray-400">S7 海克斯大乱斗战术探讨 · 对阵与排名</p>
      </motion.div>

      <div className="flex justify-center gap-2 mb-8">
        <button
          onClick={() => setActiveTab('bracket')}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all',
            activeTab === 'bracket'
              ? 'bg-hex-purple/20 text-hex-cyan border border-hex-purple/50'
              : 'bg-hex-card border border-hex-border text-gray-400 hover:text-white'
          )}
        >
          <Swords size={16} />
          对阵图
        </button>
        <button
          onClick={() => setActiveTab('standings')}
          className={cn(
            'flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all',
            activeTab === 'standings'
              ? 'bg-hex-purple/20 text-hex-cyan border border-hex-purple/50'
              : 'bg-hex-card border border-hex-border text-gray-400 hover:text-white'
          )}
        >
          <Trophy size={16} />
          积分榜
        </button>
      </div>

      {activeTab === 'bracket' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {['小组赛', '淘汰赛', '决赛'].map((round) => {
            const roundMatches = matches.filter((m) => m.round === round);
            if (roundMatches.length === 0) {
              return (
                <div key={round} className="mb-6">
                  <h3 className="font-orbitron text-lg font-bold text-hex-gold mb-4">{round}</h3>
                  <GlowCard>
                    <p className="text-gray-500 text-center py-4">暂无比赛安排</p>
                  </GlowCard>
                </div>
              );
            }
            return (
              <div key={round} className="mb-6">
                <h3 className="font-orbitron text-lg font-bold text-hex-gold mb-4">{round}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {roundMatches.map((match) => (
                    <GlowCard key={match.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 text-right pr-3">
                          <p className={cn(
                            'font-bold',
                            match.scoreA > match.scoreB ? 'text-hex-gold' : 'text-white'
                          )}>
                            {match.teamA}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 px-3">
                          <span className={cn(
                            'font-orbitron text-xl font-bold',
                            match.scoreA > match.scoreB ? 'text-hex-gold' : 'text-gray-400'
                          )}>
                            {match.scoreA}
                          </span>
                          <span className="text-gray-600">:</span>
                          <span className={cn(
                            'font-orbitron text-xl font-bold',
                            match.scoreB > match.scoreA ? 'text-hex-gold' : 'text-gray-400'
                          )}>
                            {match.scoreB}
                          </span>
                        </div>
                        <div className="flex-1 text-left pl-3">
                          <p className={cn(
                            'font-bold',
                            match.scoreB > match.scoreA ? 'text-hex-gold' : 'text-white'
                          )}>
                            {match.teamB}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-center mt-2">
                        <StatusBadge status={match.status} />
                      </div>
                    </GlowCard>
                  ))}
                </div>
              </div>
            );
          })}

          {matches.length === 0 && (
            <GlowCard>
              <p className="text-gray-500 text-center py-4">暂无比赛安排</p>
            </GlowCard>
          )}
        </motion.div>
      )}

      {activeTab === 'standings' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlowCard className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-hex-border">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">排名</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">战队</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">胜</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">负</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">积分</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">净胜场</th>
                  </tr>
                </thead>
                <tbody>
                  {placeholderStandings.map((row, i) => (
                    <tr
                      key={row.team}
                      className="border-b border-hex-border/50 hover:bg-hex-purple/5 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <span className={cn(
                          'font-orbitron font-bold',
                          i === 0 ? 'text-hex-gold' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-amber-600' : 'text-gray-500'
                        )}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold text-white">{row.team}</td>
                      <td className="px-4 py-3 text-center text-green-400">{row.wins}</td>
                      <td className="px-4 py-3 text-center text-red-400">{row.losses}</td>
                      <td className="px-4 py-3 text-center font-bold text-hex-cyan">{row.points}</td>
                      <td className={cn(
                        'px-4 py-3 text-center font-medium',
                        row.diff > 0 ? 'text-green-400' : row.diff < 0 ? 'text-red-400' : 'text-gray-400'
                      )}>
                        {row.diff > 0 ? `+${row.diff}` : row.diff}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlowCard>
        </motion.div>
      )}
    </div>
  );
}
