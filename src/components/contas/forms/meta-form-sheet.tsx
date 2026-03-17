'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Meta, Categoria } from '@/types/database'

interface MetaFormSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    meta?: Meta | null
    categorias: Categoria[]
    onSave: (meta: Meta) => void
}

export function MetaFormSheet({ open, onOpenChange, meta, categorias, onSave }: MetaFormSheetProps) {
    const [categoria, setCategoria] = useState('')
    const [valorLimite, setValorLimite] = useState('')
    const [periodo, setPeriodo] = useState<string>('mensal')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (meta) {
            setCategoria(meta.categoria)
            setValorLimite(String(meta.valor_limite))
            setPeriodo(meta.periodo)
        } else {
            setCategoria('')
            setValorLimite('')
            setPeriodo('mensal')
        }
    }, [meta, open])

    const handleSubmit = async () => {
        if (!categoria.trim() || !valorLimite) return
        setLoading(true)

        try {
            const body = {
                ...(meta ? { id: meta.id } : {}),
                categoria: categoria.trim(),
                valor_limite: parseFloat(valorLimite),
                periodo,
            }

            const res = await fetch('/api/metas', {
                method: meta ? 'PATCH' : 'POST',
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

    const saidaCategorias = categorias.filter(c => !c.tipo || c.tipo === 'saida')

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="p-6 border-b border-border">
                    <SheetTitle className="text-xl font-bold tracking-tight">
                        {meta ? 'Editar Meta' : 'Nova Meta'}
                    </SheetTitle>
                </SheetHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Categoria</Label>
                        {saidaCategorias.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2">
                                {saidaCategorias.map((c) => (
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
                        )}
                        <Input
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            placeholder="Digite ou selecione acima"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Valor Limite (R$)</Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={valorLimite}
                            onChange={(e) => setValorLimite(e.target.value)}
                            placeholder="0,00"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Período</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {(['semanal', 'mensal', 'anual'] as const).map((p) => (
                                <button
                                    key={p}
                                    type="button"
                                    onClick={() => setPeriodo(p)}
                                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                                        periodo === p
                                            ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/20'
                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
                                    }`}
                                >
                                    {p.charAt(0).toUpperCase() + p.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <SheetFooter className="p-6 border-t border-border">
                    <Button
                        onClick={handleSubmit}
                        disabled={!categoria.trim() || !valorLimite || loading}
                        className="w-full h-12 rounded-[18px] font-bold bg-foreground text-background hover:opacity-90"
                    >
                        {loading ? 'Salvando...' : meta ? 'Salvar Alterações' : 'Criar Meta'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
