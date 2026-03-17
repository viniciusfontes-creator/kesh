'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Landmark,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Must use next/dynamic with ssr: false for Pluggy Connect (uses window/DOM)
const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then(mod => mod.PluggyConnect),
  { ssr: false }
)

interface PluggyAccount {
  pluggy_account_id: string
  tipo: string
  nome: string
  saldo: number
  currency_code: string
}

interface PluggyItemData {
  pluggy_item_id: string
  connector_name: string
  status: string
  last_sync_at: string | null
  error_message: string | null
  pluggy_accounts: PluggyAccount[]
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  UPDATED: { label: 'Sincronizado', color: 'text-emerald-500', icon: CheckCircle2 },
  UPDATING: { label: 'Atualizando...', color: 'text-amber-500', icon: RefreshCw },
  LOGIN_ERROR: { label: 'Erro de Login', color: 'text-red-500', icon: AlertCircle },
  WAITING_USER_INPUT: { label: 'Ação Necessária', color: 'text-amber-500', icon: AlertCircle },
  OUTDATED: { label: 'Desatualizado', color: 'text-muted-foreground', icon: WifiOff },
  CREATED: { label: 'Conectando...', color: 'text-blue-500', icon: Loader2 },
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

function formatDate(date: string | null) {
  if (!date) return 'Nunca'
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function OpenFinanceSection() {
  const [items, setItems] = useState<PluggyItemData[]>([])
  const [loading, setLoading] = useState(true)
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [isWidgetOpen, setIsWidgetOpen] = useState(false)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/pluggy/items')
      const data = await res.json()
      setItems(data.items ?? [])
    } catch {
      console.error('Falha ao carregar conexões')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleConnect = async () => {
    try {
      const res = await fetch('/api/pluggy/connect-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      const data = await res.json()
      setConnectToken(data.accessToken)
      setIsWidgetOpen(true)
    } catch {
      console.error('Falha ao gerar token de conexão')
    }
  }

  const handleSuccess = async (itemData: { item: { id: string } }) => {
    setIsWidgetOpen(false)
    setConnectToken(null)

    // Sync the newly connected item
    setSyncing(itemData.item.id)
    try {
      await fetch('/api/pluggy/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: itemData.item.id }),
      })
      await fetchItems()
    } finally {
      setSyncing(null)
    }
  }

  const handleSync = async (pluggyItemId: string) => {
    setSyncing(pluggyItemId)
    try {
      await fetch('/api/pluggy/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: pluggyItemId }),
      })
      await fetchItems()
    } finally {
      setSyncing(null)
    }
  }

  const handleDelete = async (pluggyItemId: string) => {
    setDeleting(pluggyItemId)
    try {
      await fetch('/api/pluggy/items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: pluggyItemId }),
      })
      await fetchItems()
    } finally {
      setDeleting(null)
    }
  }

  const totalBalance = items
    .flatMap(i => i.pluggy_accounts)
    .filter(a => a.tipo === 'BANK')
    .reduce((sum, a) => sum + Number(a.saldo ?? 0), 0)

  return (
    <Card className="rounded-[32px] border border-border/40 bg-card/40 backdrop-blur-md shadow-sm p-2 md:col-span-2">
      <CardHeader className="pt-6 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-foreground/5 rounded-[20px] text-foreground">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold tracking-tight">Open Finance</CardTitle>
              <CardDescription className="font-medium">
                Conecte seus bancos para dados financeiros em tempo real.
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleConnect}
            className="h-10 px-5 rounded-[18px] font-semibold text-sm bg-foreground text-background hover:opacity-90 transition-opacity gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Conectar Banco</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="px-6 pb-6 space-y-4">
        {/* Summary bar */}
        {items.length > 0 && (
          <div className="flex items-center justify-between p-4 rounded-[22px] bg-foreground text-background shadow-xl shadow-foreground/10 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-background/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
            <div className="relative z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                Saldo Bancário Real
              </span>
              <div className="text-2xl font-black tracking-tight">{formatCurrency(totalBalance)}</div>
            </div>
            <div className="relative z-10 flex items-center gap-1.5">
              <Wifi className="w-4 h-4 opacity-60" />
              <span className="text-xs font-semibold opacity-70">
                {items.length} {items.length === 1 ? 'banco' : 'bancos'}
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
            <div className="p-4 bg-muted/40 rounded-full">
              <Landmark className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Nenhum banco conectado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Conecte suas contas bancárias para que o Kesh tenha acesso aos seus dados financeiros reais.
              </p>
            </div>
          </div>
        )}

        {/* Connected items */}
        <AnimatePresence>
          {items.map((item) => {
            const status = statusConfig[item.status] ?? statusConfig.OUTDATED
            const StatusIcon = status.icon
            const isSyncing = syncing === item.pluggy_item_id
            const isDeleting = deleting === item.pluggy_item_id

            return (
              <motion.div
                key={item.pluggy_item_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-5 rounded-[24px] bg-muted/30 border border-border/30"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-background rounded-[16px] shadow-sm">
                      <Landmark className="w-4 h-4 text-foreground" />
                    </div>
                    <div>
                      <span className="text-sm font-bold block">{item.connector_name}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <StatusIcon className={`w-3 h-3 ${status.color} ${item.status === 'UPDATING' || item.status === 'CREATED' ? 'animate-spin' : ''}`} />
                        <span className={`text-[11px] font-medium ${status.color}`}>{status.label}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleSync(item.pluggy_item_id)}
                      disabled={isSyncing}
                      className="rounded-xl text-muted-foreground hover:text-foreground"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(item.pluggy_item_id)}
                      disabled={isDeleting}
                      className="rounded-xl text-muted-foreground hover:text-red-500"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Accounts */}
                {item.pluggy_accounts.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {item.pluggy_accounts.map((account) => (
                      <div
                        key={account.pluggy_account_id}
                        className="flex items-center justify-between px-4 py-3 rounded-[16px] bg-background/60 border border-border/20"
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${account.tipo === 'BANK' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="text-xs font-semibold">{account.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">
                            {account.tipo === 'BANK' ? 'Conta' : 'Cartão'}
                          </span>
                        </div>
                        <span className="text-sm font-bold tabular-nums">
                          {formatCurrency(Number(account.saldo))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Last sync */}
                <div className="mt-3 text-[11px] text-muted-foreground font-medium">
                  Última sincronização: {formatDate(item.last_sync_at)}
                </div>

                {/* Error message */}
                {item.error_message && (
                  <div className="mt-2 p-3 rounded-[14px] bg-red-500/10 border border-red-500/20">
                    <p className="text-xs text-red-500 font-medium">{item.error_message}</p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </CardContent>

      {/* Pluggy Connect Widget (iframe overlay) */}
      {isWidgetOpen && connectToken && (
          <PluggyConnect
            connectToken={connectToken}
            includeSandbox={true}
            onSuccess={handleSuccess}
            onError={(error: unknown) => {
              console.error('Pluggy Connect error:', JSON.stringify(error, null, 2))
              setIsWidgetOpen(false)
              setConnectToken(null)
            }}
            onClose={() => {
              setIsWidgetOpen(false)
              setConnectToken(null)
            }}
          />
      )}
    </Card>
  )
}
