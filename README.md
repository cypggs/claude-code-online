# Claude Code Online

🚀 **通过 Web 界面使用 Claude Code 的 Fullstack Skill 能力**

##项目简介

Claude Code Online 是一个在线平台，让用户可以通过聊天界面使用 Claude Code 的 fullstack-deploy skill 能力。从需求描述到生产环境部署，完全自动化。

## 核心功能

- 💬 **聊天式交互** - 自然语言描述需求，AI 自动理解并生成应用
- 🤖 **智能代码生成** - 支持 Next.js、Flask、FastAPI、Vue.js 等多种框架
- 📊 **数据库自动化** - 自动生成 Supabase 数据库表结构和 RLS 策略
- 📦 **GitHub 集成** - 自动创建仓库并推送代码
- 🚀 **一键部署** - 自动部署到 Vercel 并配置环境变量
- 📧 **邮件通知** - 部署完成后发送包含访问链接的完整报告

## 技术栈

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **AI**: Claude Sonnet 4.5 (Custom Endpoint)
- **Email**: Nodemailer (企业微信 SMTP)
- **Deployment**: Vercel

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 到 `.env.local`：

```bash
cp .env.local.example .env.local
```

填写必要的配置信息：
- Supabase URL 和 Anon Key
- Claude API Key (已提供默认值)
- SMTP 邮箱配置 (已提供默认值)

### 3. 设置数据库

1. 在 Supabase 创建新项目
2. 在 SQL Editor 中执行根目录的 `database.sql`
3. 确认所有表已创建成功

### 4. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 工作流程 (6 Phases)

1. **Phase 1: 需求分析** - AI 理解需求，选择技术栈
2. **Phase 2: 数据库设计** - 生成 Supabase SQL schema
3. **Phase 3: 代码开发** - 生成完整应用代码
4. **Phase 4: Git & GitHub** - 创建仓库并推送代码
5. **Phase 5: Vercel 部署** - 部署到生产环境
6. **Phase 6: 完成交付** - 发送邮件通知

## 项目状态

🚧 **MVP 版本** - 核心架构已完成

### ✅ 已完成
- [x] 项目架构设计
- [x] 数据库设计 (完整的 schema)
- [x] 精美的主页面
- [x] 核心配置文件 (Supabase, Claude, Email)

### 🚧 开发中
- [ ] 用户认证页面
- [ ] 聊天界面组件
- [ ] Fullstack Skill 执行引擎
- [ ] 任务队列系统

## 部署到 Vercel

```bash
# 使用 Vercel CLI
vercel --prod
```

或者：
1. 推送到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 自动部署

## 数据库设计

主要表结构：
- `user_credentials` - 用户的第三方服务凭证 (加密存储)
- `projects` - 项目记录
- `deployment_logs` - 部署日志
- `task_queue` - 任务队列
- `conversations` - 聊天对话
- `messages` - 聊天消息
- `user_profiles` - 用户配置和使用限制

所有表都启用了 Row Level Security (RLS)。

## 安全特性

✅ Row Level Security (RLS)
✅ 凭证加密存储
✅ 每日请求限制
✅ 队列排队机制
✅ 输入验证

## 许可证

MIT License

---

🤖 **Generated with Claude Code** - https://claude.com/claude-code

Co-Authored-By: Claude <noreply@anthropic.com>
