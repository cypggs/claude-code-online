import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-6">
            Claude Code Online
          </h1>
          <p className="text-2xl mb-4 text-purple-100">
            通过聊天界面使用 Fullstack Skill 能力
          </p>
          <p className="text-lg text-purple-200 max-w-3xl mx-auto">
            从需求到部署，全自动化构建您的 Web 应用。
            支持 Next.js、Flask、FastAPI 等多种框架，集成 Supabase 数据库和 Vercel 部署。
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-white">
            <div className="text-4xl mb-4">💬</div>
            <h3 className="text-xl font-bold mb-3">聊天式交互</h3>
            <p className="text-purple-100">
              像使用 ChatGPT 一样，通过自然语言描述您的需求，AI 自动理解并生成应用
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-white">
            <div className="text-4xl mb-4">🚀</div>
            <h3 className="text-xl font-bold mb-3">自动部署</h3>
            <p className="text-purple-100">
              自动创建 GitHub 仓库，部署到 Vercel，配置环境变量，一键完成全流程
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-8 text-white">
            <div className="text-4xl mb-4">📧</div>
            <h3 className="text-xl font-bold mb-3">邮件通知</h3>
            <p className="text-purple-100">
              部署完成后，将包含访问链接和 GitHub 仓库的完整报告发送到您的邮箱
            </p>
          </div>
        </div>

        {/* Workflow Steps */}
        <div className="max-w-4xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-10">
            工作流程
          </h2>
          <div className="space-y-4">
            {[
              { phase: 'Phase 1', title: '需求分析', desc: 'AI 理解您的需求，推荐技术栈' },
              { phase: 'Phase 2', title: '数据库设计', desc: '自动生成 Supabase 数据库表结构' },
              { phase: 'Phase 3', title: '代码开发', desc: '生成完整的应用代码（Next.js/Flask/Vue.js）' },
              { phase: 'Phase 4', title: 'Git & GitHub', desc: '初始化仓库并推送到 GitHub' },
              { phase: 'Phase 5', title: 'Vercel 部署', desc: '部署到生产环境并配置域名' },
              { phase: 'Phase 6', title: '完成交付', desc: '发送邮件通知，包含所有访问链接' },
            ].map((step, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-lg rounded-lg p-6 text-white flex items-center">
                <div className="w-20 h-20 rounded-full bg-purple-500 flex items-center justify-center mr-6 flex-shrink-0">
                  <span className="text-2xl font-bold">{index + 1}</span>
                </div>
                <div>
                  <div className="text-sm text-purple-200 mb-1">{step.phase}</div>
                  <h4 className="text-xl font-bold mb-1">{step.title}</h4>
                  <p className="text-purple-100">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="text-center">
          <Link
            href="/dashboard"
            className="inline-block bg-white text-purple-600 px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-50 transition-colors shadow-lg mr-4"
          >
            开始使用
          </Link>
          <Link
            href="/login"
            className="inline-block bg-purple-500/30 backdrop-blur-sm text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-purple-500/40 transition-colors"
          >
            登录
          </Link>
        </div>

        {/* Tech Stack */}
        <div className="mt-16 text-center text-white">
          <p className="text-sm text-purple-200 mb-3">支持的技术栈</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Next.js', 'Flask', 'FastAPI', 'Vue.js', 'Supabase', 'Vercel', 'GitHub', 'Tailwind CSS', 'TypeScript'].map(tech => (
              <span key={tech} className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
