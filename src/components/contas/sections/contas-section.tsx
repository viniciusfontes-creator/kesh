'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Upload, Wallet, CreditCard, PiggyBank, TrendingUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ContaFormSheet } from '../forms/conta-form-sheet'
import type { Conta } from '@/types/database'

const TIPO_ICONS: Record<string, React.ElementType> = {
    conta_corrente: Wallet,
    poupanca: PiggyBank,
    investimento: TrendingUp,
    cartao_credito: CreditCard,
}

const TIPO_LABELS: Record<string, string> = {
    conta_corrente: 'Conta Corrente',
    poupanca: 'Poupança',
    investimento: 'Investimento',
    cartao_credito: 'Cartão de Crédito',
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

interface ContasSectionProps {
    initialContas: Conta[]
}

export function ContasSection({ initialContas }: ContasSectionProps) {
    const [contas, setContas] = useState(initialContas)
    const [formOpen, setFormOpen] = useState(false)
    const [editingConta, setEditingConta] = useState<Conta | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadContaId, setUploadContaId] = useState<string | null>(null)
    const [uploadContaNome, setUploadContaNome] = useState<string>('')
    const router = useRouter()

    const handleSave = (saved: Conta) => {
        setContas(prev => {
            const exists = prev.find(c => c.id === saved.id)
            if (exists) return prev.map(c => c.id === saved.id ? saved : c)
            return [saved, ...prev]
        })
        setEditingConta(null)
    }

    const handleDelete = async (id: string) => {
        const res = await fetch('/api/contas', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        if (res.ok) {
            setContas(prev => prev.filter(c => c.id !== id))
        }
    }

    const handleUploadClick = (conta: Conta) => {
        setUploadContaId(conta.id)
        setUploadContaNome(conta.nome)
        fileInputRef.current?.click()
    }

    const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = () => {
            const dataUrl = reader.result as string
            sessionStorage.setItem('pendingChatAttachment', JSON.stringify({
                type: 'file',
                mediaType: file.type,
                filename: file.name,
                url: dataUrl,
                accountName: uploadContaNome,
                accountId: uploadContaId,
            }))
            router.push('/chat')
        }
        reader.readAsDataURL(file)

        if (fileInputRef.current) fileInputRef.current.value = ''
    }

    const totalSaldo = contas.reduce((sum, c) => sum + (c.saldo ?? 0), 0)

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight">Suas Contas</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                        {contas.length} {contas.length === 1 ? 'conta' : 'contas'} &middot; Saldo total: {formatCurrency(totalSaldo)}
                    </p>
                </div>
                <Button
                    onClick={() => { setEditingConta(null); setFormOpen(true) }}
                    className="rounded-[18px] font-bold bg-foreground text-background hover:opacity-90 gap-2 p-2.5 md:px-4 md:py-2"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Nova Conta</span>
                </Button>
            </div>

            {/* Hidden file input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={handleFileSelected}
            />

            {/* Cards Grid */}
            {contas.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {contas.map((conta, i) => {
                        const Icon = TIPO_ICONS[conta.tipo] || Wallet
                        return (
                            <motion.div
                                key={conta.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card className="rounded-[28px] border border-border/50 bg-card/50 backdrop-blur-md shadow-sm hover:shadow-md transition-all group">
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className="p-3 rounded-[18px]"
                                                    style={{ backgroundColor: (conta.cor || '#007AFF') + '15' }}
                                                >
                                                    <Icon className="w-5 h-5" style={{ color: conta.cor || '#007AFF' }} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-base tracking-tight">{conta.nome}</h4>
                                                    <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                        {TIPO_LABELS[conta.tipo] || conta.tipo}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingConta(conta); setFormOpen(true) }}
                                                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                                >
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(conta.id)}
                                                    className="p-2 rounded-xl hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="mt-5 flex flex-col md:flex-row items-start md:items-end justify-between gap-3 md:gap-0">
                                            <div>
                                                <span className="text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Saldo</span>
                                                <div className={cn(
                                                    "text-2xl font-bold tracking-tight",
                                                    (conta.saldo ?? 0) >= 0 ? 'text-foreground' : 'text-red-500'
                                                )}>
                                                    {formatCurrency(conta.saldo ?? 0)}
                                                </div>
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleUploadClick(conta)}
                                                className="rounded-xl gap-1.5 text-xs font-bold border-border hover:bg-muted"
                                            >
                                                <Upload className="w-3.5 h-3.5" /> Importar Extrato
                                            </Button>
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
                            <Wallet className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Nenhuma conta cadastrada</p>
                            <p className="text-xs text-muted-foreground mt-1">Crie sua primeira conta para organizar suas finanças.</p>
                        </div>
                    </div>
                </Card>
            )}

            <ContaFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                conta={editingConta}
                onSave={handleSave}
            />
        </div>
    )
}
