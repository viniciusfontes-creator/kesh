/**
 * Pluggy Sync Service
 *
 * Handles syncing data from Pluggy API into our Supabase database.
 * Ensures no duplicate records via UPSERT on Pluggy IDs.
 */

import { createClient as createServiceClient } from '@supabase/supabase-js'
import {
  getItem,
  getAccounts,
  getTransactions,
  type PluggyItem,
  type PluggyAccount,
  type PluggyTransaction,
} from './client'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createServiceClient(url, serviceKey)
}

// ============================================================
// Sync Item
// ============================================================

export async function syncItem(userId: string, pluggyItemId: string): Promise<{
  success: boolean
  item?: PluggyItem
  accountsSynced?: number
  transactionsSynced?: number
  error?: string
}> {
  try {
    const supabase = getServiceClient()

    // 1. Fetch item from Pluggy
    const item = await getItem(pluggyItemId)

    // 2. Upsert item in our DB
    const { error: itemError } = await supabase
      .from('pluggy_items')
      .upsert({
        user_id: userId,
        pluggy_item_id: item.id,
        connector_id: item.connector.id,
        connector_name: item.connector.name,
        status: item.status,
        execution_status: item.executionStatus,
        client_user_id: item.clientUserId,
        last_sync_at: item.lastUpdatedAt,
        next_auto_sync_at: item.nextAutoSyncAt,
        error_message: item.error?.message ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'pluggy_item_id' })

    if (itemError) throw new Error(`Erro ao sincronizar item: ${itemError.message}`)

    // 3. If item is updated, sync accounts and transactions
    let accountsSynced = 0
    let transactionsSynced = 0

    if (item.status === 'UPDATED') {
      const accountsResult = await syncAccounts(userId, item.id)
      accountsSynced = accountsResult.count

      // Sync transactions for each account
      for (const account of accountsResult.accounts) {
        const txResult = await syncTransactions(userId, account.id)
        transactionsSynced += txResult.count
      }
    }

    return { success: true, item, accountsSynced, transactionsSynced }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// ============================================================
// Sync Accounts
// ============================================================

async function syncAccounts(userId: string, pluggyItemId: string) {
  const supabase = getServiceClient()
  const { results: accounts } = await getAccounts(pluggyItemId)

  for (const account of accounts) {
    await supabase
      .from('pluggy_accounts')
      .upsert({
        user_id: userId,
        pluggy_item_id: pluggyItemId,
        pluggy_account_id: account.id,
        tipo: account.type,
        subtipo: account.subtype,
        nome: account.name,
        numero: account.number,
        saldo: account.balance,
        currency_code: account.currencyCode,
        bank_data: account.bankData ?? null,
        credit_data: account.creditData ?? null,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'pluggy_account_id' })
  }

  return { count: accounts.length, accounts }
}

// ============================================================
// Sync Transactions
// ============================================================

async function syncTransactions(userId: string, pluggyAccountId: string) {
  const supabase = getServiceClient()

  // Fetch all pages of transactions (last 12 months)
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)

  let page = 1
  let totalSynced = 0
  let hasMore = true

  while (hasMore) {
    const result = await getTransactions(pluggyAccountId, {
      from: from.toISOString().split('T')[0],
      page,
      pageSize: 500,
    })

    if (result.results.length === 0) break

    const rows = result.results.map((tx) => ({
      user_id: userId,
      pluggy_account_id: pluggyAccountId,
      pluggy_transaction_id: tx.id,
      tipo: tx.type,
      valor: Math.abs(tx.amount),
      descricao: tx.description,
      descricao_raw: tx.descriptionRaw,
      data: tx.date.split('T')[0],
      status: tx.status,
      categoria: tx.category,
      category_id: tx.categoryId,
      currency_code: tx.currencyCode,
      operation_type: tx.operationType,
      payment_data: tx.paymentData ?? null,
      credit_card_metadata: tx.creditCardMetadata ?? null,
      merchant: tx.merchant ?? null,
      provider_code: tx.providerCode,
      balance_after: tx.balance,
      updated_at: new Date().toISOString(),
    }))

    const { error } = await supabase
      .from('pluggy_transactions')
      .upsert(rows, { onConflict: 'pluggy_transaction_id' })

    if (error) {
      console.error(`Erro ao sincronizar transações (page ${page}):`, error.message)
      break
    }

    totalSynced += result.results.length
    hasMore = page < result.totalPages
    page++
  }

  return { count: totalSynced }
}

// ============================================================
// Remove Item (revoke consent)
// ============================================================

export async function removeItem(userId: string, pluggyItemId: string) {
  const supabase = getServiceClient()
  const { deleteItem: deletePluggyItem } = await import('./client')

  // Delete from Pluggy API
  await deletePluggyItem(pluggyItemId)

  // Remove from our DB (cascade will handle accounts and transactions)
  await supabase
    .from('pluggy_items')
    .delete()
    .eq('pluggy_item_id', pluggyItemId)
    .eq('user_id', userId)

  return { success: true }
}
