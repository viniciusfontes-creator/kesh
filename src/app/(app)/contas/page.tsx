import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ContasClient } from '@/components/contas/contas-client'
import type { MetaWithProgress } from '@/components/contas/sections/metas-section'

export default async function ContasPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const [contasRes, transactionsRes, categoriasRes, metasRes] = await Promise.all([
        supabase
            .from('contas')
            .select('*')
            .eq('user_id', user.id)
            .order('nome'),
        supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .order('data', { ascending: false })
            .limit(50),
        supabase
            .from('categorias')
            .select('*')
            .eq('user_id', user.id)
            .order('nome'),
        supabase
            .from('metas')
            .select('*')
            .eq('user_id', user.id)
            .order('categoria'),
    ])

    const contas = contasRes.data ?? []
    const transactions = transactionsRes.data ?? []
    const categorias = categoriasRes.data ?? []
    const rawMetas = metasRes.data ?? []

    // Calculate progress for each meta
    const now = new Date()
    const metasWithProgress: MetaWithProgress[] = rawMetas.map(meta => {
        let startDate: Date

        switch (meta.periodo) {
            case 'semanal': {
                const day = now.getDay()
                startDate = new Date(now)
                startDate.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
                startDate.setHours(0, 0, 0, 0)
                break
            }
            case 'anual': {
                startDate = new Date(now.getFullYear(), 0, 1)
                break
            }
            default: {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1)
                break
            }
        }

        const startStr = startDate.toISOString().split('T')[0]
        const endStr = now.toISOString().split('T')[0]

        const gastoAtual = transactions
            .filter(t =>
                t.tipo === 'saida' &&
                t.status === 'pago' &&
                t.categoria.toLowerCase() === meta.categoria.toLowerCase() &&
                t.data >= startStr &&
                t.data <= endStr
            )
            .reduce((sum, t) => sum + t.valor, 0)

        return { ...meta, gastoAtual }
    })

    return (
        <ContasClient
            contas={contas}
            transactions={transactions}
            categorias={categorias}
            metas={metasWithProgress}
        />
    )
}
