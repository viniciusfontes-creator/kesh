import { stripe } from '@/lib/stripe'
import { getServiceClient } from '@/lib/subscription'
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'

// Disable body parsing so we can verify the raw signature
export const runtime = 'nodejs'

export async function POST(req: Request) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = getServiceClient()

  // Idempotency: check if we already processed this event
  const { data: existingEvent } = await supabase
    .from('stripe_webhook_events')
    .select('id, processed')
    .eq('stripe_event_id', event.id)
    .maybeSingle()

  if (existingEvent?.processed) {
    return NextResponse.json({ received: true, already_processed: true })
  }

  // Log the event (upsert for idempotency)
  await supabase
    .from('stripe_webhook_events')
    .upsert(
      {
        stripe_event_id: event.id,
        type: event.type,
        data: event.data.object as any,
      },
      { onConflict: 'stripe_event_id' }
    )

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session, supabase)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice, supabase)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice, supabase)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription, supabase)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription, supabase)
        break

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }

    // Mark as processed
    await supabase
      .from('stripe_webhook_events')
      .update({ processed: true, processed_at: new Date().toISOString() })
      .eq('stripe_event_id', event.id)
  } catch (error) {
    console.error(`Error processing Stripe event ${event.type}:`, error)

    await supabase
      .from('stripe_webhook_events')
      .update({
        error: error instanceof Error ? error.message : 'Unknown error',
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', event.id)
  }

  // Always return 200 to acknowledge receipt (same pattern as Pluggy webhook)
  return NextResponse.json({ received: true })
}

// ── Handlers ──

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  supabase: ReturnType<typeof getServiceClient>
) {
  if (session.mode !== 'subscription' || !session.subscription) return

  const userId = session.metadata?.supabase_user_id
  if (!userId) {
    console.error('checkout.session.completed: missing supabase_user_id in metadata')
    return
  }

  // Retrieve the full subscription from Stripe to get period details
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

  const priceId = subscription.items.data[0]?.price?.id
  const planName = getPlanNameFromPrice(priceId)

  // Ensure stripe_customer_id is stored in user_profiles
  await supabase
    .from('user_profiles')
    .update({ stripe_customer_id: session.customer as string })
    .eq('user_id', userId)

  // Upsert subscription record
  await supabase.from('subscriptions').upsert(
    {
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: session.customer as string,
      status: subscription.status,
      price_id: priceId,
      plan_name: planName,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_subscription_id' }
  )
}

async function handleInvoicePaid(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getServiceClient>
) {
  if (!invoice.subscription) return

  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string)

  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleInvoicePaymentFailed(
  invoice: Stripe.Invoice,
  supabase: ReturnType<typeof getServiceClient>
) {
  if (!invoice.subscription) return

  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string)
}

async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof getServiceClient>
) {
  const priceId = subscription.items.data[0]?.price?.id
  const planName = getPlanNameFromPrice(priceId)

  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      price_id: priceId,
      plan_name: planName,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
  supabase: ReturnType<typeof getServiceClient>
) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id)
}

// ── Helpers ──

function getPlanNameFromPrice(priceId: string | undefined): string {
  // Map Stripe Price IDs to friendly names
  const priceMap: Record<string, string> = {
    price_1TC6PBFz7A1qFfrQxpfZJMdU: 'Mensal',
    price_1TC6PBFz7A1qFfrQtSPzk26x: 'Trimestral',
    price_1TC6PBFz7A1qFfrQ8Na74XcQ: 'Anual',
  }
  return priceMap[priceId || ''] || 'Organiza.AI Pro'
}
