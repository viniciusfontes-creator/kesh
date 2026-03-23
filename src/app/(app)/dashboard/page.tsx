import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardClient } from '@/components/dashboard/dashboard-client'
import { getUserSubscription } from '@/lib/subscription'

interface DashboardPageProps {
    searchParams: Promise<{
        startDate?: string
        endDate?: string
        category?: string
        contaId?: string
    }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const { startDate, endDate, category, contaId } = await searchParams
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Check subscription status
    const subscription = await getUserSubscription()
    const isPremium = subscription.status === 'active' || subscription.status === 'trialing'

    // Default date range: Current month
    const now = new Date()
    const defaultStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const defaultEnd = now.toISOString().split('T')[0]

    const filterStart = startDate || defaultStart
    const filterEnd = endDate || defaultEnd

    // 1. Fetch filtered transactions for the period
    let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', filterStart)
        .lte('data', filterEnd)

    if (category && category !== 'all') {
        query = query.eq('categoria', category)
    }
    if (contaId && contaId !== 'all') {
        query = query.eq('conta_id', contaId)
    }

    // 2. Fetch contas (accounts) for filter + balance
    const contasQuery = supabase
        .from('contas')
        .select('*')
        .eq('user_id', user.id)
        .order('nome')

    // 3. Fetch unique categories
    const catQuery = supabase
        .from('transactions')
        .select('categoria')
        .eq('user_id', user.id)

    // 4. Fetch all recurring transactions (templates or active ones)
    let recQuery = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_recurring', true)

    if (category && category !== 'all') {
        recQuery = recQuery.eq('categoria', category)
    }
    if (contaId && contaId !== 'all') {
        recQuery = recQuery.eq('conta_id', contaId)
    }

    // 5. Fetch recent transactions (last 8)
    let recentQuery = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(8)

    if (contaId && contaId !== 'all') {
        recentQuery = recentQuery.eq('conta_id', contaId)
    }

    // 6. Fetch historical transactions for charts (last 6 months)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0]
    let historyQuery = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', sixMonthsAgo)
        .lte('data', filterEnd)
        .eq('status', 'pago')

    if (contaId && contaId !== 'all') {
        historyQuery = historyQuery.eq('conta_id', contaId)
    }

    // Execute all queries in parallel
    const [
        { data: transactions },
        { data: contas },
        { data: catData },
        { data: allRecurring },
        { data: recentTransactions },
        { data: historyTransactions },
    ] = await Promise.all([query, contasQuery, catQuery, recQuery, recentQuery, historyQuery])

    const uniqueCategories = Array.from(new Set((catData || []).map(t => t.categoria).filter(Boolean)))

    // Account balance
    const accountBalance = (contas || [])
        .filter(c => contaId && contaId !== 'all' ? c.id === contaId : true)
        .reduce((sum, c) => sum + (c.saldo ?? 0), 0)

    // Period calculations (Realized)
    const monthExpenses = (transactions || [])
        .filter(t => t.tipo === 'saida' && t.status === 'pago')
        .reduce((acc, t) => acc + Number(t.valor), 0)

    const monthEarnings = (transactions || [])
        .filter(t => t.tipo === 'entrada' && t.status === 'pago')
        .reduce((acc, t) => acc + Number(t.valor), 0)

    const pendingExpenses = (transactions || [])
        .filter(t => t.tipo === 'saida' && t.status === 'pendente')
        .reduce((acc, t) => acc + Number(t.valor), 0)

    // Categories Distribution
    const categoryMap: Record<string, number> = {}
    transactions?.filter(t => t.tipo === 'saida').forEach(t => {
        categoryMap[t.categoria] = (categoryMap[t.categoria] || 0) + Number(t.valor)
    })
    const topCategory = Object.entries(categoryMap).sort((a, b) => b[1] - a[1])[0] as [string, number] | undefined

    // Recurring calculations (Fixed duplicates fix)
    // We group by description/category to get the "monthly impact" of recurring items
    const recurringMap: Record<string, { tipo: string, valor: number }> = {}
    allRecurring?.forEach(t => {
        const key = `${t.tipo}-${t.categoria}-${t.descricao}`
        // If we have multiple entries for the same service (e.g. Aluguel Jan, Aluguel Fev), we only count one as the monthly "base"
        if (!recurringMap[key] || new Date(t.data) > new Date()) {
          recurringMap[key] = { tipo: t.tipo, valor: Number(t.valor) }
        }
    })

    const recurringIncomes = Object.values(recurringMap)
        .filter(t => t.tipo === 'entrada')
        .reduce((acc, t) => acc + t.valor, 0)

    const recurringExpenses = Object.values(recurringMap)
        .filter(t => t.tipo === 'saida')
        .reduce((acc, t) => acc + t.valor, 0)

    // Historical Data Logic (aggregating by month)
    const historyData = []
    const months = []
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
        months.push({
            name: d.toLocaleDateString('pt-BR', { month: 'short' }),
            year: d.getFullYear(),
            month: d.getMonth()
        })
    }

    let rollingHistoryBalance = accountBalance 
    // To show accurate history balance, we would need the balance at the start of the 6-month period.
    // For simplicity, we calculate backward or just show the delta.
    // Let's calculate the 'historical' accumulation by starting from current balance and subtracting deltas backwards.
    
    const monthlyHistory = months.map(m => {
        const monthTxs = (historyTransactions || []).filter(t => {
            const tDate = new Date(t.data + 'T12:00:00')
            return tDate.getFullYear() === m.year && tDate.getMonth() === m.month
        })

        const entradas = monthTxs.filter(t => t.tipo === 'entrada').reduce((acc, t) => acc + Number(t.valor), 0)
        const saidas = monthTxs.filter(t => t.tipo === 'saida').reduce((acc, t) => acc + Number(t.valor), 0)
        
        return {
            name: m.name,
            Entradas: entradas,
            Saídas: saidas,
            diff: entradas - saidas
        }
    })

    // Calculate historical balance points
    let tempBalance = accountBalance
    const historyWithBalance = []
    for (let i = monthlyHistory.length - 1; i >= 0; i--) {
        const item = monthlyHistory[i]
        historyWithBalance.unshift({
            ...item,
            Saldo: Math.round(tempBalance)
        })
        tempBalance -= item.diff
    }

    const dashboardData = {
        accountBalance,
        monthExpenses,
        monthEarnings,
        pendingExpenses,
        projectionData: historyWithBalance, // Keeping name for compatibility or refactor client
        categoryMap,
        topCategory,
        recurringExpenses,
        recurringIncomes,
        recurringTransactions: allRecurring || [],
        recentTransactions: recentTransactions || [],
        periodTransactions: transactions || [],
        contas: contas || [],
        hasTransactions: (transactions || []).length > 0,
        filters: {
            startDate: filterStart,
            endDate: filterEnd,
            category: category || 'all',
            contaId: contaId || 'all',
        },
        availableCategories: uniqueCategories,
        isPremium,
    }

    return <DashboardClient data={dashboardData} />
}
