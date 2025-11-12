import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: process.env.ANTHROPIC_BASE_URL,
})

export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929'

export async function createChatStream(
  messages: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  onComplete: () => void
) {
  const stream = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    messages,
    stream: true,
  })

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      onChunk(event.delta.text)
    }

    if (event.type === 'message_stop') {
      onComplete()
    }
  }
}
