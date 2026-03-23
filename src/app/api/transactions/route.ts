import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getUserSubscription } from '@/lib/subscription'
import { checkTransactionsQuota, incrementTransactionsQuota } from '@/lib/quota'

export async function GET(req: Request) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return new Response('Unauthorized', { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const tipo = searchParams.get('tipo')
        const categoria = searchParams.get('categoria')
        const status = searchParams.get('status')
        const dataInicio = searchParams.get('dataInicio')
        const dataFim = searchParams.get('dataFim')
        const contaId = searchParams.get('contaId')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        let query = supabase
            .from('transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)

        if (tipo) query = query.eq('tipo', tipo)
        if (categoria) query = query.ilike('categoria', `%${categoria}%`)
        if (status) query = query.eq('status', status)
        if (dataInicio) query = query.gte('data', dataInicio)
        if (dataFim) query = query.lte('data', dataFim)
        if (contaId) query = query.eq('conta_id', contaId)

        const { data, error, count } = await query
            .order('data', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ data, count })
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

        const body = await req.json()

        if (!body.tipo || !body.valor || !body.categoria) {
            return NextResponse.json({ error: 'Tipo, valor e categoria são obrigatórios' }, { status: 400 })
        }

        // Check if transaction is manual (fonte === 'manual')
        const isManualTransaction = body.fonte === 'manual' || !body.fonte

        // Check subscription and quota for manual transactions
        if (isManualTransaction) {
            const subscription = await getUserSubscription()
            const isPremium = subscription.status === 'active' || subscription.status === 'trialing'

            if (!isPremium) {
                const quotaStatus = await checkTransactionsQuota(user.id)
                if (quotaStatus.exceeded) {
                    return NextResponse.json({
                        error: 'Limite de transações manuais atingido',
                        message: `Você atingiu o limite de ${quotaStatus.limit} transações manuais por mês do plano gratuito. Faça upgrade para continuar adicionando transações.`,
                        upgradeUrl: '/configuracoes/assinatura'
                    }, { status: 403 })
                }
            }
        }

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                user_id: user.id,
                tipo: body.tipo,
                valor: body.valor,
                categoria: body.categoria,
                descricao: body.descricao ?? null,
                data: body.data ?? new Date().toISOString().split('T')[0],
                fonte: body.fonte ?? 'manual',
                status: body.status ?? 'pago',
                data_vencimento: body.data_vencimento ?? null,
                conta_id: body.conta_id ?? null,
                parcela_atual: body.parcela_atual ?? null,
                total_parcelas: body.total_parcelas ?? null,
                is_recurring: body.is_recurring ?? false,
                frequency: body.frequency ?? null,
            })
            .select()
            .single()

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Increment quota for manual transactions by free users
        if (isManualTransaction) {
            const subscription = await getUserSubscription()
            const isPremium = subscription.status === 'active' || subscription.status === 'trialing'
            if (!isPremium) {
                await incrementTransactionsQuota(user.id)
            }
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
            .from('transactions')
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
            .from('transactions')
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
