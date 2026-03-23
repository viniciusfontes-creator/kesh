import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserSubscription } from '@/lib/subscription'
import { SubscriptionPageClient } from './subscription-client'

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const subscription = await getUserSubscription()

  // Fetch available prices
  const { data: prices } = await supabase
    .from('prices')
    .select('*')
    .eq('active', true)
    .order('unit_amount', { ascending: true })

  return <SubscriptionPageClient subscription={subscription} prices={prices || []} />
}
