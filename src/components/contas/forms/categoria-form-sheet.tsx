'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Categoria } from '@/types/database'

const CORES = ['#007AFF', '#05C168', '#FF453A', '#FF9F0A', '#AF52DE', '#5856D6', '#64D2FF', '#FF6482', '#30D158', '#FFD60A']

interface CategoriaFormSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    categoria?: Categoria | null
    onSave: (categoria: Categoria) => void
}

export function CategoriaFormSheet({ open, onOpenChange, categoria, onSave }: CategoriaFormSheetProps) {
    const [nome, setNome] = useState('')
    const [tipo, setTipo] = useState<string>('')
    const [cor, setCor] = useState(CORES[0])
    const [icone, setIcone] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (categoria) {
            setNome(categoria.nome)
            setTipo(categoria.tipo || '')
            setCor(categoria.cor || CORES[0])
            setIcone(categoria.icone || '')
        } else {
            setNome('')
            setTipo('')
            setCor(CORES[0])
            setIcone('')
        }
    }, [categoria, open])

    const handleSubmit = async () => {
        if (!nome.trim()) return
        setLoading(true)

        try {
            const body = {
                ...(categoria ? { id: categoria.id } : {}),
                nome: nome.trim(),
                tipo: tipo || null,
                cor,
                icone: icone.trim() || null,
            }

            const res = await fetch('/api/categorias', {
                method: categoria ? 'PATCH' : 'POST',
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

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
                <SheetHeader className="p-6 border-b border-border">
                    <SheetTitle className="text-xl font-bold tracking-tight">
                        {categoria ? 'Editar Categoria' : 'Nova Categoria'}
                    </SheetTitle>
                </SheetHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome</Label>
                        <Input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Alimentação, Transporte"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</Label>
                        <div className="grid grid-cols-3 gap-2">
                            {[
                                { value: '', label: 'Ambos' },
                                { value: 'entrada', label: 'Entrada' },
                                { value: 'saida', label: 'Saída' },
                            ].map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setTipo(opt.value)}
                                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                                        tipo === opt.value
                                            ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/20'
                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cor</Label>
                        <div className="flex gap-2 flex-wrap">
                            {CORES.map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setCor(c)}
                                    className={`w-9 h-9 rounded-xl transition-all ${
                                        cor === c ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110' : 'hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Ícone (opcional)</Label>
                        <Input
                            value={icone}
                            onChange={(e) => setIcone(e.target.value)}
                            placeholder="Ex: shopping-cart, utensils"
                        />
                    </div>
                </div>

                <SheetFooter className="p-6 border-t border-border">
                    <Button
                        onClick={handleSubmit}
                        disabled={!nome.trim() || loading}
                        className="w-full h-12 rounded-[18px] font-bold bg-foreground text-background hover:opacity-90"
                    >
                        {loading ? 'Salvando...' : categoria ? 'Salvar Alterações' : 'Criar Categoria'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
