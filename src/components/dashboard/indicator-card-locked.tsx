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
    <Card className="rounded-[28px] border border-border/50 bg-card/50 backdrop-blur-md shadow-sm relative overflow-hidden h-full min-h-[160px] flex items-center justify-center">
      {/* Blurred background placeholder */}
      <div className="absolute inset-0 blur-sm pointer-events-none opacity-20">
        <div className="p-6 pt-8">
          {icon && <div className="mb-3 opacity-50">{icon}</div>}
          <h3 className="text-xs font-medium mb-3 opacity-60">{title}</h3>
          <p className="text-2xl font-bold opacity-40">••••</p>
        </div>
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 to-background/75 backdrop-blur-[2px] flex flex-col items-center justify-center text-center p-6 z-10">
        <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-1 ring-primary/20">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h3 className="text-sm font-bold mb-1.5 tracking-tight">Premium</h3>
        <p className="text-[11px] text-muted-foreground mb-4 max-w-[200px] leading-relaxed font-medium">
          Faça upgrade para visualizar<br />{title.toLowerCase()}
        </p>
        <Link href="/configuracoes/assinatura">
          <Button size="sm" className="rounded-full text-[11px] h-8 px-5 font-bold shadow-sm hover:shadow transition-all hover:scale-105">
            Desbloquear
          </Button>
        </Link>
      </div>
    </Card>
  )
}
