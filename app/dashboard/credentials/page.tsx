'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Eye, EyeOff, Save, Check } from 'lucide-react'

interface Credentials {
  github_token?: string
  github_username?: string
  vercel_token?: string
  vercel_team_id?: string
  supabase_url?: string
  supabase_anon_key?: string
  supabase_project_ref?: string
}

export default function CredentialsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [credentials, setCredentials] = useState<Credentials>({})
  const [showTokens, setShowTokens] = useState({
    github: false,
    vercel: false,
    supabase_key: false,
  })

  // 加载现有凭证
  useEffect(() => {
    fetchCredentials()
  }, [])

  const fetchCredentials = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/credentials')
      if (response.ok) {
        const data = await response.json()
        setCredentials(data)
      }
    } catch (error) {
      console.error('Failed to fetch credentials:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      if (response.ok) {
        toast.success('凭证已保存')
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.message || '保存失败')
      }
    } catch (error) {
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const maskToken = (token?: string) => {
    if (!token) return ''
    if (token.length <= 8) return '••••••••'
    return token.slice(0, 4) + '••••••••' + token.slice(-4)
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">凭证设置</h1>
        <p className="text-gray-600 mt-2">
          配置第三方服务凭证以使用自动部署功能
        </p>
      </div>

      {/* GitHub 凭证 */}
      <Card>
        <CardHeader>
          <CardTitle>GitHub 凭证</CardTitle>
          <CardDescription>
            用于创建仓库和推送代码。需要 <code className="bg-gray-100 px-1 rounded">repo</code> 和 <code className="bg-gray-100 px-1 rounded">workflow</code> 权限
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Personal Access Token
            </label>
            <div className="relative">
              <Input
                type={showTokens.github ? 'text' : 'password'}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                value={credentials.github_token || ''}
                onChange={(e) =>
                  setCredentials({ ...credentials, github_token: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() =>
                  setShowTokens({ ...showTokens, github: !showTokens.github })
                }
              >
                {showTokens.github ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              在 <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">GitHub Settings</a> 创建
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              GitHub Username（可选）
            </label>
            <Input
              placeholder="your-username"
              value={credentials.github_username || ''}
              onChange={(e) =>
                setCredentials({ ...credentials, github_username: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              如果留空，将从 token 自动获取
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Vercel 凭证 */}
      <Card>
        <CardHeader>
          <CardTitle>Vercel 凭证</CardTitle>
          <CardDescription>
            用于自动部署到 Vercel 平台
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Access Token
            </label>
            <div className="relative">
              <Input
                type={showTokens.vercel ? 'text' : 'password'}
                placeholder="xxxxxxxxxxxxxxxxxxxxxx"
                value={credentials.vercel_token || ''}
                onChange={(e) =>
                  setCredentials({ ...credentials, vercel_token: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() =>
                  setShowTokens({ ...showTokens, vercel: !showTokens.vercel })
                }
              >
                {showTokens.vercel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              在 <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">Vercel Settings</a> 创建
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Team ID（可选）
            </label>
            <Input
              placeholder="team_xxxxxxxxxxxxxxxxxxxx"
              value={credentials.vercel_team_id || ''}
              onChange={(e) =>
                setCredentials({ ...credentials, vercel_team_id: e.target.value })
              }
            />
            <p className="text-xs text-gray-500">
              如果使用团队账户，请填写 Team ID
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Supabase 凭证 */}
      <Card>
        <CardHeader>
          <CardTitle>Supabase 凭证（可选）</CardTitle>
          <CardDescription>
            如果您的应用需要数据库，请配置 Supabase 凭证
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Project URL
            </label>
            <Input
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={credentials.supabase_url || ''}
              onChange={(e) =>
                setCredentials({ ...credentials, supabase_url: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Anon Key
            </label>
            <div className="relative">
              <Input
                type={showTokens.supabase_key ? 'text' : 'password'}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={credentials.supabase_anon_key || ''}
                onChange={(e) =>
                  setCredentials({ ...credentials, supabase_anon_key: e.target.value })
                }
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                onClick={() =>
                  setShowTokens({ ...showTokens, supabase_key: !showTokens.supabase_key })
                }
              >
                {showTokens.supabase_key ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Project Reference（可选）
            </label>
            <Input
              placeholder="xxxxxxxxxxxx"
              value={credentials.supabase_project_ref || ''}
              onChange={(e) =>
                setCredentials({ ...credentials, supabase_project_ref: e.target.value })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮 */}
      <div className="flex justify-end space-x-4">
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          取消
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>保存中...</>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              保存凭证
            </>
          )}
        </Button>
      </div>

      {/* 安全提示 */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-sm">🔒 安全提示</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-700 space-y-2">
          <p>• 您的凭证使用 AES-256 加密存储在数据库中</p>
          <p>• 凭证只在您的账户下可见，不会与他人共享</p>
          <p>• 建议定期更新您的 API tokens 以确保安全</p>
          <p>• Supabase Anon Key 是客户端安全的，受 RLS 保护</p>
        </CardContent>
      </Card>
    </div>
  )
}
