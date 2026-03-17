'use client'

import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Conta } from '@/types/database'

const TIPO_OPTIONS = [
    { value: 'conta_corrente', label: 'Conta Corrente' },
    { value: 'poupanca', label: 'Poupança' },
    { value: 'investimento', label: 'Investimento' },
    { value: 'cartao_credito', label: 'Cartão de Crédito' },
] as const

const CORES = ['#007AFF', '#05C168', '#FF453A', '#FF9F0A', '#AF52DE', '#5856D6', '#64D2FF', '#FF6482']

interface ContaFormSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    conta?: Conta | null
    onSave: (conta: Conta) => void
}

export function ContaFormSheet({ open, onOpenChange, conta, onSave }: ContaFormSheetProps) {
    const [nome, setNome] = useState('')
    const [tipo, setTipo] = useState<string>('conta_corrente')
    const [saldo, setSaldo] = useState('')
    const [cor, setCor] = useState(CORES[0])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (conta) {
            setNome(conta.nome)
            setTipo(conta.tipo)
            setSaldo(String(conta.saldo ?? 0))
            setCor(conta.cor || CORES[0])
        } else {
            setNome('')
            setTipo('conta_corrente')
            setSaldo('')
            setCor(CORES[0])
        }
    }, [conta, open])

    const handleSubmit = async () => {
        if (!nome.trim()) return
        setLoading(true)

        try {
            const body = {
                ...(conta ? { id: conta.id } : {}),
                nome: nome.trim(),
                tipo,
                saldo: parseFloat(saldo) || 0,
                cor,
            }

            const res = await fetch('/api/contas', {
                method: conta ? 'PATCH' : 'POST',
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
                        {conta ? 'Editar Conta' : 'Nova Conta'}
                    </SheetTitle>
                </SheetHeader>

                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome</Label>
                        <Input
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: Nubank, Itaú, Carteira"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Tipo</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {TIPO_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setTipo(opt.value)}
                                    className={`px-4 py-3 rounded-2xl text-xs font-bold transition-all border ${
                                        tipo === opt.value
                                            ? 'bg-foreground text-background border-foreground shadow-lg shadow-foreground/20'
                                            : 'bg-muted/30 text-muted-foreground border-border/50 hover:bg-muted hover:text-foreground'
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                            {conta ? 'Saldo Atual' : 'Saldo Inicial'}
                        </Label>
                        <Input
                            type="number"
                            step="0.01"
                            value={saldo}
                            onChange={(e) => setSaldo(e.target.value)}
                            placeholder="0,00"
                        />
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
                </div>

                <SheetFooter className="p-6 border-t border-border">
                    <Button
                        onClick={handleSubmit}
                        disabled={!nome.trim() || loading}
                        className="w-full h-12 rounded-[18px] font-bold bg-foreground text-background hover:opacity-90"
                    >
                        {loading ? 'Salvando...' : conta ? 'Salvar Alterações' : 'Criar Conta'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    )
}
