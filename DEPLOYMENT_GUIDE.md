# 切换到 MiniMax M2 模型 - 配置指南

## ✅ 已完成的改进

### 1. 代码更新（已推送到 GitHub）
- ✅ 切换 AI 模型为 MiniMax M2
- ✅ 更新 API 端点为 `https://api.minimax.io/anthropic`
- ✅ 健康检查 API 不再暴露完整密钥（脱敏显示）
- ✅ 更新文档和配置示例

### 2. 安全改进
- ✅ API 密钥显示格式：`eyJhbGciOi...mcN98HA`（仅显示前10位和后8位）
- ✅ 诊断页面添加更多信息：模型名称、响应时间、端点地址

---

## 🔧 需要您完成的配置（重要！）

### 步骤 1: 访问 Vercel 项目设置

1. 访问：https://vercel.com/cypggs-projects/claude-code-online/settings/environment-variables

2. 或者通过以下路径：
   ```
   Vercel Dashboard →
   选择项目 "claude-code-online" →
   Settings →
   Environment Variables
   ```

### 步骤 2: 更新 ANTHROPIC_API_KEY

找到 `ANTHROPIC_API_KEY` 变量，点击 **Edit**：

**旧值（删除）：**
```
sk-nhCFEEzvmh8edb533urhb3Zroh9b2ULGxvuojd7Y
```

**新值（替换为）：**
```
eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiJlc2FjIHd1IiwiVXNlck5hbWUiOiJlc2FjIHd1IiwiQWNjb3VudCI6IiIsIlN1YmplY3RJRCI6IjE5ODU3MTk0MjE0Njg5NDI0MTEiLCJQaG9uZSI6IiIsIkdyb3VwSUQiOiIxOTg1NzE5MzgzMjUwNDQwMjY4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiY3lwZ2dzQGdtYWlsLmNvbSIsIkNyZWF0ZVRpbWUiOiIyMDI1LTExLTA5IDExOjE5OjA4IiwiVG9rZW5UeXBlIjoxLCJpc3MiOiJtaW5pbWF4In0.VTW4d3rSo4D5VpWPph6wS6aZiB8WaqYtLF5lpgXR5WV6rEhS8h0BVC3osmOeTDuYXb27kIy8AQK7cOmvv5sKkfDgadw9vqKqgZSuOKC0ZIJKszZ00RPu2uLMCfigKMRCSd72-tjQR-1weJqxA-WeRMsRgoYFqv-FDjmh0axMmzN-Cw_U_ZXsy3ICq4VqzZoNt-pvfrci5PfmY-Z43DC4qGQDlLYc6gG356aAsiYd_MKrhVfbeXnVsLd1GzJQMhXs4jV3UqsX5k-4k2yJYn9-Vf1XndSjIDHUl9qCUrrAKYUNC1zMSuosQoN2H0jUoWAPEwWcBG5Oe2bflPBmcN98HA
```

确保应用到所有环境：
- ✅ Production
- ✅ Preview
- ✅ Development

点击 **Save**。

### 步骤 3: 更新 ANTHROPIC_BASE_URL

找到 `ANTHROPIC_BASE_URL` 变量，点击 **Edit**：

**旧值（删除）：**
```
https://api5.ai
```

**新值（替换为）：**
```
https://api.minimax.io/anthropic
```

确保应用到所有环境，点击 **Save**。

### 步骤 4: 触发重新部署

有两种方式触发重新部署：

**方式 1: 通过 Vercel Dashboard（推荐）**
1. 进入 Deployments 页面
2. 点击最新部署右侧的 "..." 菜单
3. 选择 **Redeploy**
4. 确认 **Redeploy** 操作

**方式 2: 通过触发新的提交**
```bash
# 代码已经推送，Vercel 会自动部署
# 但因为环境变量未更新，所以会失败
# 更新环境变量后，点击 Redeploy 即可
```

---

## ✅ 验证配置

### 步骤 5: 检查部署状态

1. 等待部署完成（约 1-2 分钟）

2. 访问健康检查页面：
   ```
   https://claude-code-online.vercel.app/health
   ```

3. 查看检查结果：
   - ✅ Supabase 数据库 - 应该显示"正常"
   - ✅ Claude API - 应该显示"正常"，并显示：
     - 模型：MiniMax-M2
     - 端点：https://api.minimax.io/anthropic
     - 密钥：eyJhbGciOi...mcN98HA（脱敏显示）
   - ✅ SMTP 邮件服务 - 应该显示"正常"

### 步骤 6: 测试聊天功能

1. 访问聊天页面：
   ```
   https://claude-code-online.vercel.app/dashboard/chat
   ```

2. 发送测试消息：
   ```
   你好，请介绍一下你自己
   ```

3. 确认：
   - 消息能够发送
   - 收到流式响应（逐字显示）
   - 没有错误提示

---

## 📊 配置总结

| 环境变量 | 旧值 | 新值 | 状态 |
|---------|------|------|------|
| `ANTHROPIC_API_KEY` | `sk-nhCFEE...` | `eyJhbGciOi...mcN98HA` | ⏳ 待更新 |
| `ANTHROPIC_BASE_URL` | `https://api5.ai` | `https://api.minimax.io/anthropic` | ⏳ 待更新 |
| AI 模型 | `claude-sonnet-4-5-20250929` | `MiniMax-M2` | ✅ 已更新 |

---

## 🔍 常见问题排查

### 问题 1: 聊天一直显示"正在思考..."

**可能原因：**
- Vercel 环境变量未更新
- API 密钥无效
- 网络连接问题

**解决方法：**
1. 确认已更新 Vercel 环境变量
2. 确认已点击 Redeploy
3. 访问 `/health` 页面查看详细错误
4. 检查浏览器控制台是否有错误

### 问题 2: 健康检查显示 API 错误

**可能原因：**
- MiniMax API Token 已过期
- 端点配置错误
- API 配额已用尽

**解决方法：**
1. 检查 MiniMax 账户状态
2. 确认 Token 是否有效
3. 检查 API 配额使用情况

### 问题 3: 如何查看部署日志

1. 访问 Vercel 项目页面
2. 点击最新的 Deployment
3. 查看 **Build Logs** 和 **Function Logs**
4. 搜索关键词：`[Chat API]`、`error`、`failed`

---

## 📱 快速链接

- **生产环境**: https://claude-code-online.vercel.app
- **健康检查**: https://claude-code-online.vercel.app/health
- **Vercel 项目**: https://vercel.com/cypggs-projects/claude-code-online
- **GitHub 仓库**: https://github.com/cypggs/claude-code-online
- **环境变量设置**: https://vercel.com/cypggs-projects/claude-code-online/settings/environment-variables

---

## ✨ 下一步

更新完环境变量并重新部署后：

1. ✅ 验证健康检查通过
2. ✅ 测试聊天功能正常
3. ✅ 查看是否有部署日志错误
4. ✅ 如有问题，提供错误截图或日志

---

**生成时间**: 2025-11-15
**Git Commit**: 469530d
**状态**: ⏳ 等待环境变量更新
