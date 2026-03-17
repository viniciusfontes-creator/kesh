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
