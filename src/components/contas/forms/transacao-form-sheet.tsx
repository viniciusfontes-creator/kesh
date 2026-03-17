'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Transaction, Categoria, Conta } from '@/types/database'

interface TransacaoFormSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    transacao?: Transaction | null
    categorias: Categoria[]
    contas: Conta[]
    onSave: (transacao: Transaction) => void
}

export function TransacaoFormSheet({ open, onOpenChange, transacao, categorias, contas, onSave }: TransacaoFormSheetProps) {
    const [tipo, setTipo] = useState<'entrada' | 'saida'>('saida')
    const [valor, setValor] = useState('')
    const [categoria, setCategoria] = useState('')
    const [descricao, setDescricao] = useState('')
    const [data, setData] = useState('')
    const [status, setStatus] = useState<'pago' | 'pendente'>('pago')
    const [dataVencimento, setDataVencimento] = useState('')
    const [contaId, setContaId] = useState('')
    const [isRecurring, setIsRecurring] = useState(false)
    const [frequency, setFrequency] = useState<string>('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (transacao) {
            setTipo(transacao.tipo)
            setValor(String(transacao.valor))
            setCategoria(transacao.categoria)
            setDescricao(transacao.descricao || '')
            setData(transacao.data)
            setStatus(transacao.status)
            setDataVencimento(transacao.data_vencimento || '')
            setContaId(transacao.conta_id || '')
            setIsRecurring(transacao.is_recurring)
            setFrequency(transacao.frequency || '')
        } else {
            setTipo('saida')
            setValor('')
            setCategoria('')
            setDescricao('')
            setData(new Date().toISOString().split('T')[0])
            setStatus('pago')
            setDataVencimento('')
            setContaId('')
            setIsRecurring(false)
            setFrequency('')
        }
    }, [transacao, open])

    const handleSubmit = async () => {
        if (!valor || !categoria.trim()) return
        setLoading(true)

        try {
            const body = {
                ...(transacao ? { id: transacao.id } : {}),
                tipo,
                valor: parseFloat(valor),
                categoria: categoria.trim(),
                descricao: descricao.trim() || null,
                data,
                status,
                data_vencimento: status === 'pendente' ? dataVencimento || null : null,
                conta_id: contaId || null,
                is_recurring: isRecurring,
                frequency: isRecurring ? frequency || null : null,
            }

            const res = await fetch('/api/transactions', {
                method: transacao ? 'PATCH' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                const saved = await res.json()
                onSave(saved)
                onOpenChange(false)
            }
        } finally {
            setLoading(false)
        }
    }

    const filteredCategorias = categorias.filter(c => !c.tipo || c.tipo === tipo)

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="p-6 border-b border-border">
                    <SheetTitle className="text-xl font-bold tracking-tight">
                        {transacao ? 'Editar Transação' : 'Nova Transação'}
                    </SheetTitle>
                </SheetHeader>

                <div className="p-6 space-y-5">
                    {/* Tipo */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['entrada', 'saida'] as const).map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setTipo(t)}
                                    className={`px-4 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                        tipo === t
                                            ? t === 'entrada'
                                                ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/20'
                                                : 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20'
                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
                                    }`}
                                >
                                    {t === 'entrada' ? 'Entrada' : 'Saída'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Valor */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Valor (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={valor}
                            onChange={(e) => setValor(e.target.value)}
                            placeholder="0,00"
                        />
                    </div>

                    {/* Categoria */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</Label>
                        {filteredCategorias.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {filteredCategorias.map((c) => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => setCategoria(c.nome)}
                                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all border ${
                                            categoria === c.nome
                                                ? 'bg-foreground text-background border-foreground'
                                                : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
                                        }`}
                                    >
                                        <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: c.cor || '#888' }} />
                                        {c.nome}
                                    </button>
                                ))}
                            </div>
                        ) : null}
                        <Input
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            placeholder="Digite ou selecione acima"
                        />
                    </div>

                    {/* Descrição */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Descrição</Label>
                        <Input
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            placeholder="Opcional"
                        />
                    </div>

                    {/* Data */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Data</Label>
                        <Input
                            type="date"
                            value={data}
                            onChange={(e) => setData(e.target.value)}
                        />
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Status</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {(['pago', 'pendente'] as const).map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                                        status === s
                                            ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/20'
                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
                                    }`}
                                >
                                    {s === 'pago' ? 'Pago' : 'Pendente'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Data vencimento (se pendente) */}
                    {status === 'pendente' && (
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Data de Vencimento</Label>
                            <Input
                                type="date"
                                value={dataVencimento}
                                onChange={(e) => setDataVencimento(e.target.value)}
                            />
                        </div>
                    )}

                    {/* Conta */}
                    {contas.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Conta</Label>
                            <select
                                value={contaId}
                                onChange={(e) => setContaId(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-foreground/20"
                            >
                                <option value="">Nenhuma</option>
                                {contas.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Recorrência */}
                    <div className="space-y-3">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isRecurring}
                                onChange={(e) => setIsRecurring(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-border accent-foreground"
                            />
                            <span className="text-sm font-bold">Transação recorrente</span>
                        </label>

                        {isRecurring && (
                            <div className="grid grid-cols-3 gap-2">
                                {(['semanal', 'mensal', 'anual'] as const).map((f) => (
                                    <button
                                        key={f}
                                        type="button"
                                        onClick={() => setFrequency(f)}
                                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                            frequency === f
                                                ? 'bg-foreground text-background border-foreground'
                                                : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
                                        }`}
                                    >
                                        {f.charAt(0).toUpperCase() + f.slice(1)}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <SheetFooter className="p-6 border-t border-border">
                    <Button
                        onClick={handleSubmit}
                        disabled={!valor || !categoria.trim() || loading}
                        className="w-full h-12 rounded-[18px] font-bold bg-foreground text-background hover:opacity-90"
                    >
                        {loading ? 'Salvando...' : transacao ? 'Salvar Alterações' : 'Criar Transação'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
