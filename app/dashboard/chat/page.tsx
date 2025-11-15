'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Send, Loader2, Sparkles } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [messages])

  // 创建新对话
  const createConversation = async () => {
    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: '新对话',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setConversationId(data.id)
        return data.id
      }
    } catch (error) {
      console.error('Failed to create conversation:', error)
    }
    return null
  }

  // 发送消息
  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // 创建对话（如果还没有）
    let convId = conversationId
    if (!convId) {
      convId = await createConversation()
      if (!convId) {
        toast.error('创建对话失败')
        setLoading(false)
        return
      }
    }

    // 创建助手消息占位符
    const assistantId = (Date.now() + 1).toString()
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    }
    setMessages((prev) => [...prev, assistantMessage])

    try {
      // 使用 AbortController 支持取消
      abortControllerRef.current = new AbortController()

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation_id: convId,
          message: userMessage.content,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: 请求失败`)
      }

      // 处理 SSE 流式响应
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let accumulatedContent = ''
      let hasError = false

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)

            if (data === '[DONE]') {
              console.log('Stream completed successfully')
              break
            }

            if (data === '[ERROR]') {
              hasError = true
              break
            }

            try {
              const parsed = JSON.parse(data)

              if (parsed.error) {
                // 服务器返回错误
                console.error('Server error:', parsed.error)
                toast.error(parsed.error)
                hasError = true
                break
              }

              if (parsed.content) {
                accumulatedContent += parsed.content
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                )
              }
            } catch (e) {
              // 忽略解析错误
              console.warn('Failed to parse SSE data:', data)
            }
          }
        }

        if (hasError) {
          break
        }
      }

      // 如果有错误且没有内容，移除助手消息
      if (hasError && !accumulatedContent) {
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantId))
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast.info('已取消发送')
      } else {
        toast.error('发送失败，请重试')
        // 移除助手消息
        setMessages((prev) => prev.filter((msg) => msg.id !== assistantId))
      }
    } finally {
      setLoading(false)
      abortControllerRef.current = null
    }
  }

  // 取消发送
  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-8rem)]">
      <div className="mb-4 flex-shrink-0">
        <h1 className="text-3xl font-bold text-gray-900">智能对话</h1>
        <p className="text-gray-600 mt-2">
          描述您想要创建的应用，AI 将自动生成并部署
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        {/* 消息列表 */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-6" ref={scrollRef}>
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <Sparkles className="w-16 h-16 text-purple-600 mx-auto" />
                <h3 className="text-xl font-semibold text-gray-900">
                  开始您的第一个项目
                </h3>
                <p className="text-gray-600 max-w-md">
                  告诉我您想要创建什么样的应用，我会帮您：
                </p>
                <div className="text-sm text-gray-600 space-y-2">
                  <div>✨ 设计数据库结构</div>
                  <div>💻 生成完整代码</div>
                  <div>📦 创建 GitHub 仓库</div>
                  <div>🚀 部署到 Vercel</div>
                  <div>📧 发送结果到邮箱</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-3xl rounded-lg px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content || '正在思考...'}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap">{message.content}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        </div>

        {/* 输入区域 */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0 bg-white">
          <div className="flex space-x-2">
            <Textarea
              placeholder="描述您想要创建的应用..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              className="flex-1 min-h-[60px] max-h-[200px] resize-none"
              disabled={loading}
            />
            <div className="flex flex-col space-y-2">
              {loading ? (
                <Button
                  size="icon"
                  variant="destructive"
                  onClick={handleCancel}
                  className="w-12 h-12"
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className="w-12 h-12"
                >
                  <Send className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            按 Enter 发送，Shift + Enter 换行
          </p>
        </div>
      </Card>
    </div>
  )
}
