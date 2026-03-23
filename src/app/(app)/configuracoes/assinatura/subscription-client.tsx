'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { Check, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PricingCard } from '@/components/subscription/pricing-card'
import { SubscriptionStatusBadge } from '@/components/subscription/subscription-status'
import type { UserSubscription } from '@/lib/subscription'
import type { Price } from '@/types/database'

interface SubscriptionPageClientProps {
  subscription: UserSubscription
  prices: Price[]
}

export function SubscriptionPageClient({ subscription, prices }: SubscriptionPageClientProps) {
  const [loading, setLoading] = useState(false)
  const [selectedPriceId, setSelectedPriceId] = useState<string | null>(null)
  const searchParams = useSearchParams()
  const success = searchParams.get('success')
  const canceled = searchParams.get('canceled')

  const hasActiveSubscription = subscription.status === 'active' || subscription.status === 'trialing'

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
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error creating checkout:', error)
      alert('Erro ao processar pagamento. Tente novamente.')
    } finally {
      setLoading(false)
      setSelectedPriceId(null)
    }
  }

  async function handleManageSubscription() {
    try {
      setLoading(true)

      const response = await fetch('/api/stripe/create-portal', {
        method: 'POST',
      })

      const data = await response.json()

      if (data.error) {
        alert(`Erro: ${data.error}`)
        return
      }

      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Error opening portal:', error)
      alert('Erro ao abrir portal. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const planData = prices.map((price) => {
    const isMonthly = price.interval === 'month' && price.interval_count === 1
    const isQuarterly = price.interval === 'month' && price.interval_count === 3
    const isYearly = price.interval === 'year'

    return {
      name: price.product_name.includes('Mensal')
        ? 'Mensal'
        : price.product_name.includes('Trimestral')
          ? 'Trimestral'
          : 'Anual',
      price: `R$ ${(price.unit_amount / 100).toFixed(2).replace('.', ',')}`,
      period: isMonthly ? '/mês' : isQuarterly ? '/trimestre' : '/ano',
      discount: isQuarterly ? '33% OFF' : isYearly ? '44% OFF' : undefined,
      pricePerMonth: isQuarterly
        ? 'R$ 10/mês'
        : isYearly
          ? 'R$ 8,33/mês'
          : undefined,
      description: isMonthly
        ? 'Gestão completa sem compromisso'
        : isQuarterly
          ? 'Economize com disciplina financeira'
          : 'Liberdade total, preço imbatível',
      features: isMonthly
        ? ['Interações ilimitadas com IA', 'Transações ilimitadas', 'Até 5 contas bancárias', 'Dashboard com 6 indicadores', 'Gráficos avançados']
        : isQuarterly
          ? ['Tudo do plano mensal', 'Economize R$ 15 a cada 3 meses', 'Suporte prioritário', 'Cancele quando quiser']
          : ['Tudo do plano mensal', 'Economize R$ 80 por ano', 'Melhor custo-benefício', 'Acesso antecipado a novidades'],
      stripePriceId: price.stripe_price_id,
      popular: isQuarterly,
    }
  })

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Success/Canceled Messages */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-sm font-semibold text-green-600 dark:text-green-400">
                Assinatura Ativada!
              </h3>
              <p className="text-xs text-muted-foreground">
                Seu pagamento foi processado com sucesso. Aproveite todos os recursos premium!
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {canceled && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6"
        >
          <p className="text-sm text-muted-foreground">
            Você cancelou o processo de assinatura. Nenhuma cobrança foi realizada.
          </p>
        </motion.div>
      )}

      {/* Status Banner */}
      <SubscriptionStatusBadge
        status={subscription.status}
        variant="banner"
        planName={subscription.planName}
        currentPeriodEnd={subscription.currentPeriodEnd}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciar Assinatura</h1>
        <p className="text-muted-foreground">
          {hasActiveSubscription
            ? 'Gerencie seu plano e método de pagamento'
            : 'Escolha o plano ideal para você'}
        </p>
      </div>

      {/* Current Subscription Card (if active) */}
      {hasActiveSubscription && (
        <Card className="p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold">{subscription.planName || 'Plano Ativo'}</h2>
                <SubscriptionStatusBadge status={subscription.status} variant="badge" />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {subscription.cancelAtPeriodEnd
                  ? `Sua assinatura será cancelada em ${new Date(subscription.currentPeriodEnd!).toLocaleDateString('pt-BR')}`
                  : `Renova automaticamente em ${new Date(subscription.currentPeriodEnd!).toLocaleDateString('pt-BR')}`}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleManageSubscription} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    <>
                      Gerenciar no Stripe
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">
          {hasActiveSubscription ? 'Outros Planos Disponíveis' : 'Escolha Seu Plano'}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {planData.map((plan, i) => (
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
                isCurrentPlan={subscription.planName?.toLowerCase().includes(plan.name.toLowerCase())}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Free Tier Info */}
      {!hasActiveSubscription && (
        <Card className="p-6 bg-muted/30">
          <h3 className="font-semibold mb-2">Plano Gratuito</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Você está atualmente no plano gratuito com acesso limitado:
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />5 interações no chat por mês
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />5 transações manuais por mês
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />1 conta bancária
            </li>
          </ul>
        </Card>
      )}
    </div>
  )
}
