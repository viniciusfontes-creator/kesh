'use client'

import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'
import { Brain, MessageSquare, Zap, LayoutGrid, CheckCircle2 } from 'lucide-react'
import { useState, useEffect } from 'react'

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  className?: string
  children?: React.ReactNode
}

function FeatureCard({ title, description, icon, className = '', children }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className={`h-full ${className}`}
    >
      <Card className="h-full p-8 bg-card border-border/40 hover:border-primary/20 transition-colors flex flex-col gap-4 overflow-hidden group">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
          {icon}
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">{title}</h3>
          <p className="text-muted-foreground leading-relaxed">{description}</p>
        </div>
        <div className="mt-auto pt-4 relative">
          {children}
        </div>
      </Card>
    </motion.div>
  )
}

function AIPreview() {
  const [step, setStep] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setStep((v) => (v + 1) % 3)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs border border-border/10">
      <div className="flex items-center justify-between mb-4 border-b border-border/10 pb-2">
        <span className="text-muted-foreground">Transação</span>
        <span className="text-primary flex items-center gap-1">
          <Brain className="w-3 h-3" /> IA
        </span>
      </div>
      <motion.div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-foreground/70">Origin: "UBER *TRIP 10/12"</span>
          <span className="text-foreground">$ 42.00</span>
        </div>
        
        {step >= 1 && (
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 text-primary"
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Processando...</span>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary/20 text-primary px-2 py-1 rounded inline-flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Transporte</span>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}

export function FeatureGrid() {
  return (
    <section id="features" className="py-24 bg-secondary/30">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Inteligência que trabalha para você</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Quatro pilares fundamentais para uma experiência financeira sem atritos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
          <FeatureCard
            title="IA de Categorização"
            description="Limpamos seu extrato automaticamente. De descrições confusas para categorias claras e acionáveis."
            icon={<Brain className="w-5 h-5" />}
          >
            <AIPreview />
          </FeatureCard>

          <FeatureCard
            title="Chat Conversacional"
            description="Um tutor financeiro disponível 24/7. Pergunte sobre seus gastos, peça dicas ou gere relatórios instantâneos."
            icon={<MessageSquare className="w-5 h-5" />}
          >
            <div className="space-y-2 opacity-50 group-hover:opacity-100 transition-opacity">
                <div className="bg-muted rounded-full h-8 w-3/4 ml-auto rounded-tr-none px-4 flex items-center text-[10px]">Quanto gastei no iFood?</div>
                <div className="bg-primary/20 rounded-full h-8 w-3/4 mr-auto rounded-tl-none px-4 flex items-center text-[10px] text-primary">Você gastou R$ 450 este mês.</div>
            </div>
          </FeatureCard>

          <FeatureCard
            title="Importação Inteligente"
            description="Processamento de extratos bancários (OFX, PDF) sem fricção. Arraste e deixe que a Kesh faça o trabalho sujo."
            icon={<Zap className="w-5 h-5" />}
          >
             <div className="border-2 border-dashed border-primary/20 rounded-xl h-24 flex items-center justify-center">
                <LayoutGrid className="w-6 h-6 text-primary/30 animate-bounce" />
             </div>
          </FeatureCard>

          <FeatureCard
            title="Contas Ilimitadas"
            description="Organização total. Separe suas finanças pessoais das profissionais e tenha uma visão clara de todo o seu patrimônio."
            icon={<LayoutGrid className="w-5 h-5" />}
          >
            <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Nubank', color: 'bg-purple-500/10 text-purple-500' },
                  { name: 'Bradesco', color: 'bg-red-500/10 text-red-500' },
                  { name: 'Itaú', color: 'bg-orange-500/10 text-orange-500' },
                  { name: 'XP', color: 'bg-yellow-500/10 text-yellow-500' },
                  { name: 'Binance', color: 'bg-yellow-400/10 text-yellow-600' },
                ].map((account, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold border border-current/20 ${account.color}`}
                    >
                      {account.name}
                    </motion.div>
                ))}
                <div className="px-3 py-1 rounded-full text-[10px] font-bold border border-dashed border-muted-foreground/30 text-muted-foreground/50">
                  + Adicionar
                </div>
            </div>
          </FeatureCard>
        </div>
      </div>
    </section>
  )
}
