import axios from 'axios'

export interface VercelConfig {
  token: string
  teamId?: string
}

export interface DeploymentOptions {
  projectName: string
  githubUrl: string
  framework?: string
}

export interface EnvironmentVariable {
  key: string
  value: string
  target?: ('production' | 'preview' | 'development')[]
  type?: 'plain' | 'encrypted'
}

export class VercelService {
  private token: string
  private teamId?: string
  private baseUrl = 'https://api.vercel.com'

  constructor(config: VercelConfig) {
    this.token = config.token
    this.teamId = config.teamId
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    }
  }

  private getTeamQuery() {
    return this.teamId ? `?teamId=${this.teamId}` : ''
  }

  /**
   * 创建项目
   */
  async createProject(options: DeploymentOptions): Promise<any> {
    const url = `${this.baseUrl}/v9/projects${this.getTeamQuery()}`

    // 从 GitHub URL 提取仓库信息
    const repoMatch = options.githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (!repoMatch) {
      throw new Error('Invalid GitHub URL')
    }

    const [, org, repo] = repoMatch
    const cleanRepo = repo.replace('.git', '')

    const { data } = await axios.post(
      url,
      {
        name: options.projectName,
        framework: options.framework || 'nextjs',
        gitRepository: {
          type: 'github',
          repo: `${org}/${cleanRepo}`,
        },
      },
      { headers: this.getHeaders() }
    )

    return data
  }

  /**
   * 获取项目信息
   */
  async getProject(projectName: string): Promise<any> {
    const url = `${this.baseUrl}/v9/projects/${projectName}${this.getTeamQuery()}`
    const { data } = await axios.get(url, { headers: this.getHeaders() })
    return data
  }

  /**
   * 获取项目 ID
   */
  async getProjectId(projectName: string): Promise<string> {
    const project = await this.getProject(projectName)
    return project.id
  }

  /**
   * 添加环境变量
   */
  async addEnvironmentVariable(
    projectId: string,
    envVar: EnvironmentVariable
  ): Promise<any> {
    const url = `${this.baseUrl}/v10/projects/${projectId}/env${this.getTeamQuery()}`
    const { data } = await axios.post(
      url,
      {
        key: envVar.key,
        value: envVar.value,
        type: envVar.type || 'encrypted',
        target: envVar.target || ['production', 'preview', 'development'],
      },
      { headers: this.getHeaders() }
    )
    return data
  }

  /**
   * 批量添加环境变量
   */
  async addEnvironmentVariables(
    projectId: string,
    envVars: EnvironmentVariable[]
  ): Promise<void> {
    for (const envVar of envVars) {
      await this.addEnvironmentVariable(projectId, envVar)
    }
  }

  /**
   * 触发重新部署
   */
  async redeploy(projectName: string): Promise<any> {
    const url = `${this.baseUrl}/v13/deployments${this.getTeamQuery()}`
    const { data } = await axios.post(
      url,
      {
        name: projectName,
        target: 'production',
      },
      { headers: this.getHeaders() }
    )
    return data
  }

  /**
   * 禁用部署保护
   */
  async disableDeploymentProtection(projectId: string): Promise<any> {
    const url = `${this.baseUrl}/v9/projects/${projectId}${this.getTeamQuery()}`
    const { data } = await axios.patch(
      url,
      {
        ssoProtection: null,
        passwordProtection: null,
      },
      { headers: this.getHeaders() }
    )
    return data
  }

  /**
   * 获取部署信息
   */
  async getDeployment(deploymentId: string): Promise<any> {
    const url = `${this.baseUrl}/v13/deployments/${deploymentId}${this.getTeamQuery()}`
    const { data } = await axios.get(url, { headers: this.getHeaders() })
    return data
  }

  /**
   * 获取项目部署列表
   */
  async getDeployments(projectId: string): Promise<any> {
    const url = `${this.baseUrl}/v6/deployments${this.getTeamQuery()}&projectId=${projectId}`
    const { data } = await axios.get(url, { headers: this.getHeaders() })
    return data.deployments
  }

  /**
   * 获取生产环境 URL
   */
  async getProductionUrl(projectName: string): Promise<string> {
    const project = await this.getProject(projectName)
    if (project.targets && project.targets.production) {
      return `https://${project.targets.production.url}`
    }
    return `https://${projectName}.vercel.app`
  }
}

/**
 * 创建 Vercel 服务实例
 */
export function createVercelService(token: string, teamId?: string): VercelService {
  return new VercelService({ token, teamId })
}
