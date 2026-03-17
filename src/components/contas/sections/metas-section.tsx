'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Target, Power } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { MetaFormSheet } from '../forms/meta-form-sheet'
import type { Meta, Categoria } from '@/types/database'

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

const PERIODO_LABELS: Record<string, string> = {
    semanal: 'Semanal',
    mensal: 'Mensal',
    anual: 'Anual',
}

export interface MetaWithProgress extends Meta {
    gastoAtual: number
}

interface MetasSectionProps {
    initialMetas: MetaWithProgress[]
    categorias: Categoria[]
}

export function MetasSection({ initialMetas, categorias }: MetasSectionProps) {
    const [metas, setMetas] = useState(initialMetas)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Meta | null>(null)

    const handleSave = (saved: Meta) => {
        setMetas(prev => {
            const exists = prev.find(m => m.id === saved.id)
            if (exists) return prev.map(m => m.id === saved.id ? { ...saved, gastoAtual: m.gastoAtual } : m)
            return [{ ...saved, gastoAtual: 0 }, ...prev]
        })
        setEditing(null)
    }

    const handleDelete = async (id: string) => {
        const res = await fetch('/api/metas', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        if (res.ok) {
            setMetas(prev => prev.filter(m => m.id !== id))
        }
    }

    const handleToggle = async (meta: MetaWithProgress) => {
        const res = await fetch('/api/metas', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: meta.id, ativo: !meta.ativo }),
        })
        if (res.ok) {
            setMetas(prev => prev.map(m => m.id === meta.id ? { ...m, ativo: !m.ativo } : m))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight">Metas</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                        {metas.filter(m => m.ativo).length} meta{metas.filter(m => m.ativo).length !== 1 ? 's' : ''} ativa{metas.filter(m => m.ativo).length !== 1 ? 's' : ''}
                    </p>
                </div>
                <Button
                    onClick={() => { setEditing(null); setFormOpen(true) }}
                    className="rounded-[18px] font-bold bg-foreground text-background hover:opacity-90 gap-2 p-2.5 md:px-4 md:py-2"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Nova Meta</span>
                </Button>
            </div>

            {metas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {metas.map((meta, i) => {
                        const percent = meta.valor_limite > 0
                            ? Math.round((meta.gastoAtual / meta.valor_limite) * 100)
                            : 0
                        const status = percent > 100 ? 'estourada' : percent >= 80 ? 'alerta' : 'ok'

                        return (
                            <motion.div
                                key={meta.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className={cn(
                                    'rounded-[28px] border bg-card/50 backdrop-blur-md shadow-sm transition-all group',
                                    !meta.ativo ? 'opacity-50 border-border/30' : 'border-border/50'
                                )}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="font-bold text-base tracking-tight">{meta.categoria}</h4>
                                                <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
                                                    {PERIODO_LABELS[meta.periodo] || meta.periodo}
                                                </span>
                                            </div>
                                            <div className="flex gap-0.5 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggle(meta)}
                                                    className={cn(
                                                        'p-2.5 md:p-1.5 rounded-lg transition-colors',
                                                        meta.ativo
                                                            ? 'hover:bg-amber-500/10 text-muted-foreground hover:text-amber-500'
                                                            : 'hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500'
                                                    )}
                                                    title={meta.ativo ? 'Desativar' : 'Ativar'}
                                                >
                                                    <Power className="w-4 h-4 md:w-3 md:h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditing(meta); setFormOpen(true) }}
                                                    className="p-2.5 md:p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4 md:w-3 md:h-3" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(meta.id)}
                                                    className="p-2.5 md:p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress */}
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-semibold text-muted-foreground">
                                                    {formatCurrency(meta.gastoAtual)}
                                                </span>
                                                <span className="font-bold">
                                                    {formatCurrency(meta.valor_limite)}
                                                </span>
                                            </div>
                                            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, percent)}%` }}
                                                    transition={{ duration: 0.8, ease: 'circOut' }}
                                                    className={cn(
                                                        'h-full rounded-full',
                                                        status === 'estourada' ? 'bg-red-500' :
                                                        status === 'alerta' ? 'bg-amber-500' :
                                                        'bg-emerald-500'
                                                    )}
                                                />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className={cn(
                                                    'text-[11px] md:text-[10px] font-bold uppercase tracking-widest',
                                                    status === 'estourada' ? 'text-red-500' :
                                                    status === 'alerta' ? 'text-amber-500' :
                                                    'text-emerald-500'
                                                )}>
                                                    {status === 'estourada' ? 'Estourada' :
                                                     status === 'alerta' ? 'Atenção' : 'No limite'}
                                                </span>
                                                <span className="text-[11px] md:text-[10px] font-bold text-muted-foreground">
                                                    {percent}%
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>
            ) : (
                <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md p-10">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                        <div className="p-4 bg-muted/40 rounded-full">
                            <Target className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Nenhuma meta definida</p>
                            <p className="text-xs text-muted-foreground mt-1">Crie metas para controlar seus gastos por categoria.</p>
                        </div>
                    </div>
                </Card>
            )}

            <MetaFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                meta={editing}
                categorias={categorias}
                onSave={handleSave}
            />
        </div>
    )
}
