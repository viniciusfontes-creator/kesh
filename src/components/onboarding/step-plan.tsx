'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PricingCard } from '@/components/subscription/pricing-card'

interface StepPlanProps {
  onComplete: () => void
  onSkip: () => void
}

export function StepPlan({ onComplete, onSkip }: StepPlanProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)

  const plans = [
    {
      name: 'Mensal',
      price: 'R$ 15,00',
      period: '/mês',
      description: 'Gestão essencial.',
      features: ['Categorização por IA', 'Dashboard Completo', 'Até 5 Contas'],
      stripePriceId: 'price_1TC6PBFz7A1qFfrQxpfZJMdU',
      popular: false,
    },
    {
      name: 'Trimestral',
      price: 'R$ 30,00',
      period: '/trimestre',
      description: 'Ideal para disciplina.',
      features: ['Tudo do mensal', 'Suporte Prioritário', 'Análises Avançadas'],
      stripePriceId: 'price_1TC6PBFz7A1qFfrQtSPzk26x',
      popular: true,
    },
    {
      name: 'Anual',
      price: 'R$ 100,00',
      period: '/ano',
      description: 'Liberdade total.',
      features: ['Tudo do trimestral', 'Faturamento por IA', 'Consultoria Personalizada'],
      stripePriceId: 'price_1TC6PBFz7A1qFfrQ8Na74XcQ',
      popular: false,
    },
  ]

  async function handleSubscribe(priceId: string) {
    try {
      setLoading(true)
      setSelectedPriceId(priceId)

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId }),
      })

      const data = await response.json()

      if (data.error) {
        alert(`Erro: ${data.error}`)
        return
      }

      if (data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
      setLoading(false)
      setSelectedPriceId(null)
    }
  }

  return (
    <motion.div
      key="plan"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-full"
    >
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Escolha o Melhor Plano</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Ou experimente gratuitamente com acesso limitado. Você pode fazer upgrade a qualquer
          momento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <PricingCard
              {...plan}
              onSubscribe={handleSubscribe}
              loading={loading && selectedPriceId === plan.stripePriceId}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center">
        <Button variant="outline" onClick={onSkip} disabled={loading} className="rounded-full">
          Pular por enquanto
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Ao pular, você terá acesso ao plano gratuito com 5 interações/mês e 1 conta bancária.
      </p>
    </motion.div>
  )
}
