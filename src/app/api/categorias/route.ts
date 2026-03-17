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
            .from('categorias')
            .select('*')
            .eq('user_id', user.id)
            .order('nome')

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
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

        const { nome, tipo, cor, icone } = await req.json()

        if (!nome) {
            return NextResponse.json({ error: 'Nome é obrigatório' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('categorias')
            .insert({
                user_id: user.id,
                nome,
                tipo: tipo ?? null,
                cor: cor ?? null,
                icone: icone ?? null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
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

        const { id, ...updates } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        const { data, error } = await supabase
            .from('categorias')
            .update(updates)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json(data)
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { id } = await req.json()

        if (!id) {
            return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 })
        }

        const { error } = await supabase
            .from('categorias')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : 'Internal Server Error' }, { status: 500 })
    }
}
