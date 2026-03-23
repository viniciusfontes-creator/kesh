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

        // Check subscription and quota
        // Free users: 1 account
        // Premium users (any plan): 5 accounts
        const subscription = await getUserSubscription()
        const isPremium = subscription.status === 'active' || subscription.status === 'trialing'

        // Count existing accounts
        const { count } = await supabase
            .from('contas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)

        const limit = isPremium ? 5 : 1

        if (count !== null && count >= limit) {
            return NextResponse.json({
                error: 'Limite de contas atingido',
                message: isPremium
                    ? `Você atingiu o limite de ${limit} contas bancárias do seu plano. Entre em contato para aumentar esse limite.`
                    : `Você atingiu o limite de ${limit} conta bancária do plano gratuito. Faça upgrade para adicionar até 5 contas.`,
                upgradeUrl: isPremium ? undefined : '/configuracoes/assinatura'
            }, { status: 403 })
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
