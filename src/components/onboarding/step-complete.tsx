'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Check, LayoutDashboard, MessageCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface StepCompleteProps {
    importedCount: number
}

export function StepComplete({ importedCount }: StepCompleteProps) {
    const router = useRouter()
    const [completing, setCompleting] = useState(true)

    useEffect(() => {
        async function complete() {
            try {
                await fetch('/api/onboarding/complete', { method: 'POST' })
            } catch {
                // Non-blocking — worst case middleware will handle it
            } finally {
                setCompleting(false)
            }
        }
        complete()
    }, [])

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[480px] text-center"
        >
            {/* Animated checkmark */}
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
                className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 mb-8"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: 'spring', stiffness: 300, damping: 20 }}
                >
                    <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                </motion.div>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="space-y-3 mb-10"
            >
                <h2 className="text-3xl font-bold tracking-tight text-foreground">
                    Tudo pronto!
                </h2>
                <p className="text-base text-muted-foreground">
                    Bem-vindo ao <span className="font-black italic text-foreground">Kesh</span>
                </p>

                {importedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mt-4"
                    >
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            {importedCount} transações importadas
                        </span>
                    </motion.div>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="space-y-3"
            >
                <Button
                    onClick={() => router.push('/dashboard')}
                    disabled={completing}
                    className="w-full h-14 bg-foreground text-background rounded-2xl font-bold shadow-xl shadow-foreground/5 active:scale-95 transition-all text-base"
                >
                    {completing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <>
                            <LayoutDashboard className="w-5 h-5 mr-2" />
                            Ir para o Dashboard
                        </>
                    )}
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => router.push('/chat')}
                    disabled={completing}
                    className="w-full h-12 rounded-2xl text-muted-foreground hover:text-foreground font-medium"
                >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Conversar com a IA
                </Button>
            </motion.div>
        </motion.div>
    )
}
