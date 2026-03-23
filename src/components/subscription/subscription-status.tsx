'use client'

import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react'
import type { SubscriptionStatus } from '@/types/database'

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus | 'none'
  variant?: 'badge' | 'banner'
  planName?: string | null
  currentPeriodEnd?: string | null
}

export function SubscriptionStatusBadge({
  status,
  variant = 'badge',
  planName,
  currentPeriodEnd,
}: SubscriptionStatusBadgeProps) {
  if (status === 'none') {
    return variant === 'badge' ? (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
        <Clock className="w-3 h-3" />
        Plano Gratuito
      </div>
    ) : null
  }

  if (status === 'active' || status === 'trialing') {
    return variant === 'badge' ? (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium">
        <CheckCircle2 className="w-3 h-3" />
        {planName || 'Ativo'}
      </div>
    ) : null
  }

  if (status === 'past_due') {
    return variant === 'banner' ? (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-yellow-600 dark:text-yellow-400 mb-1">
              Pagamento Pendente
            </h3>
            <p className="text-xs text-muted-foreground">
              Houve um problema com seu último pagamento. Atualize seu método de pagamento para
              continuar com acesso total.
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 text-xs font-medium">
        <AlertCircle className="w-3 h-3" />
        Pagamento Pendente
      </div>
    )
  }

  if (status === 'canceled') {
    const daysLeft = currentPeriodEnd
      ? Math.ceil((new Date(currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 0

    return variant === 'banner' ? (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">
              Assinatura Cancelada
            </h3>
            <p className="text-xs text-muted-foreground">
              {daysLeft > 0
                ? `Você ainda tem acesso por mais ${daysLeft} dias.`
                : 'Seu acesso expirou. Renove para continuar usando.'}
            </p>
          </div>
        </div>
      </div>
    ) : (
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" />
        Cancelada
      </div>
    )
  }

  return null
}
