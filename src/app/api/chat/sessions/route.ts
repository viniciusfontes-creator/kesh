import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { data, error } = await supabase
            .from('chat_sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Supabase error fetching sessions:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        console.error('Uncaught error in GET /api/chat/sessions:', e)
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { title } = await req.json()

        const { data, error } = await supabase
            .from('chat_sessions')
            .insert({
                user_id: user.id,
                title: title || 'Nova Conversa'
            })
            .select()
            .single()

        if (error) {
            console.error('Supabase error creating session:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        console.error('Uncaught error in POST /api/chat/sessions:', e)
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal Server Error' }, { status: 500 })
    }
}

export async function PATCH(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { id, title } = await req.json()

        if (!id || !title) {
            return NextResponse.json({ error: 'Missing id or title' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('chat_sessions')
            .update({ title })
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            console.error('Supabase error updating session:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        console.error('Uncaught error in PATCH /api/chat/sessions:', e)
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal Server Error' }, { status: 500 })
    }
}
