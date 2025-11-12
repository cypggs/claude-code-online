import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Github, CheckCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { notFound } from 'next/navigation'

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 获取项目信息
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user?.id)
    .single()

  if (!project) {
    notFound()
  }

  // 获取部署日志
  const { data: logs } = await supabase
    .from('deployment_logs')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: true })

  const getLogIcon = (logType: string) => {
    const icons: Record<string, any> = {
      info: Info,
      success: CheckCircle,
      error: XCircle,
      warning: AlertTriangle,
    }
    return icons[logType] || Info
  }

  const getLogColor = (logType: string) => {
    const colors: Record<string, string> = {
      info: 'text-blue-600',
      success: 'text-green-600',
      error: 'text-red-600',
      warning: 'text-yellow-600',
    }
    return colors[logType] || 'text-gray-600'
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
  }

  return (
    <div className="space-y-8">
      {/* 返回按钮 */}
      <div>
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回项目列表
          </Button>
        </Link>
      </div>

      {/* 项目信息卡片 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{project.name}</CardTitle>
              <CardDescription className="mt-2">
                {project.description}
              </CardDescription>
            </div>
            <Badge variant={project.status === 'success' ? 'outline' : 'secondary'}>
              {project.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 项目详情 */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">框架</p>
              <p className="font-medium">{project.framework}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">创建时间</p>
              <p className="font-medium">
                {new Date(project.created_at).toLocaleString('zh-CN')}
              </p>
            </div>
            {project.completed_at && (
              <div>
                <p className="text-sm text-gray-500">完成时间</p>
                <p className="font-medium">
                  {new Date(project.completed_at).toLocaleString('zh-CN')}
                </p>
              </div>
            )}
          </div>

          {/* 功能和技术栈 */}
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
            <div className="flex space-x-4 pt-4 border-t border-gray-200">
              {project.vercel_url && (
                <a
                  href={project.vercel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    访问应用
                  </Button>
                </a>
              )}
              {project.github_url && (
                <a
                  href={project.github_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">
                    <Github className="w-4 h-4 mr-2" />
                    查看代码
                  </Button>
                </a>
              )}
            </div>
          )}

          {/* 错误信息 */}
          {project.status === 'failed' && project.error_message && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">部署失败</h4>
              <p className="text-sm text-red-800">{project.error_message}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 部署日志 */}
      <Card>
        <CardHeader>
          <CardTitle>部署日志</CardTitle>
          <CardDescription>
            查看详细的部署过程和日志信息
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px] w-full rounded-lg border border-gray-200 bg-gray-50">
            <div className="p-4 space-y-2 font-mono text-sm">
              {logs && logs.length > 0 ? (
                logs.map((log: any, index: number) => {
                  const Icon = getLogIcon(log.log_type)
                  const colorClass = getLogColor(log.log_type)

                  return (
                    <div
                      key={index}
                      className={`flex items-start space-x-3 p-2 rounded ${
                        log.log_type === 'error'
                          ? 'bg-red-50'
                          : log.log_type === 'success'
                          ? 'bg-green-50'
                          : ''
                      }`}
                    >
                      <Icon className={`w-4 h-4 mt-0.5 ${colorClass}`} />
                      <div className="flex-1">
                        <span className="text-gray-500 mr-2">
                          [{formatTimestamp(log.created_at)}]
                        </span>
                        <span className="text-gray-600">[{log.phase}]</span>
                        <span className="ml-2 text-gray-900">{log.message}</span>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center text-gray-500 py-8">
                  暂无日志记录
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
