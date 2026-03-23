import { createClient } from '@/lib/supabase/server'

export interface QuotaStatus {
  used: number
  limit: number
  exceeded: boolean
  resetsAt: string
}

/**
 * Check if the quota needs to be reset (monthly)
 */
async function checkAndResetQuota(userId: string): Promise<void> {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('quota_reset_at')
    .eq('user_id', userId)
    .single()

  if (!profile) return

  const resetDate = new Date(profile.quota_reset_at)
  const now = new Date()

  // If quota_reset_at has passed, reset the counters
  if (resetDate < now) {
    const nextResetDate = new Date(now)
    nextResetDate.setMonth(nextResetDate.getMonth() + 1)

    await supabase
      .from('user_profiles')
      .update({
        chat_interactions_count: 0,
        transactions_count: 0,
        quota_reset_at: nextResetDate.toISOString(),
      })
      .eq('user_id', userId)
  }
}

/**
 * Check chat quota for free tier users
 */
export async function checkChatQuota(userId: string): Promise<QuotaStatus> {
  await checkAndResetQuota(userId)

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('chat_interactions_count, quota_reset_at')
    .eq('user_id', userId)
    .single()

  const limit = 5
  const used = profile?.chat_interactions_count || 0

  return {
    used,
    limit,
    exceeded: used >= limit,
    resetsAt: profile?.quota_reset_at || new Date().toISOString(),
  }
}

/**
 * Check transaction quota for free tier users
 */
export async function checkTransactionQuota(userId: string): Promise<QuotaStatus> {
  await checkAndResetQuota(userId)

  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('transactions_count, quota_reset_at')
    .eq('user_id', userId)
    .single()

  const limit = 5
  const used = profile?.transactions_count || 0

  return {
    used,
    limit,
    exceeded: used >= limit,
    resetsAt: profile?.quota_reset_at || new Date().toISOString(),
  }
}

/**
 * Check account quota for free tier users
 */
export async function checkAccountQuota(userId: string): Promise<QuotaStatus> {
  const supabase = await createClient()
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('accounts_count, quota_reset_at')
    .eq('user_id', userId)
    .single()

  const limit = 1
  const used = profile?.accounts_count || 0

  return {
    used,
    limit,
    exceeded: used >= limit,
    resetsAt: profile?.quota_reset_at || new Date().toISOString(),
  }
}

/**
 * Increment chat interaction counter
 */
export async function incrementChatQuota(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_chat_quota', { p_user_id: userId })
}

/**
 * Increment transaction counter
 */
export async function incrementTransactionQuota(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_transaction_quota', { p_user_id: userId })
}

/**
 * Increment account counter
 */
export async function incrementAccountQuota(userId: string): Promise<void> {
  const supabase = await createClient()
  await supabase.rpc('increment_account_quota', { p_user_id: userId })
}

/**
 * Manually reset quota (for testing or admin purposes)
 */
export async function resetQuota(userId: string): Promise<void> {
  const supabase = await createClient()

  const nextResetDate = new Date()
  nextResetDate.setMonth(nextResetDate.getMonth() + 1)

  await supabase
    .from('user_profiles')
    .update({
      chat_interactions_count: 0,
      transactions_count: 0,
      quota_reset_at: nextResetDate.toISOString(),
    })
    .eq('user_id', userId)
}
