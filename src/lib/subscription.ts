import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid'
  | 'paused'
  | 'none'

export interface UserSubscription {
  status: SubscriptionStatus
  planName: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
}

/**
 * Get the current user's subscription status
 * For use in server components and API routes (uses cookie-based auth)
 */
export async function getUserSubscription(): Promise<UserSubscription> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      status: 'none',
      planName: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
    }
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select(
      'status, plan_name, current_period_end, cancel_at_period_end, stripe_subscription_id, stripe_customer_id'
    )
    .eq('user_id', user.id)
    .in('status', ['active', 'trialing', 'past_due'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!sub) {
    return {
      status: 'none',
      planName: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
    }
  }

  return {
    status: sub.status as SubscriptionStatus,
    planName: sub.plan_name,
    currentPeriodEnd: sub.current_period_end,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    stripeSubscriptionId: sub.stripe_subscription_id,
    stripeCustomerId: sub.stripe_customer_id,
  }
}

/**
 * Create a Supabase client with service role key
 * For use in webhooks (uses service role, no cookie auth)
 */
export function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createServiceClient(supabaseUrl, supabaseServiceRoleKey)
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing'
}

/**
 * Check if subscription is in grace period (payment failed but not canceled yet)
 */
export function isSubscriptionGracePeriod(status: SubscriptionStatus): boolean {
  return status === 'past_due'
}

/**
 * Check if user has any access (active or grace period)
 */
export function hasAnyAccess(status: SubscriptionStatus): boolean {
  return isSubscriptionActive(status) || isSubscriptionGracePeriod(status)
}
