import { createClient } from '@/lib/supabase/server'
import { createDeploymentEngine } from '@/lib/deployment-engine'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { requirement } = body

    if (!requirement) {
      return NextResponse.json(
        { error: 'Requirement is required' },
        { status: 400 }
      )
    }

    // 检查用户配额
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profile) {
      // 重置每日计数（如果是新的一天）
      const today = new Date().toISOString().split('T')[0]
      const lastRequestDate = profile.last_request_date
        ? new Date(profile.last_request_date).toISOString().split('T')[0]
        : null

      if (lastRequestDate !== today) {
        await supabase
          .from('user_profiles')
          .update({
            daily_request_count: 0,
            last_request_date: today,
          })
          .eq('user_id', user.id)

        profile.daily_request_count = 0
      }

      // 检查配额
      if (profile.daily_request_count >= profile.daily_request_limit) {
        return NextResponse.json(
          { error: '今日配额已用完，请明天再试' },
          { status: 429 }
        )
      }
    }

    // 获取用户凭证
    const { data: credentials, error: credError } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (credError || !credentials) {
      return NextResponse.json(
        { error: '请先配置凭证' },
        { status: 400 }
      )
    }

    if (!credentials.github_token || !credentials.vercel_token) {
      return NextResponse.json(
        { error: 'GitHub 和 Vercel 凭证是必需的' },
        { status: 400 }
      )
    }

    // 创建项目记录
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: '生成中...',
        description: requirement,
        status: 'pending',
        framework: 'nextjs', // 默认值，稍后会更新
      })
      .select()
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { error: '创建项目失败' },
        { status: 500 }
      )
    }

    // 增加请求计数
    await supabase.rpc('increment_request_count', { p_user_id: user.id })

    // 创建任务队列
    const { data: task } = await supabase
      .from('task_queue')
      .insert({
        project_id: project.id,
        user_id: user.id,
        status: 'pending',
      })
      .select()
      .single()

    // 异步执行部署（在后台）
    // 注意：在生产环境中，应该使用队列系统（如 Bull、BullMQ）
    executeDeploymentAsync(
      {
        projectId: project.id,
        userId: user.id,
        userEmail: user.email!,
        requirement,
        credentials: {
          github_token: credentials.github_token,
          github_username: credentials.github_username,
          vercel_token: credentials.vercel_token,
          vercel_team_id: credentials.vercel_team_id,
          supabase_url: credentials.supabase_url,
          supabase_anon_key: credentials.supabase_anon_key,
        },
      },
      task.id
    )

    return NextResponse.json({
      success: true,
      project_id: project.id,
      task_id: task.id,
      message: '部署任务已创建，请稍候...',
    })
  } catch (error: any) {
    console.error('Deploy API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * 异步执行部署任务
 */
async function executeDeploymentAsync(context: any, taskId: string) {
  const supabase = await createClient()

  try {
    // 更新任务状态为处理中
    await supabase
      .from('task_queue')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', taskId)

    // 创建并执行部署引擎
    const engine = await createDeploymentEngine(context)
    const result = await engine.execute()

    // 更新任务状态
    await supabase
      .from('task_queue')
      .update({
        status: result.success ? 'completed' : 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  } catch (error: any) {
    console.error('Deployment execution error:', error)

    // 更新任务状态为失败
    await supabase
      .from('task_queue')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId)
  }
}
