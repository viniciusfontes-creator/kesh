'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wallet, ArrowLeftRight, Tag, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ContasSection } from './sections/contas-section'
import { TransacoesSection } from './sections/transacoes-section'
import { CategoriasSection } from './sections/categorias-section'
import { MetasSection, type MetaWithProgress } from './sections/metas-section'
import type { Conta, Transaction, Categoria } from '@/types/database'

const tabs = [
    { key: 'contas', label: 'Contas', icon: Wallet },
    { key: 'transacoes', label: 'Transações', icon: ArrowLeftRight },
    { key: 'categorias', label: 'Categorias', icon: Tag },
    { key: 'metas', label: 'Metas', icon: Target },
] as const

type TabKey = typeof tabs[number]['key']

interface ContasClientProps {
    contas: Conta[]
    transactions: Transaction[]
    categorias: Categoria[]
    metas: MetaWithProgress[]
}

export function ContasClient({ contas, transactions, categorias, metas }: ContasClientProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('contas')

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col min-h-full w-full p-6 md:px-12 md:py-10 space-y-8 max-w-5xl mx-auto pb-32 md:pb-12"
        >
            {/* Header */}
            <header className="flex flex-col gap-2">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2"
                >
                    <span className="w-2 h-8 bg-foreground rounded-full" />
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-foreground">Contas & Transações</h1>
                </motion.div>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="text-sm md:text-[17px] text-muted-foreground font-medium max-w-2xl leading-relaxed"
                >
                    Gerencie suas contas, transações, categorias e metas financeiras.
                </motion.p>
            </header>

            {/* Sub-tabs */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-4 md:flex items-center gap-1 md:gap-1.5 p-1 md:p-1.5 bg-muted/20 rounded-[24px] md:rounded-[28px] w-full md:w-fit relative"
            >
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={cn(
                            'relative flex flex-col md:flex-row items-center gap-1 md:gap-2.5 px-1 md:px-6 py-2 md:py-3 rounded-[20px] md:rounded-[22px] text-[10px] md:text-sm font-bold transition-colors outline-none group flex-1 justify-center',
                            activeTab === tab.key
                                ? 'text-background'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {activeTab === tab.key && (
                            <motion.div
                                layoutId="active-tab-contas"
                                className="absolute inset-0 bg-foreground rounded-[20px] md:rounded-[22px] shadow-md shadow-foreground/10"
                                transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                            />
                        )}
                        <tab.icon className={cn("w-3.5 h-3.5 md:w-4 md:h-4 relative z-10 transition-transform", activeTab === tab.key ? "" : "group-hover:scale-110")} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 300 / 1000, ease: 'easeOut' }}
                    className="pt-6"
                >
                    {activeTab === 'contas' && (
                        <ContasSection initialContas={contas} />
                    )}
                    {activeTab === 'transacoes' && (
                        <TransacoesSection
                            initialTransactions={transactions}
                            categorias={categorias}
                            contas={contas}
                        />
                    )}
                    {activeTab === 'categorias' && (
                        <CategoriasSection initialCategorias={categorias} />
                    )}
                    {activeTab === 'metas' && (
                        <MetasSection initialMetas={metas} categorias={categorias} />
                    )}
                </motion.div>
            </AnimatePresence>
        </motion.div>
    )
}
