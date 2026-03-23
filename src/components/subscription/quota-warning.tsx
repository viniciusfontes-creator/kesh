'use client'

import { AlertCircle, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface QuotaWarningProps {
  used: number
  limit: number
  resource: 'interações' | 'transações' | 'contas'
  upgradeUrl?: string
}

export function QuotaWarning({
  used,
  limit,
  resource,
  upgradeUrl = '/configuracoes/assinatura',
}: QuotaWarningProps) {
  const percentage = (used / limit) * 100
  const isExceeded = used >= limit
  const isWarning = percentage >= 80 && !isExceeded

  if (!isWarning && !isExceeded) {
    return (
      <div className="text-xs text-muted-foreground">
        {used}/{limit} {resource} usadas este mês
      </div>
    )
  }

  if (isExceeded) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
        <div className="flex items-start gap-2 mb-2">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">
              Limite atingido
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Você usou {used}/{limit} {resource}. Faça upgrade para continuar.
            </p>
          </div>
        </div>
        <Link href={upgradeUrl}>
          <Button size="sm" className="w-full rounded-full text-xs h-7">
            Fazer Upgrade
            <TrendingUp className="w-3 h-3 ml-1" />
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
      <div className="flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-yellow-600 dark:text-yellow-400">
            Quase no limite
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Você usou {used}/{limit} {resource} este mês. Considere fazer upgrade.
          </p>
        </div>
      </div>
    </div>
  )
}
