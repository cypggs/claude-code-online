import { NextResponse } from 'next/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 健康检查和诊断 API
 * 用于验证所有服务配置是否正确
 */
export async function GET() {
  const checks: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {
      supabase: { status: 'unknown', details: '' },
      claude_api: { status: 'unknown', details: '' },
      smtp: { status: 'unknown', details: '' },
    },
  }

  // 1. 检查 Supabase 配置
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      checks.checks.supabase = {
        status: 'error',
        details: '缺少 NEXT_PUBLIC_SUPABASE_URL 或 NEXT_PUBLIC_SUPABASE_ANON_KEY',
      }
    } else {
      const supabase = await createClient()
      const { data, error } = await supabase.from('user_profiles').select('count').limit(1)

      if (error) {
        checks.checks.supabase = {
          status: 'error',
          details: `数据库查询失败: ${error.message}`,
        }
      } else {
        checks.checks.supabase = {
          status: 'ok',
          details: '数据库连接正常',
        }
      }
    }
  } catch (error: any) {
    checks.checks.supabase = {
      status: 'error',
      details: error.message,
    }
  }

  // 2. 检查 Claude API 配置
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY
    const baseURL = process.env.ANTHROPIC_BASE_URL

    if (!apiKey) {
      checks.checks.claude_api = {
        status: 'error',
        details: '缺少 ANTHROPIC_API_KEY 环境变量',
      }
    } else {
      // 发送测试请求
      const startTime = Date.now()

      // 隐藏完整密钥，只显示前后几位
      const maskedKey = apiKey.length > 20
        ? `${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 8)}`
        : '***'

      const stream = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 10,
        messages: [
          {
            role: 'user',
            content: 'Hi',
          },
        ],
        stream: true,
      })

      let responseReceived = false

      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          responseReceived = true
          break
        }
      }

      const duration = Date.now() - startTime

      if (responseReceived) {
        checks.checks.claude_api = {
          status: 'ok',
          details: `API 连接正常 | 模型: ${CLAUDE_MODEL} | 响应时间: ${duration}ms | 端点: ${baseURL || 'https://api.anthropic.com'} | 密钥: ${maskedKey}`,
        }
      } else {
        checks.checks.claude_api = {
          status: 'warning',
          details: 'API 响应异常，未收到内容',
        }
      }
    }
  } catch (error: any) {
    checks.checks.claude_api = {
      status: 'error',
      details: `${error.message || 'API 调用失败'}${error.status ? ` (HTTP ${error.status})` : ''}`,
    }
  }

  // 3. 检查 SMTP 配置
  try {
    const smtpHost = process.env.SMTP_HOST
    const smtpPort = process.env.SMTP_PORT
    const smtpUser = process.env.SMTP_USER
    const smtpPass = process.env.SMTP_PASS

    if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
      checks.checks.smtp = {
        status: 'warning',
        details: '部分 SMTP 配置缺失（非关键功能）',
      }
    } else {
      checks.checks.smtp = {
        status: 'ok',
        details: `SMTP 已配置: ${smtpHost}:${smtpPort}`,
      }
    }
  } catch (error: any) {
    checks.checks.smtp = {
      status: 'warning',
      details: error.message,
    }
  }

  // 计算总体状态
  const statuses = Object.values(checks.checks).map((c: any) => c.status)
  const overallStatus =
    statuses.includes('error') ? 'error' :
    statuses.includes('warning') ? 'warning' : 'ok'

  checks.overall = overallStatus

  return NextResponse.json(checks, { status: overallStatus === 'ok' ? 200 : 500 })
}
