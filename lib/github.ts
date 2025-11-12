import { Octokit } from '@octokit/rest'

export interface GitHubConfig {
  token: string
  username?: string
}

export interface CreateRepoOptions {
  name: string
  description: string
  private?: boolean
}

export class GitHubService {
  private octokit: Octokit
  private username?: string

  constructor(config: GitHubConfig) {
    this.octokit = new Octokit({
      auth: config.token,
    })
    this.username = config.username
  }

  /**
   * 获取用户名（从 token 获取）
   */
  async getUsername(): Promise<string> {
    if (this.username) {
      return this.username
    }

    const { data } = await this.octokit.users.getAuthenticated()
    this.username = data.login
    return this.username
  }

  /**
   * 创建 GitHub 仓库
   */
  async createRepository(options: CreateRepoOptions): Promise<string> {
    const { data } = await this.octokit.repos.createForAuthenticatedUser({
      name: options.name,
      description: options.description,
      private: options.private || false,
      auto_init: false,
    })

    return data.html_url
  }

  /**
   * 检查仓库是否存在
   */
  async repositoryExists(repoName: string): Promise<boolean> {
    try {
      const username = await this.getUsername()
      await this.octokit.repos.get({
        owner: username,
        repo: repoName,
      })
      return true
    } catch (error: any) {
      if (error.status === 404) {
        return false
      }
      throw error
    }
  }

  /**
   * 获取仓库信息
   */
  async getRepository(repoName: string) {
    const username = await this.getUsername()
    const { data } = await this.octokit.repos.get({
      owner: username,
      repo: repoName,
    })
    return data
  }

  /**
   * 删除仓库（谨慎使用）
   */
  async deleteRepository(repoName: string): Promise<void> {
    const username = await this.getUsername()
    await this.octokit.repos.delete({
      owner: username,
      repo: repoName,
    })
  }

  /**
   * 生成用于 Git 推送的 URL
   */
  async getRemoteUrl(repoName: string): Promise<string> {
    const username = await this.getUsername()
    const token = this.octokit.auth
    return `https://${token}@github.com/${username}/${repoName}.git`
  }
}

/**
 * 创建 GitHub 服务实例
 */
export function createGitHubService(token: string, username?: string): GitHubService {
  return new GitHubService({ token, username })
}
