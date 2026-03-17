'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Loader2 } from 'lucide-react'

interface ProfileData {
    nome_completo: string
    email: string
    telefone: string
    cpf: string
}

interface StepProfileProps {
    initialData: ProfileData
    onComplete: () => void
}

function formatCPF(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function formatPhone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    if (digits.length <= 2) return digits
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function isValidCPF(cpf: string) {
    const digits = cpf.replace(/\D/g, '')
    return digits.length === 11
}

function isValidPhone(phone: string) {
    const digits = phone.replace(/\D/g, '')
    return digits.length >= 10 && digits.length <= 11
}

export function StepProfile({ initialData, onComplete }: StepProfileProps) {
    const [form, setForm] = useState<ProfileData>({
        nome_completo: initialData.nome_completo || '',
        email: initialData.email || '',
        telefone: initialData.telefone ? formatPhone(initialData.telefone) : '',
        cpf: initialData.cpf ? formatCPF(initialData.cpf) : '',
    })
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const isValid = form.nome_completo.trim().length >= 2 &&
        form.email.includes('@') &&
        isValidPhone(form.telefone) &&
        isValidCPF(form.cpf)

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!isValid) return

        setSaving(true)
        setError('')

        try {
            const res = await fetch('/api/onboarding/profile', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nome_completo: form.nome_completo.trim(),
                    telefone: form.telefone.replace(/\D/g, ''),
                    cpf: form.cpf.replace(/\D/g, ''),
                    onboarding_step: 1,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Erro ao salvar')
            }

            onComplete()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar. Tente novamente.')
        } finally {
            setSaving(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[480px]"
        >
            <div className="space-y-3 text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted/60 border border-border/50 mb-2">
                    <User className="w-7 h-7 text-foreground" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Complete seu perfil
                </h2>
                <p className="text-sm text-muted-foreground max-w-[320px] mx-auto">
                    Precisamos de algumas informações para personalizar sua experiência.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 bg-card/40 backdrop-blur-3xl p-8 rounded-[32px] border border-border/50 shadow-xl shadow-black/5">
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="nome" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                            Nome Completo
                        </Label>
                        <Input
                            id="nome"
                            value={form.nome_completo}
                            onChange={e => setForm(f => ({ ...f, nome_completo: e.target.value }))}
                            placeholder="Seu nome completo"
                            required
                            className="h-14 bg-muted/50 border-border/50 rounded-2xl px-5 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-foreground/20 shadow-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                            Email
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={form.email}
                            disabled
                            className="h-14 bg-muted/30 border-border/30 rounded-2xl px-5 text-muted-foreground shadow-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="telefone" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                            Telefone
                        </Label>
                        <Input
                            id="telefone"
                            value={form.telefone}
                            onChange={e => setForm(f => ({ ...f, telefone: formatPhone(e.target.value) }))}
                            placeholder="(11) 99999-9999"
                            required
                            className="h-14 bg-muted/50 border-border/50 rounded-2xl px-5 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-foreground/20 shadow-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="cpf" className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/80 px-1">
                            CPF
                        </Label>
                        <Input
                            id="cpf"
                            value={form.cpf}
                            onChange={e => setForm(f => ({ ...f, cpf: formatCPF(e.target.value) }))}
                            placeholder="000.000.000-00"
                            required
                            className="h-14 bg-muted/50 border-border/50 rounded-2xl px-5 text-foreground placeholder:text-muted-foreground/30 focus-visible:ring-foreground/20 shadow-none transition-all"
                        />
                        <p className="text-[10px] text-muted-foreground/50 px-1">
                            Exigido para conformidade regulatória. Seus dados são criptografados.
                        </p>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button
                    type="submit"
                    disabled={!isValid || saving}
                    className="w-full h-14 bg-foreground text-background rounded-2xl font-bold shadow-xl shadow-foreground/5 active:scale-95 transition-all text-base disabled:opacity-40"
                >
                    {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continuar'}
                </Button>
            </form>
        </motion.div>
    )
}
