import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ExternalLink, Github, Calendar, CheckCircle, XCircle, Clock, Loader2 } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 获取用户的所有项目
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user?.id)
    .order('created_at', { ascending: false })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, {
      variant: 'default' | 'secondary' | 'destructive' | 'outline'
      icon: any
      label: string
    }> = {
      pending: { variant: 'secondary', icon: Clock, label: '等待中' },
      in_queue: { variant: 'secondary', icon: Clock, label: '队列中' },
      processing: { variant: 'default', icon: Loader2, label: '处理中' },
      deploying: { variant: 'default', icon: Loader2, label: '部署中' },
      success: { variant: 'outline', icon: CheckCircle, label: '成功' },
      failed: { variant: 'destructive', icon: XCircle, label: '失败' },
    }

    const config = variants[status] || variants.pending
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className="flex items-center space-x-1 w-fit">
        <Icon className={`w-3 h-3 ${status === 'processing' || status === 'deploying' ? 'animate-spin' : ''}`} />
        <span>{config.label}</span>
      </Badge>
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
          <p className="text-gray-600 mt-2">
            查看您创建的所有项目和部署状态
          </p>
        </div>
        <Link href="/dashboard/chat">
          <Button>
            创建新项目
          </Button>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <Card className="text-center py-12">
          <CardHeader>
            <CardTitle>还没有项目</CardTitle>
            <CardDescription>
              开始创建您的第一个项目吧！
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/chat">
              <Button>
                创建第一个项目
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {projects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center space-x-3">
                      <span>{project.name}</span>
                      {getStatusBadge(project.status)}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {project.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="secondary">{project.framework}</Badge>
                    <div className="flex items-center text-xs text-gray-500">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDate(project.created_at)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 功能列表 */}
                {project.features && project.features.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">功能：</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.features.map((feature: string, index: number) => (
                        <Badge key={index} variant="outline">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 技术栈 */}
                {project.tech_stack && project.tech_stack.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">技术栈：</h4>
                    <div className="flex flex-wrap gap-2">
                      {project.tech_stack.map((tech: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 链接 */}
                {project.status === 'success' && (
                  <div className="flex space-x-3 pt-2">
                    {project.vercel_url && (
                      <a
                        href={project.vercel_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-sm text-purple-600 hover:underline"
                      >
                        <ExternalLink className="w-4 h-4" />
                        <span>访问应用</span>
                      </a>
                    )}
                    {project.github_url && (
                      <a
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:underline"
                      >
                        <Github className="w-4 h-4" />
                        <span>查看代码</span>
                      </a>
                    )}
                  </div>
                )}

                {/* 错误信息 */}
                {project.status === 'failed' && project.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800">
                      <strong>错误：</strong> {project.error_message}
                    </p>
                  </div>
                )}

                {/* 查看详情按钮 */}
                <div className="pt-2 border-t border-gray-200">
                  <Link href={`/dashboard/projects/${project.id}`}>
                    <Button variant="outline" size="sm">
                      查看部署日志
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
