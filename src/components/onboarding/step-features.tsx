'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, MessageCircle, Wallet, Globe, ChevronRight, ChevronLeft } from 'lucide-react'

const features = [
    {
        icon: LayoutDashboard,
        title: 'Dashboard Inteligente',
        description: 'Visualize suas finanças com gráficos interativos. Acompanhe receitas, despesas e projeções para os próximos meses.',
        color: 'from-blue-500/20 to-blue-600/10',
    },
    {
        icon: MessageCircle,
        title: 'Chat com IA',
        description: 'Converse com sua inteligência financeira. Adicione transações, consulte saldos e receba insights — tudo por texto ou voz.',
        color: 'from-purple-500/20 to-purple-600/10',
    },
    {
        icon: Wallet,
        title: 'Gestão de Contas',
        description: 'Organize suas contas, categorize transações e defina metas de orçamento. Tudo em um só lugar, simples e visual.',
        color: 'from-emerald-500/20 to-emerald-600/10',
    },
    {
        icon: Globe,
        title: 'Open Finance',
        description: 'Em breve: conecte seus bancos automaticamente e sincronize suas transações em tempo real.',
        color: 'from-amber-500/20 to-amber-600/10',
    },
]

interface StepFeaturesProps {
    onComplete: () => void
    onSkip: () => void
}

export function StepFeatures({ onComplete, onSkip }: StepFeaturesProps) {
    const [current, setCurrent] = useState(0)
    const [direction, setDirection] = useState(1)

    function next() {
        if (current === features.length - 1) {
            onComplete()
        } else {
            setDirection(1)
            setCurrent(c => c + 1)
        }
    }

    function prev() {
        if (current > 0) {
            setDirection(-1)
            setCurrent(c => c - 1)
        }
    }

    const feature = features[current]
    const Icon = feature.icon
    const isLast = current === features.length - 1

    return (
        <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="w-full max-w-[480px]"
        >
            <div className="space-y-3 text-center mb-8">
                <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    Conheça o Kesh
                </h2>
                <p className="text-sm text-muted-foreground">
                    Veja o que você pode fazer com sua inteligência financeira.
                </p>
            </div>

            <div className="bg-card/40 backdrop-blur-3xl p-8 rounded-[32px] border border-border/50 shadow-xl shadow-black/5">
                {/* Progress dots */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {features.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? 'w-8 bg-foreground' : 'w-1.5 bg-muted-foreground/20'}`}
                        />
                    ))}
                </div>

                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={current}
                        custom={direction}
                        initial={{ opacity: 0, x: direction * 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: direction * -60 }}
                        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                        className="text-center space-y-5"
                    >
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br ${feature.color} border border-border/30`}>
                            <Icon className="w-9 h-9 text-foreground" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-foreground">{feature.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed max-w-[360px] mx-auto">
                                {feature.description}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div className="flex items-center justify-between mt-10 gap-3">
                    <Button
                        variant="ghost"
                        onClick={prev}
                        disabled={current === 0}
                        className="h-12 px-4 rounded-2xl text-muted-foreground disabled:opacity-0"
                    >
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Voltar
                    </Button>

                    <Button
                        onClick={next}
                        className="h-12 px-8 bg-foreground text-background rounded-2xl font-bold shadow-lg shadow-foreground/5 active:scale-95 transition-all"
                    >
                        {isLast ? 'Continuar' : 'Próximo'}
                        {!isLast && <ChevronRight className="w-4 h-4 ml-1" />}
                    </Button>
                </div>
            </div>

            <div className="text-center mt-6">
                <button
                    onClick={onSkip}
                    className="text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors font-medium"
                >
                    Pular introdução
                </button>
            </div>
        </motion.div>
    )
}
