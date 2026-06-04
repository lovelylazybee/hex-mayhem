import { useEffect, useState } from 'react';
import { Calendar, AlertCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import GlowCard from '@/components/GlowCard';
import { contentApi } from '@/lib/api';

const defaultTimeline = [
  { date: '2026-05-20', event: '报名开始', desc: 'S7赛季报名通道开放' },
  { date: '2026-06-10', event: '报名截止', desc: '报名通道关闭，不再接受新报名' },
  { date: '2026-06-12', event: '抽签仪式', desc: '海克斯抽签分队，确定对阵' },
  { date: '2026-06-15', event: '小组赛开始', desc: '小组循环赛正式开打' },
  { date: '2026-06-28', event: '淘汰赛', desc: '小组出线队伍进入淘汰赛' },
  { date: '2026-07-15', event: '总决赛', desc: 'S7赛季总决赛，冠军诞生' },
];

const defaultRules = [
  { title: '比赛模式', content: 'ARAM（大乱斗）模式，5v5对抗' },
  { title: '参赛资格', content: '所有召唤师均可报名，每人限报一次' },
  { title: '分队规则', content: '系统随机分队，确保段位均衡' },
  { title: '比赛赛制', content: '小组循环赛 + 淘汰赛，具体赛制视报名人数调整' },
  { title: '符文系统', content: '海克斯抽卡获取符文加成，影响比赛' },
  { title: '违规处理', content: '代打、挂机等行为将取消参赛资格' },
];

export default function Rules() {
  const [rules, setRules] = useState(defaultRules);
  const [timeline, setTimeline] = useState(defaultTimeline);

  useEffect(() => {
    contentApi.get('rules').then((data) => {
      if (data?.rules) setRules(data.rules);
      if (data?.timeline) setTimeline(data.timeline);
    }).catch(() => {});
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h1 className="font-orbitron text-4xl font-bold text-gradient-purple mb-3">
          赛制公告
        </h1>
        <p className="text-gray-400">S7 海克斯大乱斗战术探讨 · 完整赛制说明</p>
      </motion.div>

      <section className="mb-12">
        <h2 className="flex items-center gap-2 font-orbitron text-xl font-bold text-hex-cyan mb-6">
          <AlertCircle size={20} />
          比赛规则
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {rules.map((rule, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <GlowCard>
                <h3 className="text-hex-gold font-bold mb-2">{rule.title}</h3>
                <p className="text-gray-400 text-sm">{rule.content}</p>
              </GlowCard>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="flex items-center gap-2 font-orbitron text-xl font-bold text-hex-cyan mb-6">
          <Clock size={20} />
          赛事时间线
        </h2>
        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-hex-purple/30" />
          {timeline.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={`relative flex items-center mb-6 ${
                i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
              }`}
            >
              <div className="absolute left-4 md:left-1/2 w-3 h-3 bg-hex-purple rounded-full -translate-x-1.5 border-2 border-hex-dark z-10" />
              <div className={`ml-10 md:ml-0 md:w-1/2 ${i % 2 === 0 ? 'md:pr-8' : 'md:pl-8'}`}>
                <GlowCard>
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar size={14} className="text-hex-gold" />
                    <span className="text-hex-gold text-sm font-medium">{t.date}</span>
                  </div>
                  <h3 className="text-white font-bold">{t.event}</h3>
                  <p className="text-gray-400 text-sm">{t.desc}</p>
                </GlowCard>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

    </div>
  );
}
