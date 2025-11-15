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
- **AI**: Claude Sonnet 4.5 / MiniMax M2 (Custom Endpoint)
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

✅ **完整功能版本** - 所有核心功能已实现并部署

### ✅ 已完成功能

**Phase 1: 用户认证系统**
- [x] 用户注册和登录页面
- [x] Supabase Auth 集成
- [x] 邮箱验证
- [x] 认证中间件（路由保护）
- [x] 自动登出功能

**Phase 2: Dashboard 布局**
- [x] 响应式侧边栏导航
- [x] 顶部导航栏（用户信息显示）
- [x] Dashboard 主页（统计卡片）
- [x] 快速操作入口

**Phase 3: 凭证管理**
- [x] 凭证管理界面（GitHub, Vercel, Supabase）
- [x] 加密存储到数据库
- [x] 显示/隐藏敏感信息
- [x] API 路由（GET/POST）

**Phase 4: 聊天界面**
- [x] ChatGPT 风格的对话界面
- [x] 实时流式显示（SSE）
- [x] Markdown 渲染
- [x] 消息历史持久化
- [x] 对话管理

**Phase 5: Claude API 集成**
- [x] 流式聊天 API（SSE）
- [x] 对话历史跟踪
- [x] 消息存储到数据库
- [x] 错误处理和重试

**Phase 6: Fullstack 部署引擎**
- [x] GitHub 服务（仓库创建、管理）
- [x] Vercel 服务（部署、环境变量）
- [x] 6 阶段部署工作流
- [x] 需求分析（AI 驱动）
- [x] 自动代码生成
- [x] 部署日志记录

**Phase 7: 任务队列系统**
- [x] 数据库队列实现
- [x] 异步任务执行
- [x] 状态跟踪和更新
- [x] 用户配额管理（每日限制）

**Phase 8: 项目管理**
- [x] 项目列表页面
- [x] 项目详情页面
- [x] 部署日志查看器
- [x] 实时状态更新
- [x] 链接到 GitHub 和 Vercel

**Phase 9: 生产部署**
- [x] 代码提交到 GitHub
- [x] 自动部署到 Vercel
- [x] 环境变量配置
- [x] SSL/HTTPS 启用

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
