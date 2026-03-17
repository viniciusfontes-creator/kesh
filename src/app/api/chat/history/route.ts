import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get('sessionId')

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return new Response('Unauthorized', { status: 401 })
    }

    let query = supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)

    if (sessionId) {
        query = query.eq('session_id', sessionId)
    } else {
        // If no session ID, maybe get messages without a session (legacy)
        // or just return empty if we want to force sessions
        query = query.is('session_id', null)
    }

    const { data, error } = await query
        .order('created_at', { ascending: true })
        .limit(100)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const messages = (data ?? []).map((msg, i) => ({
        id: `hist-${i}`,
        role: msg.role,
        content: msg.content,
        parts: [{ type: 'text', text: msg.content ?? '' }],
    }))

    return NextResponse.json(messages)
}
