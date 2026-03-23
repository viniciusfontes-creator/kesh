'use client'

import { Lock } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface IndicatorCardLockedProps {
  title: string
  icon?: React.ReactNode
}

export function IndicatorCardLocked({ title, icon }: IndicatorCardLockedProps) {
  return (
    <Card className="p-6 relative overflow-hidden bg-card/50">
      {/* Blurred background placeholder */}
      <div className="absolute inset-0 blur-sm pointer-events-none opacity-30">
        <div className="p-6">
          {icon && <div className="mb-2">{icon}</div>}
          <h3 className="text-sm font-medium mb-2">{title}</h3>
          <p className="text-2xl font-bold">R$ 0,00</p>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/95 to-background/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-semibold mb-1">Premium</h3>
        <p className="text-xs text-muted-foreground mb-4 max-w-[180px]">
          Faça upgrade para visualizar {title.toLowerCase()}
        </p>
        <Link href="/configuracoes/assinatura">
          <Button size="sm" className="rounded-full text-xs h-7 px-4">
            Desbloquear
          </Button>
        </Link>
      </div>
    </Card>
  )
}
