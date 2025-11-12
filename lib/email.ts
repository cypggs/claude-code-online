import nodemailer from 'nodemailer'

export const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // use SSL
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface DeploymentEmailData {
  recipientEmail: string
  projectName: string
  deploymentUrl: string
  githubUrl: string
  features: string[]
  techStack: string[]
}

export async function sendDeploymentEmail(data: DeploymentEmailData) {
  const {
    recipientEmail,
    projectName,
    deploymentUrl,
    githubUrl,
    features,
    techStack,
  } = data

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white !important; text-decoration: none; border-radius: 5px; margin: 10px 5px; }
        .feature-list { background: white; padding: 20px; border-radius: 5px; margin: 15px 0; }
        .tech-badge { display: inline-block; background: #e0e7ff; color: #667eea; padding: 5px 10px; border-radius: 3px; margin: 3px; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 项目部署成功！</h1>
          <p>${projectName}</p>
        </div>
        <div class="content">
          <h2>您的应用已成功部署</h2>
          <p>恭喜！您通过 Claude Code Online 创建的应用已成功部署到生产环境。</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${deploymentUrl}" class="button">🌐 访问应用</a>
            <a href="${githubUrl}" class="button">📦 查看代码</a>
          </div>

          <div class="feature-list">
            <h3>✨ 核心功能</h3>
            <ul>
              ${features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>

          <div class="feature-list">
            <h3>🛠 技术栈</h3>
            <div>
              ${techStack.map(t => `<span class="tech-badge">${t}</span>`).join('')}
            </div>
          </div>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">

          <p style="color: #666; font-size: 14px;">
            <strong>生产环境 URL:</strong> <a href="${deploymentUrl}">${deploymentUrl}</a><br>
            <strong>GitHub 仓库:</strong> <a href="${githubUrl}">${githubUrl}</a>
          </p>

          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            此邮件由 Claude Code Online 自动生成。<br>
            由 Claude 提供支持 - <a href="https://claude.com/claude-code">Claude Code</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `

  const textContent = `
🎉 项目部署成功！

项目名称: ${projectName}

您的应用已成功部署到生产环境。

访问链接:
- 生产环境: ${deploymentUrl}
- GitHub 仓库: ${githubUrl}

核心功能:
${features.map(f => `- ${f}`).join('\n')}

技术栈:
${techStack.join(', ')}

---
此邮件由 Claude Code Online 自动生成。
  `

  await emailTransporter.sendMail({
    from: process.env.SMTP_FROM,
    to: recipientEmail,
    subject: `🎉 ${projectName} 部署成功 - Claude Code Online`,
    text: textContent,
    html: htmlContent,
  })
}
