'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const plans = [
  {
    name: 'Mensal',
    price: 'R$ 15,00',
    description: 'Gestão essencial.',
    features: ['Categorização por IA', 'Dashboard Completo', 'Até 5 Contas'],
    cta: 'Começar Agora',
    stripePriceId: 'price_1TC6PBFz7A1qFfrQxpfZJMdU',
    popular: false
  },
  {
    name: 'Trimestral',
    price: 'R$ 30,00',
    description: 'Ideal para disciplina.',
    features: ['Tudo do mensal', 'Suporte Prioritário', 'Análises Avançadas'],
    cta: 'Economize Agora',
    stripePriceId: 'price_1TC6PBFz7A1qFfrQtSPzk26x',
    popular: true
  },
  {
    name: 'Anual',
    price: 'R$ 100,00',
    description: 'Liberdade total.',
    features: ['Tudo do trimestral', 'Faturamento por IA', 'Consultoria Personalizada'],
    cta: 'Acesso Vitalício',
    stripePriceId: 'price_1TC6PBFz7A1qFfrQ8Na74XcQ',
    popular: false
  }
]

export function PricingSection() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const checkAuth = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setIsAuthenticated(!!user)
    }
    checkAuth()
  }, [])

  async function handleSubscribe(priceId: string) {
    try {
      setLoading(priceId)

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
      setLoading(null)
    }
  }

  return (
    <section id="pricing" className="py-24 bg-background">
      <div className="container px-4 mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Planos que acompanham seu crescimento</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Escolha o plano que melhor se adapta ao seu momento financeiro.
            Sem taxas ocultas, transparência total.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider z-10 shadow-lg shadow-primary/20">
                  Mais Escolhido
                </div>
              )}
              <Card className={`h-full p-8 flex flex-col bg-card/50 border-border/40 hover:border-primary/20 transition-all ${plan.popular ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-xs">/período</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                </div>

                <div className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-3 text-sm">
                      <div className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="text-foreground/80">{feature}</span>
                    </div>
                  ))}
                </div>

                {isMounted && isAuthenticated ? (
                  <Button
                    onClick={() => handleSubscribe(plan.stripePriceId)}
                    disabled={loading !== null}
                    className={`w-full rounded-full transition-transform hover:scale-105 ${plan.popular ? 'bg-primary' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                  >
                    {loading === plan.stripePriceId ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                ) : (
                  <Link href="/signup">
                    <Button
                      className={`w-full rounded-full transition-transform hover:scale-105 ${plan.popular ? 'bg-primary' : 'variant-outline'}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
