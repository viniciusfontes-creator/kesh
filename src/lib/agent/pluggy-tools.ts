import { z } from 'zod'
import { tool } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { listConnectors } from '@/lib/pluggy/client'
import { syncItem } from '@/lib/pluggy/sync'

// Helper: get authenticated user or throw
async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id) throw new Error('Usuário não autenticado')
  return { supabase, userId: user.id }
}

// ============================================================
// Listar Conectores (bancos e instituições disponíveis)
// ============================================================

export const listConnectorsTool = tool({
  description: 'Lista os bancos e instituições financeiras disponíveis para conexão via Open Finance. Use quando o usuário quiser conectar um banco.',
  inputSchema: z.object({
    nome: z.string().optional().describe('Filtrar por nome da instituição (ex: Nubank, Itaú, Bradesco)'),
  }),
  execute: async ({ nome }) => {
    try {
      const result = await listConnectors({ name: nome, countries: 'BR' })
      const connectors = result.results.map(c => ({
        id: c.id,
        nome: c.name,
        tipo: c.type,
        produtos: c.products,
        openFinance: c.isOpenFinance,
      }))
      return {
        success: true,
        total: connectors.length,
        conectores: connectors.slice(0, 20),
      }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  },
})

// ============================================================
// Listar Conexões do usuário (Items)
// ============================================================

export const listPluggyItemsTool = tool({
  description: 'Lista todas as conexões bancárias do usuário via Open Finance. Mostra bancos conectados, status e contas.',
  inputSchema: z.object({}),
  execute: async () => {
    const { supabase, userId } = await getUser()

    const { data, error } = await supabase
      .from('pluggy_items')
      .select(`
        pluggy_item_id, connector_name, status, last_sync_at, error_message,
        pluggy_accounts (
          pluggy_account_id, tipo, nome, saldo, currency_code
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) return { success: false, error: error.message }

    const items = (data ?? []).map(item => ({
      id: item.pluggy_item_id,
      banco: item.connector_name,
      status: item.status,
      ultimaSync: item.last_sync_at,
      erro: item.error_message,
      contas: item.pluggy_accounts,
    }))

    return { success: true, total: items.length, conexoes: items }
  },
})

// ============================================================
// Sincronizar dados de um Item
// ============================================================

export const syncPluggyItemTool = tool({
  description: 'Sincroniza os dados (contas e transações) de uma conexão bancária específica. Use quando o usuário quiser atualizar os dados de um banco.',
  inputSchema: z.object({
    itemId: z.string().describe('ID da conexão (pluggy_item_id) a ser sincronizada'),
  }),
  execute: async ({ itemId }) => {
    const { userId } = await getUser()

    const result = await syncItem(userId, itemId)

    if (!result.success) {
      return { success: false, error: result.error }
    }

    return {
      success: true,
      message: `Dados sincronizados! ${result.accountsSynced} conta(s) e ${result.transactionsSynced} transação(ões) atualizadas.`,
      status: result.item?.status,
    }
  },
})

// ============================================================
// Listar Contas do Open Finance
// ============================================================

export const listPluggyAccountsTool = tool({
  description: 'Lista todas as contas bancárias do usuário conectadas via Open Finance, com saldos atualizados.',
  inputSchema: z.object({
    tipo: z.enum(['BANK', 'CREDIT']).optional().describe('Filtrar por tipo: BANK (conta corrente/poupança) ou CREDIT (cartão de crédito)'),
  }),
  execute: async ({ tipo }) => {
    const { supabase, userId } = await getUser()

    let query = supabase
      .from('pluggy_accounts')
      .select(`
        pluggy_account_id, tipo, subtipo, nome, numero, saldo, currency_code,
        pluggy_items!inner (connector_name, status)
      `)
      .eq('user_id', userId)

    if (tipo) query = query.eq('tipo', tipo)

    const { data, error } = await query

    if (error) return { success: false, error: error.message }

    const contas = (data ?? []).map((c: Record<string, unknown>) => {
      const item = c.pluggy_items as Record<string, unknown> | null
      return {
        id: c.pluggy_account_id as string,
        banco: (item?.connector_name as string) ?? 'Desconhecido',
        tipo: c.tipo as string,
        subtipo: c.subtipo as string,
        nome: c.nome as string,
        numero: c.numero as string,
        saldo: c.saldo as number,
        moeda: c.currency_code as string,
      }
    })

    const saldoTotal = contas
      .filter(c => c.tipo === 'BANK')
      .reduce((sum, c) => sum + Number(c.saldo ?? 0), 0)

    return {
      success: true,
      total: contas.length,
      saldoTotalBancario: saldoTotal,
      contas,
    }
  },
})

// ============================================================
// Listar Transações do Open Finance
// ============================================================

export const listPluggyTransactionsTool = tool({
  description: 'Lista transações bancárias reais do usuário obtidas via Open Finance. Dados enriquecidos com categoria e comerciante.',
  inputSchema: z.object({
    accountId: z.string().optional().describe('ID da conta para filtrar transações'),
    tipo: z.enum(['DEBIT', 'CREDIT']).optional().describe('Filtrar por tipo: DEBIT (saída) ou CREDIT (entrada)'),
    categoria: z.string().optional().describe('Filtrar por categoria'),
    dataInicio: z.string().optional().describe('Data início no formato YYYY-MM-DD'),
    dataFim: z.string().optional().describe('Data fim no formato YYYY-MM-DD'),
    limite: z.number().int().positive().optional().describe('Número máximo de resultados (padrão 30)'),
  }),
  execute: async ({ accountId, tipo, categoria, dataInicio, dataFim, limite }) => {
    const { supabase, userId } = await getUser()

    let query = supabase
      .from('pluggy_transactions')
      .select(`
        pluggy_transaction_id, tipo, valor, descricao, data, status, categoria,
        operation_type, merchant, pluggy_account_id,
        pluggy_accounts!inner (nome, pluggy_items!inner (connector_name))
      `)
      .eq('user_id', userId)
      .order('data', { ascending: false })
      .limit(limite ?? 30)

    if (accountId) query = query.eq('pluggy_account_id', accountId)
    if (tipo) query = query.eq('tipo', tipo)
    if (categoria) query = query.ilike('categoria', `%${categoria}%`)
    if (dataInicio) query = query.gte('data', dataInicio)
    if (dataFim) query = query.lte('data', dataFim)

    const { data, error } = await query

    if (error) return { success: false, error: error.message }

    const transacoes = (data ?? []).map((tx: Record<string, unknown>) => {
      const account = tx.pluggy_accounts as Record<string, unknown> | null
      const item = account?.pluggy_items as Record<string, unknown> | null
      const merchant = tx.merchant as Record<string, unknown> | null
      return {
        id: tx.pluggy_transaction_id,
        tipo: tx.tipo,
        valor: tx.valor,
        descricao: tx.descricao,
        data: tx.data,
        status: tx.status,
        categoria: tx.categoria,
        operacao: tx.operation_type,
        comerciante: merchant?.name ?? null,
        conta: account?.nome ?? 'Desconhecida',
        banco: item?.connector_name ?? 'Desconhecido',
      }
    })

    return {
      success: true,
      total: transacoes.length,
      transacoes,
    }
  },
})

// ============================================================
// Saldo consolidado (manual + Open Finance)
// ============================================================

export const getConsolidatedBalanceTool = tool({
  description: 'Obtém o saldo consolidado do usuário, combinando dados manuais (Kesh) e dados reais via Open Finance. Dá uma visão completa da situação financeira.',
  inputSchema: z.object({}),
  execute: async () => {
    const { supabase, userId } = await getUser()

    // Saldo Open Finance (contas bancárias)
    const { data: pluggyAccounts } = await supabase
      .from('pluggy_accounts')
      .select('tipo, saldo, nome')
      .eq('user_id', userId)

    const saldoBancarioReal = (pluggyAccounts ?? [])
      .filter(a => a.tipo === 'BANK')
      .reduce((sum, a) => sum + Number(a.saldo ?? 0), 0)

    // Saldo manual (transações do Kesh)
    const { data: todasPagas } = await supabase
      .from('transactions')
      .select('tipo, valor')
      .eq('user_id', userId)
      .eq('status', 'pago')
      .eq('source', 'manual')

    let saldoManual = 0
    todasPagas?.forEach(t => {
      if (t.tipo === 'entrada') saldoManual += Number(t.valor)
      if (t.tipo === 'saida') saldoManual -= Number(t.valor)
    })

    // Pendências
    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: pendentes } = await supabase
      .from('transactions')
      .select('valor')
      .eq('user_id', userId)
      .eq('status', 'pendente')
      .eq('tipo', 'saida')
      .gte('data', firstDay)

    const pendenciasNoMes = (pendentes ?? []).reduce((sum, t) => sum + Number(t.valor), 0)

    const contasBancarias = (pluggyAccounts ?? []).map(a => ({
      nome: a.nome,
      tipo: a.tipo,
      saldo: Number(a.saldo ?? 0),
    }))

    return {
      openFinance: {
        conectado: contasBancarias.length > 0,
        saldoBancarioReal,
        contas: contasBancarias,
      },
      manual: {
        saldoCalculado: saldoManual,
      },
      consolidado: {
        saldoTotal: saldoBancarioReal > 0 ? saldoBancarioReal : saldoManual,
        pendenciasNoMes,
        saldoProjetado: (saldoBancarioReal > 0 ? saldoBancarioReal : saldoManual) - pendenciasNoMes,
        fonte: saldoBancarioReal > 0 ? 'Open Finance (dados reais)' : 'Manual (calculado)',
      },
    }
  },
})
