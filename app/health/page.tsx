'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCcw } from 'lucide-react'

interface CheckResult {
  status: 'ok' | 'warning' | 'error' | 'unknown'
  details: string
}

interface HealthData {
  timestamp: string
  environment: string
  overall: string
  checks: {
    supabase: CheckResult
    claude_api: CheckResult
    smtp: CheckResult
  }
}

export default function HealthCheckPage() {
  const [loading, setLoading] = useState(true)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      setHealth(data)
    } catch (err: any) {
      setError(err.message || '无法连接到服务器')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ok':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">正常</Badge>
      case 'warning':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">警告</Badge>
      case 'error':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">错误</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">系统健康检查</h1>
        <p className="text-gray-600 mt-2">
          检查所有服务配置和连接状态
        </p>
      </div>

      {loading && !health && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
              <p className="text-gray-600">正在检查系统状态...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6">
            <div className="flex items-center space-x-3">
              <XCircle className="w-6 h-6 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-900">检查失败</h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
            <Button
              onClick={fetchHealth}
              className="mt-4"
              variant="outline"
            >
              <RefreshCcw className="w-4 h-4 mr-2" />
              重试
            </Button>
          </CardContent>
        </Card>
      )}

      {health && (
        <>
          {/* 总体状态 */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>总体状态</CardTitle>
                  <CardDescription>
                    环境: {health.environment} | 检查时间: {new Date(health.timestamp).toLocaleString('zh-CN')}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-3">
                  {getStatusBadge(health.overall)}
                  <Button onClick={fetchHealth} variant="outline" size="sm">
                    <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* 各项检查 */}
          <div className="space-y-4">
            {/* Supabase */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(health.checks.supabase.status)}
                    <div>
                      <CardTitle className="text-lg">Supabase 数据库</CardTitle>
                      <CardDescription>{health.checks.supabase.details}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(health.checks.supabase.status)}
                </div>
              </CardHeader>
            </Card>

            {/* Claude API */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(health.checks.claude_api.status)}
                    <div>
                      <CardTitle className="text-lg">Claude API</CardTitle>
                      <CardDescription>{health.checks.claude_api.details}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(health.checks.claude_api.status)}
                </div>
              </CardHeader>
              {health.checks.claude_api.status === 'error' && (
                <CardContent>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 mb-2">常见问题排查：</h4>
                    <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                      <li>检查 ANTHROPIC_API_KEY 环境变量是否已设置</li>
                      <li>检查 API 密钥是否有效</li>
                      <li>检查 ANTHROPIC_BASE_URL 端点是否可访问</li>
                      <li>检查 API 配额是否已用尽</li>
                      <li>检查网络连接是否正常</li>
                    </ul>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* SMTP */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(health.checks.smtp.status)}
                    <div>
                      <CardTitle className="text-lg">SMTP 邮件服务</CardTitle>
                      <CardDescription>{health.checks.smtp.details}</CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(health.checks.smtp.status)}
                </div>
              </CardHeader>
            </Card>
          </div>

          {/* 操作建议 */}
          {health.overall !== 'ok' && (
            <Card className="mt-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">配置指南</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-blue-800">
                  <p className="font-semibold">如何修复配置问题：</p>

                  <div>
                    <p className="font-medium">1. Vercel 环境变量配置：</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>访问 Vercel 项目设置页面</li>
                      <li>进入 Settings → Environment Variables</li>
                      <li>确保以下变量已配置：
                        <ul className="ml-6 mt-1">
                          <li>NEXT_PUBLIC_SUPABASE_URL</li>
                          <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
                          <li>ANTHROPIC_API_KEY</li>
                          <li>ANTHROPIC_BASE_URL (如使用自定义端点)</li>
                        </ul>
                      </li>
                      <li>保存后需要重新部署项目</li>
                    </ul>
                  </div>

                  <div>
                    <p className="font-medium">2. 本地开发环境配置：</p>
                    <ul className="list-disc list-inside ml-4">
                      <li>复制 .env.local.example 为 .env.local</li>
                      <li>填入正确的配置值</li>
                      <li>重启开发服务器</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
