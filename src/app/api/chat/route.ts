import { google } from '@ai-sdk/google'
import { streamText, stepCountIs, convertToModelMessages } from 'ai'
import { createClient } from '@/lib/supabase/server'
import {
    insertTransactionTool,
    listTransactionsTool,
    updateTransactionTool,
    deleteTransactionTool,
    getBalanceTool,
    listCategoriasTool,
    createCategoriaTool,
    createMetaTool,
    listMetasTool,
    checkMetasTool,
    createContaTool,
    listContasTool,
    createNotificationTool,
} from '@/lib/agent/tools'
import { buildSystemPrompt, hashUserId } from '@/lib/agent/prompt'

export const maxDuration = 60

export async function POST(req: Request) {
    const { messages, sessionId } = await req.json()

    if (!messages || !Array.isArray(messages)) {
        console.error('Messages missing or not an array:', messages)
        return new Response(JSON.stringify({ error: 'Messages are required' }), { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    // Save last user message
    const lastMsg = messages[messages.length - 1]
    if (lastMsg && lastMsg.role === 'user') {
        const parts = Array.isArray(lastMsg.parts) ? lastMsg.parts : (Array.isArray(lastMsg.content) ? lastMsg.content : [])
        const content = typeof lastMsg.content === 'string' ? lastMsg.content : ''
        
        const textParts = (parts || [])
            .filter((p: any) => p && p.type === 'text')
            .map((p: any) => p.text)
        
        const hasImage = (parts || []).some((p: any) => 
            p && ((p.type === 'file' && p.mediaType?.startsWith('image/')) || (p.type === 'image'))
        )
        const hasAudio = (parts || []).some((p: any) => 
            p && (p.type === 'file' && p.mediaType?.startsWith('audio/'))
        )
        
        const markers = [
            ...(hasImage ? ['[imagem]'] : []),
            ...(hasAudio ? ['[áudio]'] : []),
        ]
        const text = [...markers, ...textParts].join(' ').trim() || content || ''
        
        if (text) {
            await supabase.from('chat_messages').insert({
                user_id: user.id,
                role: 'user',
                content: text,
                session_id: sessionId,
            })

            if (sessionId) {
                await supabase
                    .from('chat_sessions')
                    .update({ updated_at: new Date().toISOString() })
                    .eq('id', sessionId)
            }
        }
    }

    const today = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    const userHash = hashUserId(user.id)
    const systemPrompt = buildSystemPrompt(today, userHash)

    try {
        // 1. Convert UI messages to Model messages
        const rawModelMessages = await convertToModelMessages(messages)
        
        // 2. Filter out any system messages from history and prepare for Gemini
        // We use our own dynamic system prompt via the 'system' parameter.
        const modelMessages = rawModelMessages
            .filter(m => m.role !== 'system')
            .map(m => {
                // Only process user messages that have content parts (for multimodal)
                if (m.role !== 'user' || !Array.isArray(m.content)) return m

                return {
                    ...m,
                    content: m.content.map(p => {
                        // Handle Image parts specifically
                        if (p.type === 'image') {
                            const data = (p as any).image
                            if (typeof data === 'string' && data.startsWith('data:')) {
                                const [header, base64] = data.split(',')
                                const mimeType = header.match(/:(.*?);/)?.[1] || (p as any).mimeType || 'image/jpeg'
                                return { type: 'image', image: base64, mimeType }
                            }
                        }
                        
                        // Handle File parts (audio/pdf/etc)
                        if (p.type === 'file') {
                            const data = (p as any).data
                            if (typeof data === 'string' && data.startsWith('data:')) {
                                const [header, base64] = data.split(',')
                                const mimeType = header.match(/:(.*?);/)?.[1] || (p as any).mediaType || (p as any).mimeType || 'application/octet-stream'
                                return { type: 'file', data: base64, mimeType }
                            }
                        }

                        return p
                    })
                }
            })

        const result = await streamText({
            model: google('gemini-flash-latest'),
            system: systemPrompt,
            messages: modelMessages as any[],
            tools: {
                insertTransaction: insertTransactionTool,
                listTransactions: listTransactionsTool,
                updateTransaction: updateTransactionTool,
                deleteTransaction: deleteTransactionTool,
                getBalance: getBalanceTool,
                listCategorias: listCategoriasTool,
                createCategoria: createCategoriaTool,
                createMeta: createMetaTool,
                listMetas: listMetasTool,
                checkMetas: checkMetasTool,
                createConta: createContaTool,
                listContas: listContasTool,
                createNotification: createNotificationTool,
            },
            stopWhen: stepCountIs(5),
            onFinish: async ({ response }) => {
                type ChatMessageRow = {
                    user_id: string
                    role: 'assistant'
                    content: string
                    session_id: string | null
                }

                const msgs = response.messages || []
                const rows: ChatMessageRow[] = msgs
                    .filter(m => m && m.role === 'assistant' && m.content)
                    .map(m => {
                        const textContent = Array.isArray(m.content)
                            ? m.content
                                .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                                .map(p => p.text)
                                .join('')
                            : String(m.content)
                        if (!textContent?.trim() || textContent.trim().length < 2) return null
                        return {
                            user_id: user.id,
                            role: 'assistant' as const,
                            content: textContent,
                            session_id: sessionId,
                        }
                    })
                    .filter(Boolean) as ChatMessageRow[]

                if (rows.length > 0) {
                    await supabase.from('chat_messages').insert(rows)
                }
            },
        })

        return result.toUIMessageStreamResponse()
    } catch (error) {
        console.error('Error in chat route:', error)
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }
}
