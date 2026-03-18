'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Wallet, Calendar, Filter, Plus } from 'lucide-react'

export function DashboardMockup() {
  const [view, setView] = useState<'overview' | 'accounts'>('overview')

  useEffect(() => {
    const timer = setInterval(() => {
      setView((v) => (v === 'overview' ? 'accounts' : 'overview'))
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full h-full bg-background border border-border/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between bg-card/50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground font-bold">K</div>
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mini */}
        <div className="w-16 border-r border-border/40 flex flex-col items-center py-6 gap-6 bg-card/30">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className={`w-8 h-8 rounded ${i === 1 && view === 'overview' || i === 2 && view === 'accounts' ? 'bg-primary/20 text-primary' : 'bg-muted/50'} flex items-center justify-center`}>
              <div className="w-4 h-4 rounded-sm bg-current opacity-50" />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
          <AnimatePresence mode="wait">
            {view === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-end">
                    <div>
                        <h3 className="text-xl font-bold">Visão Geral</h3>
                        <p className="text-xs text-muted-foreground">Análise inteligente do seu patrimônio.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="h-8 w-24 bg-muted rounded-md border border-border/50" />
                        <div className="h-8 w-8 bg-muted rounded-md border border-border/50" />
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'SALDO GERAL', value: 'R$ 13.089,21', color: 'text-foreground' },
                    { label: 'ENTRADAS', value: 'R$ 2.115,86', color: 'text-green-500' },
                    { label: 'SAÍDAS', value: 'R$ 2.437,95', color: 'text-red-500' },
                    { label: 'RECORRENTE', value: 'R$ 2.035,10', color: 'text-blue-500' },
                  ].map((stat, i) => (
                    <Card key={i} className="p-4 bg-card/50 border-border/40">
                      <p className="text-[10px] font-bold text-muted-foreground mb-1">{stat.label}</p>
                      <p className={`text-sm font-bold ${stat.color}`}>{stat.value}</p>
                    </Card>
                  ))}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="p-4 bg-card/50 border-border/40 h-48 flex flex-col">
                        <p className="text-xs font-bold mb-4">Fluxo Mensal</p>
                        <div className="flex-1 flex items-end gap-2 px-2">
                            {[40, 60, 30, 80, 50, 90].map((h, i) => (
                                <div key={i} className="flex-1 bg-primary/20 rounded-t-sm" style={{ height: `${h}%` }} />
                            ))}
                        </div>
                    </Card>
                    <Card className="p-4 bg-card/50 border-border/40 h-48 flex flex-col">
                        <p className="text-xs font-bold mb-4">Evolução Patrimonial</p>
                        <svg className="flex-1 w-full" viewBox="0 0 200 100">
                            <path d="M0,80 Q50,70 100,40 T200,20" fill="none" stroke="currentColor" strokeWidth="2" className="text-primary" />
                        </svg>
                    </Card>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="accounts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold">Contas & Transações</h3>
                    <div className="px-3 py-1 bg-primary text-primary-foreground text-[10px] font-bold rounded">+ Nova Conta</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { bank: 'Banco do Brasil', type: 'CONTA CORRENTE', balance: 'R$ 13,80' },
                        { bank: 'Porto Seguro', type: 'CARTÃO DE CRÉDITO', balance: 'R$ 400,00' },
                        { bank: 'XP Corretora', type: 'INVESTIMENTO', balance: 'R$ 10.021,00' },
                        { bank: 'Mercado Bitcoin', type: 'CRIPTOMOEDAS', balance: 'R$ 2.300,00' },
                    ].map((acc, i) => (
                        <Card key={i} className="p-4 bg-card/50 border-border/40 hover:border-primary/30 transition-colors cursor-pointer">
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                                    <Wallet className="w-4 h-4 text-primary" />
                                </div>
                                <div className="h-4 w-4 rounded-full border border-border" />
                            </div>
                            <p className="text-[10px] font-bold">{acc.bank}</p>
                            <p className="text-[8px] text-muted-foreground mb-2">{acc.type}</p>
                            <p className="text-lg font-bold">{acc.balance}</p>
                        </Card>
                    ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
