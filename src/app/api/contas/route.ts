import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/subscription'

export async function GET() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { data, error } = await supabase
            .from('contas')
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

        const { nome, tipo, saldo, cor } = await req.json()

        if (!nome || !tipo) {
            return NextResponse.json({ error: 'Nome e tipo são obrigatórios' }, { status: 400 })
        }

        // Check subscription and quota (free users limited to 1 account)
        const subscription = await getUserSubscription()
        const isPremium = subscription.status === 'active' || subscription.status === 'trialing'

        if (!isPremium) {
            // Count existing accounts
            const { count } = await supabase
                .from('contas')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)

            if (count !== null && count >= 1) {
                return NextResponse.json({
                    error: 'Limite de contas atingido',
                    message: 'Você atingiu o limite de 1 conta bancária do plano gratuito. Faça upgrade para adicionar mais contas.',
                    upgradeUrl: '/configuracoes/assinatura'
                }, { status: 403 })
            }
        }

        const { data, error } = await supabase
            .from('contas')
            .insert({
                user_id: user.id,
                nome,
                tipo,
                saldo: saldo ?? 0,
                cor: cor ?? null,
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
            .from('contas')
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
            .from('contas')
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
