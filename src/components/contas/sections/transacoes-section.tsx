'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, ArrowUpRight, ArrowDownRight, ReceiptText } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { TransacaoFormSheet } from '../forms/transacao-form-sheet'
import type { Transaction, Categoria, Conta } from '@/types/database'

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

interface TransacoesSectionProps {
    initialTransactions: Transaction[]
    categorias: Categoria[]
    contas: Conta[]
}

export function TransacoesSection({ initialTransactions, categorias, contas }: TransacoesSectionProps) {
    const [transactions, setTransactions] = useState(initialTransactions)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Transaction | null>(null)
    const [filterTipo, setFilterTipo] = useState<string>('')
    const [filterStatus, setFilterStatus] = useState<string>('')

    const handleSave = (saved: Transaction) => {
        setTransactions(prev => {
            const exists = prev.find(t => t.id === saved.id)
            if (exists) return prev.map(t => t.id === saved.id ? saved : t)
            return [saved, ...prev].sort((a, b) => b.data.localeCompare(a.data))
        })
        setEditing(null)
    }

    const handleDelete = async (id: string) => {
        const res = await fetch('/api/transactions', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        if (res.ok) {
            setTransactions(prev => prev.filter(t => t.id !== id))
        }
    }

    const filtered = transactions.filter(t => {
        if (filterTipo && t.tipo !== filterTipo) return false
        if (filterStatus && t.status !== filterStatus) return false
        return true
    })

    // Group by date
    const grouped = filtered.reduce<Record<string, Transaction[]>>((acc, t) => {
        const key = t.data
        if (!acc[key]) acc[key] = []
        acc[key].push(t)
        return acc
    }, {})

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight">Transações</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                        {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => { setEditing(null); setFormOpen(true) }}
                    className="rounded-[18px] font-bold bg-foreground text-background hover:opacity-90 gap-2 p-2.5 md:px-4 md:py-2"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Nova Transação</span>
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 pb-1">
                <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-[20px] md:rounded-[22px] w-full md:w-fit">
                    {[
                        { value: '', label: 'Todos' },
                        { value: 'entrada', label: 'Entradas' },
                        { value: 'saida', label: 'Saídas' },
                    ].map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => setFilterTipo(opt.value)}
                            className={cn(
                                'relative flex-1 md:flex-none px-3 md:px-5 py-1.5 md:py-2 rounded-[16px] md:rounded-[18px] text-xs font-bold transition-colors whitespace-nowrap outline-none',
                                filterTipo === opt.value
                                    ? 'text-background'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {filterTipo === opt.value && (
                                <motion.div
                                    layoutId="filter-tipo-bg"
                                    className="absolute inset-0 bg-foreground rounded-[16px] md:rounded-[18px] shadow-sm"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 text-[11px] md:text-xs">{opt.label}</span>
                        </button>
                    ))}
                </div>

                <div className="hidden md:block w-px h-6 bg-border/50 shrink-0" />

                <div className="flex items-center gap-1 p-1 bg-muted/20 rounded-[20px] md:rounded-[22px] w-full md:w-fit">
                    {[
                        { value: '', label: 'Qualquer' },
                        { value: 'pago', label: 'Pago' },
                        { value: 'pendente', label: 'Pendente' },
                    ].map((opt) => (
                        <button
                            key={`s-${opt.value}`}
                            type="button"
                            onClick={() => setFilterStatus(opt.value)}
                            className={cn(
                                'relative flex-1 md:flex-none px-3 md:px-5 py-1.5 md:py-2 rounded-[16px] md:rounded-[18px] text-xs font-bold transition-colors whitespace-nowrap outline-none',
                                filterStatus === opt.value
                                    ? 'text-background'
                                    : 'text-muted-foreground hover:text-foreground'
                            )}
                        >
                            {filterStatus === opt.value && (
                                <motion.div
                                    layoutId="filter-status-bg"
                                    className="absolute inset-0 bg-foreground rounded-[16px] md:rounded-[18px] shadow-sm"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <span className="relative z-10 text-[11px] md:text-xs">{opt.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Transaction List */}
            {Object.keys(grouped).length > 0 ? (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([date, items]) => (
                        <div key={date}>
                            <div className="text-[11px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-3 px-1">
                                {formatDate(date)}
                            </div>
                            <div className="space-y-2">
                                {items.map((t, i) => (
                                    <motion.div
                                        key={t.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                    >
                                        <div className="flex items-center gap-4 p-4 rounded-[22px] bg-card/50 border border-border/30 hover:border-border/60 transition-all group">
                                            <div className={cn(
                                                'p-2.5 rounded-[14px] shrink-0',
                                                t.tipo === 'entrada' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            )}>
                                                {t.tipo === 'entrada'
                                                    ? <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                                                    : <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                }
                                            </div>

                                            <div className="flex-1 min-w-0 flex flex-col gap-1">
                                                {/* Desktop: Todo em linha | Mobile: Duas linhas */}
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-0 md:gap-4">
                                                    <div className="flex-1 min-w-0 flex flex-col md:flex-row md:items-center gap-0 md:gap-2">
                                                        <div className="font-bold text-sm truncate">
                                                            {t.descricao || t.categoria}
                                                        </div>
                                                        <div className="hidden md:flex items-center gap-2">
                                                            <span className="text-[10px] font-bold text-muted-foreground/60 whitespace-nowrap">{t.categoria}</span>
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

                                                    <div className="flex items-center justify-between md:justify-end gap-3 mt-1 md:mt-0">
                                                        <span className={cn(
                                                            'text-sm font-bold whitespace-nowrap',
                                                            t.tipo === 'entrada' ? 'text-emerald-500' : 'text-red-500'
                                                        )}>
                                                            {t.tipo === 'entrada' ? '+' : '-'}{formatCurrency(t.valor)}
                                                        </span>
                                                        <div className="hidden md:flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                type="button"
                                                                onClick={() => { setEditing(t); setFormOpen(true) }}
                                                                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                            >
                                                                <Edit2 className="w-3 h-3" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDelete(t.id)}
                                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Rodapé Mobile (Badges e Ações) */}
                                                <div className="flex md:hidden items-center justify-between gap-2 mt-0.5">
                                                    <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                                        <span className="text-[11px] font-bold text-muted-foreground/60 truncate max-w-[100px]">{t.categoria}</span>
                                                        {t.status === 'pendente' && (
                                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600">
                                                                Pendente
                                                            </span>
                                                        )}
                                                        {t.is_recurring && (
                                                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500">
                                                                Recorrente
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-0.5 opacity-60">
                                                        <button
                                                            type="button"
                                                            onClick={() => { setEditing(t); setFormOpen(true) }}
                                                            className="p-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(t.id)}
                                                            className="p-2.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md p-10">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                        <div className="p-4 bg-muted/40 rounded-full">
                            <ReceiptText className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Nenhuma transação encontrada</p>
                            <p className="text-xs text-muted-foreground mt-1">Crie transações manualmente ou via chat.</p>
                        </div>
                    </div>
                </Card>
            )}

            <TransacaoFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                transacao={editing}
                categorias={categorias}
                contas={contas}
                onSave={handleSave}
            />
        </div>
    )
}
