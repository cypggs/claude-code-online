import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  MessageSquare,
  FolderGit2,
  Rocket,
  Clock,
} from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // 获取用户统计信息
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  const { count: projectCount } = await supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: pendingCount } = await supabase
    .from('task_queue')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)
    .eq('status', 'pending')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">欢迎回来！</h1>
        <p className="text-gray-600 mt-2">
          开始使用 Claude Code Online 创建您的下一个应用
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              今日剩余次数
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profile ? profile.daily_request_limit - profile.daily_request_count : 5}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              每日限额 {profile?.daily_request_limit || 5} 次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              项目总数
            </CardTitle>
            <FolderGit2 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              已创建的项目
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              队列中的任务
            </CardTitle>
            <Rocket className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
            <p className="text-xs text-gray-600 mt-1">
              等待处理
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <MessageSquare className="w-10 h-10 text-purple-600 mb-2" />
            <CardTitle>开始聊天</CardTitle>
            <CardDescription>
              通过自然语言描述您的需求，AI 将自动生成并部署应用
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/chat">
              <Button className="w-full">
                开始新对话
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <FolderGit2 className="w-10 h-10 text-blue-600 mb-2" />
            <CardTitle>查看项目</CardTitle>
            <CardDescription>
              查看您已创建的所有项目，包括部署状态和访问链接
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/projects">
              <Button variant="outline" className="w-full">
                查看所有项目
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* 入门提示 */}
      {projectCount === 0 && (
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle>🎉 开始您的第一个项目</CardTitle>
            <CardDescription className="text-gray-700">
              在开始之前，请确保已配置好您的凭证信息
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-gray-900">需要配置的凭证：</h4>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• GitHub Personal Access Token</li>
                <li>• Vercel Access Token</li>
                <li>• Supabase 项目凭证（可选）</li>
              </ul>
            </div>
            <Link href="/dashboard/credentials">
              <Button>
                配置凭证
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
