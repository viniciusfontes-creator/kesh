import { createClient } from '@/lib/supabase/server'
import { stripe } from '@/lib/stripe'
import { getURL } from '@/lib/utils'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { priceId } = await req.json()

    if (!priceId) {
      return NextResponse.json({ error: 'priceId is required' }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id, nome_completo, email')
      .eq('user_id', user.id)
      .single()

    let customerId = profile?.stripe_customer_id

    if (!customerId) {
      // Create Stripe Customer
      const customer = await stripe.customers.create({
        email: profile?.email || user.email,
        name: profile?.nome_completo || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Store stripe_customer_id in user_profiles
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', user.id)
    }

    const baseUrl = getURL()

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/configuracoes/assinatura?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/configuracoes/assinatura?canceled=true`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
      },
      locale: 'pt-BR',
      currency: 'brl',
    })

    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error('Error creating checkout session:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Internal Server Error' },
      { status: 500 }
    )
  }
}
