import { createClient } from '@/lib/supabase/server'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true'

    let query = supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

    if (unreadOnly) {
        query = query.eq('read', false)
    }

    const { data, error } = await query

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    const unreadCount = (data ?? []).filter(n => !n.read).length

    return Response.json({ notifications: data ?? [], unreadCount })
}

// Mark all as read
export async function PATCH() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response('Unauthorized', { status: 401 })

    const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false)

    if (error) {
        return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json({ success: true })
}
