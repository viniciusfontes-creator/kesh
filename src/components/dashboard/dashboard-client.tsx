'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from '@/components/ui/sheet'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    PieChart,
    TrendingUp,
    ArrowDownRight,
    ArrowUpRight,
    Bot,
    Calendar,
    Filter,
    RefreshCcw,
    ChevronRight,
    Wallet,
    Eye,
    Repeat,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    AreaChart,
    Area,
    BarChart,
    Bar,
    Cell,
} from 'recharts'
import { cn } from '@/lib/utils'
import type { Transaction, Conta } from '@/types/database'

type ProjectionPoint = {
    name: string
    Entradas: number
    Saídas: number
    Saldo: number
}

interface DashboardClientProps {
    data: {
        accountBalance: number
        monthExpenses: number
        monthEarnings: number
        pendingExpenses: number
        projectionData: ProjectionPoint[]
        categoryMap: Record<string, number>
        topCategory: [string, number] | undefined
        recurringExpenses: number
        recurringIncomes: number
        recurringTransactions: Transaction[]
        recentTransactions: Transaction[]
        periodTransactions: Transaction[]
        contas: Conta[]
        hasTransactions: boolean
        filters: {
            startDate: string
            endDate: string
            category: string
            contaId: string
        }
        availableCategories: string[]
    }
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function DashboardClient({ data }: DashboardClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [detailSheet, setDetailSheet] = useState<'entradas' | 'saidas' | null>(null)
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const {
        accountBalance,
        monthExpenses,
        monthEarnings,
        pendingExpenses,
        projectionData,
        categoryMap,
        topCategory,
        recurringExpenses,
        recurringIncomes,
        recurringTransactions,
        recentTransactions,
        periodTransactions,
        contas,
        hasTransactions,
        filters,
        availableCategories,
    } = data

    const handleFilterChange = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (value && value !== 'all') {
            params.set(key, value)
        } else {
            params.delete(key)
        }
        router.push(`/dashboard?${params.toString()}`)
    }

    const hasActiveFilters = searchParams.get('startDate') || searchParams.get('endDate') || searchParams.get('category') || searchParams.get('contaId')

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.08 }
        }
    }

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    }

    // Recurring data for charts
    const recurringExpenseItems = recurringTransactions
        .filter(t => t.tipo === 'saida')
        .reduce<Record<string, number>>((acc, t) => {
            const key = t.descricao || t.categoria
            acc[key] = (acc[key] || 0) + Number(t.valor)
            return acc
        }, {})

    const recurringIncomeItems = recurringTransactions
        .filter(t => t.tipo === 'entrada')
        .reduce<Record<string, number>>((acc, t) => {
            const key = t.descricao || t.categoria
            acc[key] = (acc[key] || 0) + Number(t.valor)
            return acc
        }, {})

    const recurringExpenseChartData = Object.entries(recurringExpenseItems)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }))

    const recurringIncomeChartData = Object.entries(recurringIncomeItems)
        .sort((a, b) => b[1] - a[1])
        .map(([name, value]) => ({ name, value }))

    // Sheet transaction list
    const sheetTransactions = periodTransactions.filter(t => {
        if (detailSheet === 'entradas') return t.tipo === 'entrada'
        if (detailSheet === 'saidas') return t.tipo === 'saida'
        return false
    })

    const netRecurring = recurringIncomes - recurringExpenses

    return (
        <>
            <motion.div
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="flex flex-col h-full w-full p-6 md:px-12 md:py-10 space-y-10 max-w-[1600px] mx-auto pb-40 md:pb-12"
            >
                {/* Header + Filters */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
                    <header className="flex flex-col gap-2">
                        <motion.div variants={itemVariants} className="flex items-center gap-2">
                            <span className="w-2 h-8 bg-foreground rounded-full" />
                            <h1 className="text-4xl font-bold tracking-tight text-foreground">Visão Geral</h1>
                        </motion.div>
                        <motion.p variants={itemVariants} className="text-[17px] text-muted-foreground font-medium max-w-2xl leading-relaxed">
                            Análise inteligente do seu patrimônio e histórico financeiro.
                        </motion.p>
                    </header>

                    <motion.div
                        variants={itemVariants}
                        className="flex flex-wrap items-center gap-3 p-2 bg-card/30 backdrop-blur-xl border border-border/40 rounded-[24px] shadow-sm"
                    >
                        {/* Date filter */}
                        <div className="flex items-center gap-3 px-4 py-2 border-r border-border/40">
                            <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 w-28 uppercase"
                                />
                                <span className="text-muted-foreground/30 text-xs">até</span>
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 w-28 uppercase"
                                />
                            </div>
                        </div>

                        {/* Account filter */}
                        {contas.length > 0 && (
                            <div className="flex items-center gap-3 px-4 py-2 border-r border-border/40">
                                <Wallet className="w-4 h-4 text-muted-foreground shrink-0" />
                                <select
                                    value={filters.contaId}
                                    onChange={(e) => handleFilterChange('contaId', e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold focus:ring-0 min-w-[120px] cursor-pointer"
                                >
                                    <option value="all">Todas as Contas</option>
                                    {contas.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Category filter */}
                        <div className="flex items-center gap-3 px-4 py-2">
                            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                            <select
                                value={filters.category}
                                onChange={(e) => handleFilterChange('category', e.target.value)}
                                className="bg-transparent border-none text-xs font-bold focus:ring-0 min-w-[120px] cursor-pointer"
                            >
                                <option value="all">Todas Categorias</option>
                                {availableCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        {hasActiveFilters && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push('/dashboard')}
                                className="text-[10px] font-black uppercase tracking-widest h-8 px-3 rounded-xl hover:bg-foreground hover:text-background"
                            >
                                Limpar
                            </Button>
                        )}
                    </motion.div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {/* Saldo Geral */}
                    <motion.div variants={itemVariants}>
                        <Card className="rounded-[28px] border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full">
                            <CardHeader className="pb-2 pt-6 px-6">
                                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Saldo Geral</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="text-3xl font-bold tracking-tight text-foreground">
                                    {formatCurrency(accountBalance)}
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Wallet className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Soma das contas</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Entradas - Clicável */}
                    <motion.div variants={itemVariants}>
                        <Card
                            className="rounded-[28px] border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer h-full"
                            onClick={() => setDetailSheet('entradas')}
                        >
                            <CardHeader className="pb-2 pt-6 px-6">
                                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Entradas (Mês)</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="text-3xl font-bold tracking-tight text-[#05C168] dark:text-[#34D399]">
                                    {formatCurrency(monthEarnings)}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <ArrowUpRight className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Receitas pagas</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="w-3 h-3" />
                                        Ver +
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Saídas - Clicável */}
                    <motion.div variants={itemVariants}>
                        <Card
                            className="rounded-[28px] border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group cursor-pointer h-full"
                            onClick={() => setDetailSheet('saidas')}
                        >
                            <CardHeader className="pb-2 pt-6 px-6">
                                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Saídas (Mês)</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className="text-3xl font-bold tracking-tight text-[#FF453A] dark:text-[#FF6961]">
                                    {formatCurrency(monthExpenses)}
                                </div>
                                <div className="flex items-center justify-between mt-3">
                                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                        <ArrowDownRight className="w-4 h-4" />
                                        <span className="text-xs font-semibold">Efetivado no período</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Eye className="w-3 h-3" />
                                        Ver +
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Recorrente Líquido */}
                    <motion.div variants={itemVariants}>
                        <Card className="rounded-[28px] border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group h-full">
                            <CardHeader className="pb-2 pt-6 px-6">
                                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.15em] text-muted-foreground/80">Recorrente Líq.</CardTitle>
                            </CardHeader>
                            <CardContent className="px-6 pb-6">
                                <div className={cn(
                                    "text-3xl font-bold tracking-tight",
                                    netRecurring >= 0 ? 'text-[#007AFF] dark:text-[#64D2FF]' : 'text-[#FF453A] dark:text-[#FF6961]'
                                )}>
                                    {formatCurrency(netRecurring)}
                                </div>
                                <div className="flex items-center gap-1.5 mt-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                    <Repeat className="w-4 h-4" />
                                    <span className="text-xs font-semibold">Receitas - Despesas fixas</span>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div variants={itemVariants}>
                        <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-8">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xl tracking-tight">Fluxo Mensal (Realizado)</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Entradas vs Saídas nos últimos 6 meses.</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {isMounted ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={projectionData}>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="opacity-[0.05]" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fontWeight: 600, fill: 'currentColor', opacity: 0.4 }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fontWeight: 600, fill: 'currentColor', opacity: 0.4 }}
                                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                                                itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                                formatter={(value) => formatCurrency(value as number)}
                                            />
                                            <Legend verticalAlign="top" height={40} iconType="circle" />
                                            <Line type="monotone" dataKey="Entradas" stroke="#05C168" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            <Line type="monotone" dataKey="Saídas" stroke="#FF453A" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center opacity-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-8">
                            <div className="flex items-center justify-between mb-10">
                                <div className="space-y-1">
                                    <h3 className="font-bold text-xl tracking-tight">Evolução Patrimonial</h3>
                                    <p className="text-sm text-muted-foreground font-medium">Crescimento real do seu saldo acumulado.</p>
                                </div>
                            </div>
                            <div className="h-[300px] w-full">
                                {isMounted ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={projectionData}>
                                            <defs>
                                                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#007AFF" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#007AFF" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="currentColor" className="opacity-[0.05]" />
                                            <XAxis
                                                dataKey="name"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fontWeight: 600, fill: 'currentColor', opacity: 0.4 }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fontSize: 11, fontWeight: 600, fill: 'currentColor', opacity: 0.4 }}
                                                tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '20px', border: '1px solid var(--border)', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                                                formatter={(value) => formatCurrency(value as number)}
                                            />
                                            <Area type="monotone" dataKey="Saldo" stroke="#007AFF" strokeWidth={4} fillOpacity={1} fill="url(#colorSaldo)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center opacity-20">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    </motion.div>
                </div>

                {/* Recurring + Recent Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Recurring Section */}
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-8">
                            <div className="flex items-center gap-2 mb-8">
                                <RefreshCcw className="w-5 h-5 text-muted-foreground" />
                                <h3 className="font-bold text-xl tracking-tight">Despesas & Receitas Recorrentes</h3>
                            </div>

                            {recurringTransactions.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Despesas Recorrentes */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500/80">Despesas Fixas</span>
                                            <span className="text-sm font-bold text-red-500">{formatCurrency(recurringExpenses)}</span>
                                        </div>
                                        {recurringExpenseChartData.length > 0 ? (
                                            <div className="space-y-3">
                                                {recurringExpenseChartData.map(({ name, value }) => (
                                                    <div key={name} className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground font-medium truncate mr-2">{name}</span>
                                                            <span className="font-bold text-foreground shrink-0">{formatCurrency(value)}</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${recurringExpenses > 0 ? Math.min(100, (value / recurringExpenses) * 100) : 0}%` }}
                                                                transition={{ duration: 0.8, ease: 'circOut' }}
                                                                className="h-full bg-red-500/70 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Nenhuma despesa recorrente.</p>
                                        )}
                                    </div>

                                    {/* Receitas Recorrentes */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500/80">Receitas Fixas</span>
                                            <span className="text-sm font-bold text-emerald-500">{formatCurrency(recurringIncomes)}</span>
                                        </div>
                                        {recurringIncomeChartData.length > 0 ? (
                                            <div className="space-y-3">
                                                {recurringIncomeChartData.map(({ name, value }) => (
                                                    <div key={name} className="space-y-1.5">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="text-muted-foreground font-medium truncate mr-2">{name}</span>
                                                            <span className="font-bold text-foreground shrink-0">{formatCurrency(value)}</span>
                                                        </div>
                                                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${recurringIncomes > 0 ? Math.min(100, (value / recurringIncomes) * 100) : 0}%` }}
                                                                transition={{ duration: 0.8, ease: 'circOut' }}
                                                                className="h-full bg-emerald-500/70 rounded-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">Nenhuma receita recorrente.</p>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8 space-y-3">
                                    <div className="w-16 h-16 bg-muted/40 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-border">
                                        <Repeat className="w-7 h-7 text-muted-foreground/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold">Sem recorrentes</p>
                                        <p className="text-xs text-muted-foreground max-w-xs mx-auto">Marque transações como recorrentes para visualizá-las aqui.</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    {/* Recent Transactions */}
                    <motion.div variants={itemVariants}>
                        <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-5">
                                <h3 className="font-bold text-lg tracking-tight">Últimas Transações</h3>
                            </div>

                            {recentTransactions.length > 0 ? (
                                <div className="flex-1 space-y-1.5">
                                    {recentTransactions.map((t) => (
                                        <div key={t.id} className="flex items-center justify-between py-2.5 px-3 rounded-[16px] hover:bg-muted/30 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={cn(
                                                    'p-2 rounded-[12px] shrink-0',
                                                    t.tipo === 'entrada' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                                )}>
                                                    {t.tipo === 'entrada'
                                                        ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                                        : <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
                                                    }
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-sm font-bold truncate">{t.descricao || t.categoria}</div>
                                                    <div className="text-[10px] text-muted-foreground/60 font-medium">{formatDate(t.data)}</div>
                                                </div>
                                            </div>
                                            <span className={cn(
                                                'text-sm font-bold whitespace-nowrap ml-3',
                                                t.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-500'
                                            )}>
                                                {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex items-center justify-center">
                                    <p className="text-xs text-muted-foreground">Nenhuma transação registrada.</p>
                                </div>
                            )}

                            <Link
                                href="/contas"
                                className="flex items-center justify-center gap-1.5 mt-4 pt-4 border-t border-border/30 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Ver todas <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </Card>
                    </motion.div>
                </div>

                {/* Category Distribution + Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <Card className="rounded-[40px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-10 min-h-[360px] flex flex-col justify-center">
                            {hasTransactions ? (
                                <div className="w-full space-y-8">
                                    <h3 className="font-bold text-2xl tracking-tight mb-2">Distribuição de Gastos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                                        {Object.entries(categoryMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([cat, val]) => (
                                            <div key={cat} className="space-y-2.5">
                                                <div className="flex justify-between text-sm font-semibold">
                                                    <span className="text-muted-foreground">{cat}</span>
                                                    <span className="text-foreground font-bold">{formatCurrency(val)}</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${monthExpenses > 0 ? Math.min(100, (val / monthExpenses) * 100) : 0}%` }}
                                                        transition={{ duration: 1, ease: 'circOut' }}
                                                        className="h-full bg-foreground rounded-full opacity-80"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center space-y-4">
                                    <div className="w-20 h-20 bg-muted rounded-3xl flex items-center justify-center mx-auto ring-1 ring-border">
                                        <PieChart className="w-10 h-10 text-muted-foreground/30" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold">Sem dados suficientes</p>
                                        <p className="text-sm text-muted-foreground max-w-xs mx-auto">Registre seus gastos no chat para visualizar a distribuição detalhada.</p>
                                    </div>
                                </div>
                            )}
                        </Card>
                    </motion.div>

                    <motion.div variants={itemVariants}>
                        <Card className="h-full rounded-[40px] border-none bg-foreground text-background p-10 flex flex-col justify-between overflow-hidden relative group shadow-2xl shadow-foreground/20">
                            <div className="absolute -right-10 -top-10 w-48 h-48 bg-background/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />

                            <div className="relative z-10 space-y-8">
                                <div className="space-y-3">
                                    <h4 className="font-bold text-2xl tracking-tight leading-snug">Kesh Insights</h4>
                                    <p className="text-[15px] opacity-80 leading-relaxed font-medium line-clamp-6">
                                        {topCategory
                                            ? `Notei que ${topCategory[0]} representa ${monthExpenses > 0 ? (topCategory[1] / monthExpenses * 100).toFixed(1) : '0'}% das suas saídas efetivadas. No cenário histórico, ajustes nessa categoria podem acelerar seu patrimônio em até 15% ao ano.`
                                            : 'Olá! Para gerar insights precisos sobre sua sustentabilidade financeira, tente descrever suas contas fixas para mim no chat.'
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="relative z-10 mt-auto pt-8 border-t border-background/20">
                                <div className="text-[10px] opacity-60 uppercase tracking-[0.25em] font-black">Superávit Mensal</div>
                                <div className="mt-2 text-4xl font-bold tracking-tighter">
                                    {formatCurrency(monthEarnings - monthExpenses)}
                                </div>
                                <div className="inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 rounded-full bg-background/10 border border-background/10">
                                    <Bot className="w-3 h-3" />
                                    <span className="text-[9px] font-bold uppercase tracking-wider">AI</span>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                </div>
            </motion.div>

            {/* Detail Sheet for Entradas/Saídas */}
            <Sheet open={detailSheet !== null} onOpenChange={(open) => { if (!open) setDetailSheet(null) }}>
                <SheetContent side="right" className="sm:max-w-md w-full">
                    <SheetHeader className="px-6 pt-6">
                        <SheetTitle className="text-lg font-bold">
                            {detailSheet === 'entradas' ? 'Entradas do Período' : 'Saídas do Período'}
                        </SheetTitle>
                        <SheetDescription>
                            {sheetTransactions.length} transaç{sheetTransactions.length !== 1 ? 'ões' : 'ão'} — {filters.startDate} a {filters.endDate}
                        </SheetDescription>
                    </SheetHeader>
                    <ScrollArea className="flex-1 px-6 pb-6">
                        <div className="space-y-2 pt-4">
                            {sheetTransactions.length > 0 ? (
                                sheetTransactions.map((t) => (
                                    <div key={t.id} className="flex items-center justify-between p-3.5 rounded-[18px] bg-muted/20 border border-border/20">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={cn(
                                                'p-2 rounded-[12px] shrink-0',
                                                t.tipo === 'entrada' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            )}>
                                                {t.tipo === 'entrada'
                                                    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                                    : <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                }
                                            </div>
                                            <div className="min-w-0">
                                                <div className="font-bold text-sm truncate">{t.descricao || t.categoria}</div>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-bold text-muted-foreground/60">{t.categoria}</span>
                                                    <span className="text-[10px] text-muted-foreground/40">{formatDate(t.data)}</span>
                                                    {t.status === 'pendente' && (
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                                                            Pendente
                                                        </span>
                                                    )}
                                                    {t.is_recurring && (
                                                        <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                                                            Recorrente
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'text-sm font-bold whitespace-nowrap ml-3',
                                            t.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-500'
                                        )}>
                                            {formatCurrency(t.valor)}
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-sm text-muted-foreground">Nenhuma transação neste período.</p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </SheetContent>
            </Sheet>
        </>
    )
}
