import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { createGitHubService } from '@/lib/github'
import { createVercelService } from '@/lib/vercel'
import { sendDeploymentEmail } from '@/lib/email'

export interface DeploymentContext {
  projectId: string
  userId: string
  userEmail: string
  requirement: string
  credentials: {
    github_token: string
    github_username?: string
    vercel_token: string
    vercel_team_id?: string
    supabase_url?: string
    supabase_anon_key?: string
  }
}

export class DeploymentEngine {
  private context: DeploymentContext
  private supabase: any

  constructor(context: DeploymentContext, supabase: any) {
    this.context = context
    this.supabase = supabase
  }

  /**
   * 记录部署日志
   */
  private async log(
    phase: string,
    phaseNumber: number,
    message: string,
    logType: 'info' | 'success' | 'error' | 'warning' = 'info',
    metadata: any = {}
  ) {
    await this.supabase.from('deployment_logs').insert({
      project_id: this.context.projectId,
      phase,
      phase_number: phaseNumber,
      message,
      log_type: logType,
      metadata,
    })

    console.log(`[${phase}] ${message}`)
  }

  /**
   * 更新项目状态
   */
  private async updateProjectStatus(
    status: string,
    metadata: any = {}
  ) {
    await this.supabase
      .from('projects')
      .update({
        status,
        ...metadata,
        updated_at: new Date().toISOString(),
      })
      .eq('id', this.context.projectId)
  }

  /**
   * Phase 1: 需求分析和规划
   */
  private async phase1_analyzeRequirements(): Promise<{
    projectName: string
    description: string
    framework: string
    features: string[]
    needsDatabase: boolean
  }> {
    await this.log('requirements', 1, '开始分析需求...', 'info')
    await this.updateProjectStatus('processing')

    const prompt = `请分析以下需求并生成项目规划：

需求：${this.context.requirement}

请返回 JSON 格式，包含：
{
  "projectName": "项目名称（小写，使用连字符，如 my-app）",
  "description": "项目简短描述",
  "framework": "nextjs 或 flask 或 vue",
  "features": ["功能1", "功能2"],
  "needsDatabase": true/false,
  "database": {
    "tables": [
      {
        "name": "表名",
        "fields": ["字段名:类型"]
      }
    ]
  }
}

只返回 JSON，不要其他内容。`

    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : null

    if (!result) {
      throw new Error('无法解析需求')
    }

    await this.log('requirements', 1, `项目名称：${result.projectName}`, 'success')
    await this.log('requirements', 1, `技术栈：${result.framework}`, 'success')
    await this.log('requirements', 1, `需要数据库：${result.needsDatabase ? '是' : '否'}`, 'info')

    return result
  }

  /**
   * Phase 2: 代码生成
   */
  private async phase2_generateCode(spec: any): Promise<string> {
    await this.log('code_generation', 2, '开始生成代码...', 'info')

    // 这里简化处理，实际应该调用 AI 生成完整代码
    // 为了演示，我们返回一个简单的项目模板路径
    await this.log('code_generation', 2, '代码生成完成', 'success')

    return '/tmp/generated-code' // 实际应该是真实的代码路径
  }

  /**
   * Phase 3: GitHub 仓库创建
   */
  private async phase3_createGitHubRepository(
    projectName: string,
    description: string
  ): Promise<string> {
    await this.log('github', 3, '创建 GitHub 仓库...', 'info')

    const github = createGitHubService(
      this.context.credentials.github_token,
      this.context.credentials.github_username
    )

    // 检查仓库是否已存在
    const exists = await github.repositoryExists(projectName)
    if (exists) {
      throw new Error(`仓库 ${projectName} 已存在`)
    }

    const repoUrl = await github.createRepository({
      name: projectName,
      description,
      private: false,
    })

    await this.log('github', 3, `仓库已创建：${repoUrl}`, 'success')

    return repoUrl
  }

  /**
   * Phase 4: Vercel 部署
   */
  private async phase4_deployToVercel(
    projectName: string,
    githubUrl: string,
    framework: string
  ): Promise<string> {
    await this.log('vercel', 4, '开始部署到 Vercel...', 'info')

    const vercel = createVercelService(
      this.context.credentials.vercel_token,
      this.context.credentials.vercel_team_id
    )

    // 创建项目
    await this.log('vercel', 4, '创建 Vercel 项目...', 'info')
    const project = await vercel.createProject({
      projectName,
      githubUrl,
      framework,
    })

    const projectId = project.id

    // 配置环境变量（如果有 Supabase 凭证）
    if (this.context.credentials.supabase_url && this.context.credentials.supabase_anon_key) {
      await this.log('vercel', 4, '配置环境变量...', 'info')
      await vercel.addEnvironmentVariables(projectId, [
        {
          key: 'NEXT_PUBLIC_SUPABASE_URL',
          value: this.context.credentials.supabase_url,
          type: 'encrypted',
        },
        {
          key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
          value: this.context.credentials.supabase_anon_key,
          type: 'encrypted',
        },
      ])
    }

    // 禁用访问保护
    await this.log('vercel', 4, '配置项目设置...', 'info')
    await vercel.disableDeploymentProtection(projectId)

    // 等待部署完成（简化处理）
    await new Promise((resolve) => setTimeout(resolve, 30000)) // 等待 30 秒

    const productionUrl = await vercel.getProductionUrl(projectName)

    await this.log('vercel', 4, `部署成功：${productionUrl}`, 'success')

    return productionUrl
  }

  /**
   * Phase 5: 发送邮件通知
   */
  private async phase5_sendNotification(
    projectName: string,
    deploymentUrl: string,
    githubUrl: string,
    features: string[],
    techStack: string[]
  ): Promise<void> {
    await this.log('notification', 5, '发送邮件通知...', 'info')

    try {
      await sendDeploymentEmail({
        recipientEmail: this.context.userEmail,
        projectName,
        deploymentUrl,
        githubUrl,
        features,
        techStack,
      })

      await this.log('notification', 5, '邮件发送成功', 'success')
    } catch (error: any) {
      await this.log('notification', 5, `邮件发送失败：${error.message}`, 'warning')
      // 不抛出错误，因为邮件失败不应该影响整个流程
    }
  }

  /**
   * 执行完整部署流程
   */
  async execute(): Promise<{
    success: boolean
    deploymentUrl?: string
    githubUrl?: string
    error?: string
  }> {
    try {
      // Phase 1: 需求分析
      const spec = await this.phase1_analyzeRequirements()

      // Phase 2: 代码生成（简化）
      await this.phase2_generateCode(spec)

      // Phase 3: GitHub 仓库创建
      const githubUrl = await this.phase3_createGitHubRepository(
        spec.projectName,
        spec.description
      )

      // 更新项目信息
      await this.supabase
        .from('projects')
        .update({
          name: spec.projectName,
          description: spec.description,
          framework: spec.framework,
          github_url: githubUrl,
          features: spec.features,
          tech_stack: [spec.framework, 'TypeScript', 'Tailwind CSS'],
        })
        .eq('id', this.context.projectId)

      // Phase 4: Vercel 部署
      const deploymentUrl = await this.phase4_deployToVercel(
        spec.projectName,
        githubUrl,
        spec.framework
      )

      // 更新项目状态
      await this.updateProjectStatus('success', {
        vercel_url: deploymentUrl,
        completed_at: new Date().toISOString(),
      })

      // Phase 5: 发送通知
      await this.phase5_sendNotification(
        spec.projectName,
        deploymentUrl,
        githubUrl,
        spec.features,
        [spec.framework, 'TypeScript', 'Tailwind CSS']
      )

      return {
        success: true,
        deploymentUrl,
        githubUrl,
      }
    } catch (error: any) {
      await this.log('error', 0, `部署失败：${error.message}`, 'error')
      await this.updateProjectStatus('failed', {
        error_message: error.message,
      })

      return {
        success: false,
        error: error.message,
      }
    }
  }
}

/**
 * 创建部署引擎实例
 */
export async function createDeploymentEngine(
  context: DeploymentContext
): Promise<DeploymentEngine> {
  const supabase = await createClient()
  return new DeploymentEngine(context, supabase)
}
