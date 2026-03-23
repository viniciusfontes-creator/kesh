export interface Conta {
    id: string
    user_id: string
    nome: string
    tipo: 'conta_corrente' | 'investimento' | 'poupanca' | 'cartao_credito'
    saldo: number
    cor: string | null
    icone: string | null
    pluggy_account_id: string | null
    created_at: string
}

export interface Transaction {
    id: string
    user_id: string
    tipo: 'entrada' | 'saida'
    valor: number
    categoria: string
    descricao: string | null
    data: string
    fonte: string
    status: 'pago' | 'pendente'
    data_vencimento: string | null
    parcela_atual: number | null
    total_parcelas: number | null
    is_recurring: boolean
    frequency: 'semanal' | 'mensal' | 'anual' | null
    conta_id: string | null
    source: 'manual' | 'pluggy' | 'chat'
    created_at: string
}

export interface Categoria {
    id: string
    user_id: string
    nome: string
    tipo: 'entrada' | 'saida' | null
    cor: string | null
    icone: string | null
}

export interface Meta {
    id: string
    user_id: string
    categoria: string
    valor_limite: number
    periodo: 'mensal' | 'semanal' | 'anual'
    ativo: boolean
}

export type NotificationType =
    | 'meta_alert'
    | 'meta_exceeded'
    | 'bill_reminder'
    | 'transaction'
    | 'weekly_summary'
    | 'achievement'
    | 'system'

export interface Notification {
    id: string
    user_id: string
    type: NotificationType
    title: string
    body: string
    metadata: Record<string, unknown>
    read: boolean
    action_url: string | null
    created_at: string
}

// Stripe Subscription Types
export type SubscriptionStatus =
    | 'active'
    | 'past_due'
    | 'canceled'
    | 'incomplete'
    | 'incomplete_expired'
    | 'trialing'
    | 'unpaid'
    | 'paused'

export interface Subscription {
    id: string
    user_id: string
    stripe_subscription_id: string
    stripe_customer_id: string
    status: SubscriptionStatus
    price_id: string | null
    plan_name: string | null
    current_period_start: string | null
    current_period_end: string | null
    cancel_at_period_end: boolean
    canceled_at: string | null
    trial_start: string | null
    trial_end: string | null
    created_at: string
    updated_at: string
}

export interface Price {
    id: string
    stripe_price_id: string
    stripe_product_id: string
    product_name: string
    unit_amount: number
    currency: string
    interval: 'month' | 'year'
    interval_count: number
    active: boolean
    metadata: Record<string, unknown>
    created_at: string
    updated_at: string
}

export interface QuotaStatus {
    used: number
    limit: number
    exceeded: boolean
    resetsAt: string
}
