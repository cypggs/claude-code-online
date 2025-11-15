import { createClient } from '@/lib/supabase/server'
import { anthropic, CLAUDE_MODEL } from '@/lib/claude'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout

// 系统提示词 - 引导 Claude 理解部署需求
const SYSTEM_PROMPT = `你是一个全栈开发助手，专门帮助用户创建和部署 Web 应用。

当用户描述他们想要创建的应用时，你应该：
1. 理解用户的需求并提出关键问题（如果需要澄清）
2. 建议合适的技术栈（Next.js, React, Vue, Flask, FastAPI 等）
3. 讨论需要的功能和数据库设计
4. 在用户确认后，提供清晰的实现建议

你可以用中文或英文回复，根据用户的语言选择。
保持友好、专业，并提供有价值的技术建议。

重要提示：
- 用户可以通过界面的"创建部署"功能来实际部署项目
- 你的角色是帮助用户规划和理解项目需求
- 如果用户想立即开始部署，引导他们使用部署功能`

export async function POST(request: Request) {
  const startTime = Date.now()
  console.log('[Chat API] Request started')

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      console.log('[Chat API] Unauthorized - no user')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[Chat API] User authenticated:', user.id)

    const body = await request.json()
    const { conversation_id, message } = body

    if (!conversation_id || !message) {
      console.log('[Chat API] Missing required fields')
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('[Chat API] Conversation ID:', conversation_id)
    console.log('[Chat API] Message length:', message.length)

    // 保存用户消息到数据库
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id,
      role: 'user',
      content: message,
    })

    if (insertError) {
      console.error('[Chat API] Error inserting user message:', insertError)
      throw insertError
    }

    console.log('[Chat API] User message saved to database')

    // 获取对话历史
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20) // 增加历史消息数量

    if (historyError) {
      console.error('[Chat API] Error fetching history:', historyError)
      throw historyError
    }

    const messages = history || []
    console.log('[Chat API] Loaded', messages.length, 'historical messages')

    // 创建 SSE 流
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          console.log('[Chat API] Starting Claude API stream...')

          // 准备消息数组（包含系统消息）
          const apiMessages = messages.map((msg) => ({
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))

          console.log('[Chat API] Calling Claude API with', apiMessages.length, 'messages')

          // 调用 Claude API
          const claudeStream = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 8000,
            system: SYSTEM_PROMPT,
            messages: apiMessages,
            stream: true,
          })

          console.log('[Chat API] Claude API stream created successfully')

          // 处理流式响应
          let chunkCount = 0
          for await (const event of claudeStream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const text = event.delta.text
              fullContent += text
              chunkCount++

              // 发送给客户端
              const data = JSON.stringify({ content: text })
              controller.enqueue(encoder.encode(`data: ${data}\n\n`))
            }

            if (event.type === 'message_stop') {
              console.log('[Chat API] Stream completed. Chunks:', chunkCount, 'Total length:', fullContent.length)

              // 保存助手消息到数据库
              const { error: assistantError } = await supabase.from('messages').insert({
                conversation_id,
                role: 'assistant',
                content: fullContent,
              })

              if (assistantError) {
                console.error('[Chat API] Error saving assistant message:', assistantError)
              } else {
                console.log('[Chat API] Assistant message saved to database')
              }

              // 发送完成信号
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()

              const duration = Date.now() - startTime
              console.log('[Chat API] Request completed in', duration, 'ms')
            }
          }
        } catch (error: any) {
          console.error('[Chat API] Streaming error:', error)
          console.error('[Chat API] Error details:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            status: error.status,
          })

          // 发送错误信息给客户端
          const errorMessage = error.message || 'AI 服务暂时不可用，请稍后重试'
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: errorMessage })}\n\n`
            )
          )
          controller.enqueue(encoder.encode('data: [ERROR]\n\n'))
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      },
    })
  } catch (error: any) {
    console.error('[Chat API] Fatal error:', error)
    console.error('[Chat API] Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
    })

    const duration = Date.now() - startTime
    console.log('[Chat API] Request failed after', duration, 'ms')

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
