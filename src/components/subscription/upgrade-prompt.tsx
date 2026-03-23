'use client'

import { ArrowUpRight, Crown, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface UpgradePromptProps {
  variant?: 'inline' | 'modal' | 'banner'
  feature?: string
  upgradeUrl?: string
}

export function UpgradePrompt({
  variant = 'inline',
  feature = 'este recurso',
  upgradeUrl = '/configuracoes/assinatura',
}: UpgradePromptProps) {
  if (variant === 'inline') {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/30 rounded-lg border-2 border-dashed border-border">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Crown className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">Funcionalidade Premium</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-[200px]">
          Faça upgrade para desbloquear {feature}
        </p>
        <Link href={upgradeUrl}>
          <Button size="sm" className="rounded-full">
            Fazer Upgrade
            <ArrowUpRight className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    )
  }

  if (variant === 'banner') {
    return (
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Crown className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-0.5">Desbloqueie Todo o Potencial</h3>
              <p className="text-xs text-muted-foreground">
                Acesse análises avançadas, transações ilimitadas e suporte prioritário
              </p>
            </div>
          </div>
          <Link href={upgradeUrl}>
            <Button className="rounded-full flex-shrink-0">
              Fazer Upgrade
              <ArrowUpRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // modal variant
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4">
          <Lock className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-center mb-2">Funcionalidade Premium</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          Você atingiu o limite do plano gratuito. Faça upgrade para continuar usando {feature} e
          desbloquear recursos avançados.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full">
            Agora Não
          </Button>
          <Link href={upgradeUrl} className="flex-1">
            <Button className="w-full rounded-full">Fazer Upgrade</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
