'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Edit2, Trash2, Tag } from 'lucide-react'
import { motion } from 'framer-motion'
import { CategoriaFormSheet } from '../forms/categoria-form-sheet'
import type { Categoria } from '@/types/database'

interface CategoriasSectionProps {
    initialCategorias: Categoria[]
}

export function CategoriasSection({ initialCategorias }: CategoriasSectionProps) {
    const [categorias, setCategorias] = useState(initialCategorias)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<Categoria | null>(null)

    const handleSave = (saved: Categoria) => {
        setCategorias(prev => {
            const exists = prev.find(c => c.id === saved.id)
            if (exists) return prev.map(c => c.id === saved.id ? saved : c)
            return [saved, ...prev]
        })
        setEditing(null)
    }

    const handleDelete = async (id: string) => {
        const res = await fetch('/api/categorias', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        })
        if (res.ok) {
            setCategorias(prev => prev.filter(c => c.id !== id))
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold tracking-tight">Categorias</h3>
                    <p className="text-sm text-muted-foreground font-medium">
                        {categorias.length} {categorias.length === 1 ? 'categoria' : 'categorias'}
                    </p>
                </div>
                <Button
                    onClick={() => { setEditing(null); setFormOpen(true) }}
                    className="rounded-[18px] font-bold bg-foreground text-background hover:opacity-90 gap-2 p-2.5 md:px-4 md:py-2"
                >
                    <Plus className="w-4 h-4" /> <span className="hidden md:inline">Nova Categoria</span>
                </Button>
            </div>

            {categorias.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {categorias.map((cat, i) => (
                        <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                        >
                            <Card className="rounded-[22px] border border-border/40 bg-card/50 hover:shadow-md transition-all group">
                                <CardContent className="p-5">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-4 h-4 rounded-lg shrink-0"
                                                style={{ backgroundColor: cat.cor || '#888' }}
                                            />
                                            <div>
                                                <span className="font-bold text-sm">{cat.nome}</span>
                                                {cat.tipo && (
                                                    <span className="block text-[11px] md:text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mt-0.5">
                                                        {cat.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5 opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                onClick={() => { setEditing(cat); setFormOpen(true) }}
                                                className="p-2.5 md:p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4 md:w-3 md:h-3" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(cat.id)}
                                                className="p-2.5 md:p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4 md:w-3 md:h-3" />
                                            </button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md p-10">
                    <div className="flex flex-col items-center justify-center text-center gap-4">
                        <div className="p-4 bg-muted/40 rounded-full">
                            <Tag className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="text-sm font-bold">Nenhuma categoria criada</p>
                            <p className="text-xs text-muted-foreground mt-1">Categorias ajudam a organizar seus registros.</p>
                        </div>
                    </div>
                </Card>
            )}

            <CategoriaFormSheet
                open={formOpen}
                onOpenChange={setFormOpen}
                categoria={editing}
                onSave={handleSave}
            />
        </div>
    )
}
