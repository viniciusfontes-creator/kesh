'use client'

import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface PricingCardProps {
  name: string
  price: string
  period: string
  discount?: string
  pricePerMonth?: string
  description: string
  features: string[]
  stripePriceId: string
  popular?: boolean
  isCurrentPlan?: boolean
  onSubscribe: (priceId: string) => void
  loading?: boolean
}

export function PricingCard({
  name,
  price,
  period,
  discount,
  pricePerMonth,
  description,
  features,
  stripePriceId,
  popular = false,
  isCurrentPlan = false,
  onSubscribe,
  loading = false,
}: PricingCardProps) {
  return (
    <div className="relative">
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-lg shadow-primary/20">
          Mais Escolhido
        </div>
      )}
      <Card
        className={`h-full p-8 flex flex-col bg-card/50 border-border/40 hover:border-primary/20 transition-all ${
          popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''
        }`}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold">{name}</h3>
            {discount && (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {discount}
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{price}</span>
            <span className="text-muted-foreground text-xs">{period}</span>
          </div>
          {pricePerMonth && (
            <p className="text-xs text-muted-foreground font-medium mt-1">
              {pricePerMonth}
            </p>
          )}
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">{description}</p>
        </div>

        <div className="space-y-4 mb-8 flex-1">
          {features.map((feature, j) => (
            <div key={j} className="flex items-center gap-3 text-sm">
              <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-foreground/80">{feature}</span>
            </div>
          ))}
        </div>

        <Button
          className={`w-full rounded-full transition-transform hover:scale-105 ${
            popular ? 'bg-primary' : 'variant-outline'
          }`}
          variant={popular ? 'default' : 'outline'}
          onClick={() => onSubscribe(stripePriceId)}
          disabled={loading || isCurrentPlan}
        >
          {isCurrentPlan ? 'Plano Atual' : loading ? 'Processando...' : 'Assinar'}
        </Button>
      </Card>
    </div>
  )
}
