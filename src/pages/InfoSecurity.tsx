import { motion } from 'framer-motion';
import { Shield, Eye, UserCheck, FileText, AlertCircle, Clock } from 'lucide-react';

const sections = [
  {
    icon: Shield,
    title: '一、总则',
    content: [
      '为加强本平台信息安全管理，规范信息发布和传播行为，保障用户合法权益，根据《中华人民共和国网络安全法》《互联网信息服务管理办法》《计算机信息网络国际联网安全保护管理办法》等法律法规，制定本制度。',
      '本制度适用于海克斯大乱斗战术探讨平台（以下简称"本平台"）的所有信息内容管理活动。',
      '本平台坚持正确的政治方向、舆论导向和价值取向，积极传播正能量，坚决抵制违法违规信息。',
    ],
  },
  {
    icon: UserCheck,
    title: '二、用户实名管理',
    content: [
      '根据《中华人民共和国网络安全法》第二十四条规定，本平台实行用户实名注册制度。',
      '用户注册时须提供真实的身份信息，包括用户名、邮箱等。',
      '本平台对用户信息严格保密，不得泄露、篡改或毁损用户个人信息。',
      '对拒绝提供真实身份信息的用户，本平台不予提供服务。',
    ],
  },
  {
    icon: Eye,
    title: '三、信息内容审核',
    content: [
      '本平台建立信息内容审核机制，对用户发布的信息进行实时巡查和审核。',
      '审核范围包括但不限于：用户发布的文字、图片、链接等内容。',
      '本平台采用人工审核与技术审核相结合的方式，确保审核的及时性和准确性。',
      '审核人员应经过专业培训，熟悉相关法律法规和审核标准。',
      '审核工作实行7×24小时值班制度，确保信息审核的及时性。',
    ],
  },
  {
    icon: AlertCircle,
    title: '四、禁止发布的信息',
    content: [
      '危害国家安全、泄露国家秘密、颠覆国家政权、破坏国家统一的信息。',
      '煽动民族仇恨、民族歧视，破坏民族团结的信息。',
      '破坏国家宗教政策，宣扬邪教和封建迷信的信息。',
      '散布谣言，扰乱社会秩序，破坏社会稳定的信息。',
      '散布淫秽、色情、赌博、暴力、凶杀、恐怖或者教唆犯罪的信息。',
      '侮辱或者诽谤他人，侵害他人合法权益的信息。',
      '含有虚假、有害、胁迫、侵害他人隐私、骚扰、中伤、粗俗或其他道德上令人反感的内容。',
      '含有法律、行政法规禁止的其他内容。',
    ],
  },
  {
    icon: FileText,
    title: '五、违法信息处置',
    content: [
      '发现违法信息后，本平台将立即采取措施，停止传输该信息，并采取消除等处置措施。',
      '对发布违法信息的用户，本平台将视情节轻重采取警告、限制功能、暂停服务、永久封号等处置措施。',
      '对涉嫌违法犯罪的信息，本平台将保存有关记录，并向有关主管部门报告。',
      '本平台建立违法信息处置台账，记录违法信息的发现、处置和报告情况。',
    ],
  },
  {
    icon: Clock,
    title: '六、应急响应',
    content: [
      '本平台建立信息安全应急响应机制，制定应急预案。',
      '发现重大信息安全事件时，应立即启动应急预案，采取有效措施控制事态发展。',
      '信息安全事件处置完毕后，应进行总结评估，完善应急预案。',
      '本平台保留信息安全事件的相关记录，保存期限不少于6个月。',
    ],
  },
  {
    icon: Shield,
    title: '七、举报受理',
    content: [
      '本平台设立不良信息举报渠道，接受用户和社会公众的举报。',
      '举报渠道包括：站内举报页面、微信公众号"海克斯大乱斗"留言反馈。',
      '本平台在收到举报后24小时内进行审核处理，并将处理结果反馈举报人。',
      '本平台依法保护举报人的个人信息，不会向被举报人透露举报人身份。',
    ],
  },
  {
    icon: UserCheck,
    title: '八、监督检查',
    content: [
      '本平台定期对信息内容管理工作进行自查，发现问题及时整改。',
      '本平台积极配合有关主管部门的监督检查，如实提供相关材料。',
      '本平台定期组织审核人员进行法律法规和业务培训，提高审核能力。',
      '本制度自发布之日起施行，由本平台负责解释和修订。',
    ],
  },
];

export default function InfoSecurity() {
  return (
    <div className="min-h-screen py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
      >
        <div className="text-center mb-10">
          <div className="w-14 h-14 bg-hex-gradient rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Shield size={24} className="text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-gradient-purple">信息安全管理制度</h1>
          <p className="text-gray-400 mt-2 text-sm">最后更新日期：2026年6月2日</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-hex-dark/50 border border-hex-border rounded-xl p-6"
              >
                <h2 className="text-lg font-bold text-hex-cyan mb-3 flex items-center gap-2">
                  <Icon size={18} />
                  {section.title}
                </h2>
                <ul className="space-y-2">
                  {section.content.map((item, i) => (
                    <li key={i} className="text-gray-300 text-sm leading-relaxed flex gap-2">
                      <span className="text-hex-purple mt-1 shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-10 text-center text-gray-500 text-xs space-y-1">
          <p>本制度依据《中华人民共和国网络安全法》《互联网信息服务管理办法》等法律法规制定</p>
          <p>海克斯大乱斗战术探讨平台 信息安全管理部门</p>
        </div>
      </motion.div>
    </div>
  );
}
