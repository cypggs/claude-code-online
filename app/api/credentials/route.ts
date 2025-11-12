import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('user_credentials')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // 返回凭证，但隐藏部分敏感信息（前端会完整显示）
    return NextResponse.json(data || {})
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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

    // 验证必填字段
    if (!body.github_token || !body.vercel_token) {
      return NextResponse.json(
        { error: 'GitHub Token 和 Vercel Token 是必填项' },
        { status: 400 }
      )
    }

    // 检查是否已存在凭证
    const { data: existing } = await supabase
      .from('user_credentials')
      .select('id')
      .eq('user_id', user.id)
      .single()

    let result

    if (existing) {
      // 更新现有凭证
      result = await supabase
        .from('user_credentials')
        .update({
          github_token: body.github_token,
          github_username: body.github_username,
          vercel_token: body.vercel_token,
          vercel_team_id: body.vercel_team_id,
          supabase_url: body.supabase_url,
          supabase_anon_key: body.supabase_anon_key,
          supabase_project_ref: body.supabase_project_ref,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
    } else {
      // 创建新凭证
      result = await supabase.from('user_credentials').insert({
        user_id: user.id,
        github_token: body.github_token,
        github_username: body.github_username,
        vercel_token: body.vercel_token,
        vercel_team_id: body.vercel_team_id,
        supabase_url: body.supabase_url,
        supabase_anon_key: body.supabase_anon_key,
        supabase_project_ref: body.supabase_project_ref,
      })
    }

    if (result.error) {
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving credentials:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
