import { motion } from 'framer-motion';
import { Shield } from 'lucide-react';

const sections = [
  {
    title: '一、信息收集',
    content: [
      '我们收集您主动提供的信息，包括：用户名、邮箱地址、游戏ID、段位信息、联系方式及好友绑定信息。',
      '我们自动收集的信息包括：访问日志、浏览器类型、IP地址、访问时间及页面浏览记录。',
      '我们不会收集您的身份证号、银行卡号等敏感金融信息。',
      '根据《中华人民共和国网络安全法》《中华人民共和国个人信息保护法》《中华人民共和国数据安全法》的规定，我们在收集您的个人信息前，将明确告知收集的目的、方式和范围，并获取您的同意。',
    ],
  },
  {
    title: '二、信息使用',
    content: [
      '将您的报名信息用于赛事分组、赛程安排及成绩统计。',
      '通过邮箱或联系方式向您发送赛事通知、赛程变更等重要信息。',
      '用于赛事数据统计及匿名化的数据分析，以改善赛事体验。',
      '在您同意的情况下，将您的比赛成绩展示在名人堂等公开页面。',
      '我们仅会在实现服务目的所必需的最短时间内保留您的个人信息，超出必要期限后将及时删除或匿名化处理。',
    ],
  },
  {
    title: '三、信息存储与保护',
    content: [
      '您的数据存储在中华人民共和国境内的服务器上，符合《中华人民共和国网络安全法》关于数据本地化存储的要求。',
      '采用加密传输（HTTPS/TLS）和加密存储（密码哈希）等安全措施，防止数据在传输和存储过程中被未经授权的访问或篡改。',
      '我们使用 JWT 令牌进行身份验证，访问令牌有效期2小时，刷新令牌有效期30天。',
      '我们建立了数据安全管理制度，采取合理的技术措施和管理措施保护您的个人信息，防止未经授权的访问、使用、修改或泄露。',
      '数据库定期备份，确保数据安全性和可恢复性。',
      '如发生个人信息安全事件，我们将依法及时向您告知安全事件的基本情况、可能的影响、已采取或将要采取的处置措施及您可采取的减轻危害的措施。',
    ],
  },
  {
    title: '四、信息共享',
    content: [
      '未经您的同意，我们不会向任何第三方出售、出租或分享您的个人信息。',
      '以下情况除外：法律法规要求、司法机关或行政机关强制要求、保护本平台合法权益所必需。',
      '赛事相关数据（如队伍名称、比赛成绩）可能在赛事宣传中公开展示，但不包含个人联系方式。',
      '如需向第三方提供您的个人信息，我们将事先征得您的同意，并要求第三方采取同等水平的安全保护措施。',
    ],
  },
  {
    title: '五、Cookie 和本地存储',
    content: [
      '我们使用浏览器的 localStorage 存储登录令牌，以便您在访问期间保持登录状态。',
      '我们不使用第三方追踪 Cookie 或广告 Cookie。',
      '您可以通过清除浏览器数据来删除本地存储的信息。',
    ],
  },
  {
    title: '六、您的权利',
    content: [
      '您有权访问、更正、删除您的个人信息。可通过个人中心自行操作或联系管理员处理。',
      '您有权撤回授权同意，撤回后我们将停止处理您的相关信息，但不影响此前基于授权的处理活动。',
      '您有权注销账户，注销后您的个人信息将在30天内删除。',
      '您有权获取您的个人信息副本，我们将在收到请求后15个工作日内提供。',
      '您有权拒绝自动化决策，如对系统自动分组结果有异议，可联系管理员进行人工调整。',
    ],
  },
  {
    title: '七、未成年人保护',
    content: [
      '本平台面向英雄联盟游戏玩家，建议14周岁以上用户使用。',
      '若我们发现在未获监护人同意的情况下收集了未成年人的个人信息，将尽快删除相关信息。',
      '根据《中华人民共和国未成年人保护法》和《儿童个人信息网络保护规定》，我们不会主动收集不满14周岁未成年人的个人信息。',
    ],
  },
  {
    title: '八、信息跨境传输',
    content: [
      '您的个人信息存储在中华人民共和国境内，我们不会将您的个人信息传输至境外。',
      '如因业务需要确需向境外提供个人信息的，我们将严格按照《个人信息保护法》的规定，通过国家网信部门组织的安全评估，并取得您的单独同意。',
    ],
  },
  {
    title: '九、隐私政策更新',
    content: [
      '我们可能会适时修订本隐私政策，更新后的政策将在本页面发布。',
      '重大变更将通过站内通知或邮件方式告知您，并再次征得您的同意。',
      '继续使用本平台即视为同意修订后的隐私政策。',
    ],
  },
  {
    title: '十、联系我们',
    content: [
      '如您对本隐私政策有任何疑问、意见或建议，或需要行使您的个人信息权利，请通过以下方式联系我们：',
      '邮箱：通过微信公众号"海克斯大乱斗"留言反馈',
      '我们将在15个工作日内回复您的请求。',
    ],
  },
];

export default function PrivacyPolicy() {
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
          <h1 className="font-orbitron text-3xl font-bold text-gradient-purple">隐私政策</h1>
          <p className="text-gray-400 mt-2 text-sm">最后更新日期：2026年6月2日</p>
          <p className="text-gray-500 mt-1 text-xs">生效日期：2026年6月2日</p>
        </div>

        <div className="space-y-8">
          {sections.map((section, index) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-hex-dark/50 border border-hex-border rounded-xl p-6"
            >
              <h2 className="text-lg font-bold text-hex-cyan mb-3">{section.title}</h2>
              <ul className="space-y-2">
                {section.content.map((item, i) => (
                  <li key={i} className="text-gray-300 text-sm leading-relaxed flex gap-2">
                    <span className="text-hex-purple mt-1 shrink-0">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 text-center text-gray-500 text-xs space-y-1">
          <p>本隐私政策适用于海克斯大乱斗战术探讨赛事官方网站（以下简称"本平台"）提供的所有服务</p>
          <p>本政策依据《中华人民共和国网络安全法》《中华人民共和国个人信息保护法》《中华人民共和国数据安全法》制定</p>
        </div>
      </motion.div>
    </div>
  );
}
