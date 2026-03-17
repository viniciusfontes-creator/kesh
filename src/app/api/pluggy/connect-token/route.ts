import { createClient } from '@/lib/supabase/server'
import { createConnectToken } from '@/lib/pluggy/client'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json().catch(() => ({}))

    const webhookBaseUrl = process.env.PLUGGY_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL
    const webhookUrl = webhookBaseUrl ? `${webhookBaseUrl}/api/pluggy/webhook` : undefined

    // oauthRedirectUrl is required for Open Finance connectors (real banks)
    // After authorizing at the bank, user is redirected back here
    const appUrl = body.origin || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const oauthRedirectUrl = `${appUrl}/configuracoes`

    const token = await createConnectToken({
      clientUserId: user.id,
      itemId: body.itemId,
      webhookUrl,
      oauthRedirectUrl,
    })

    return Response.json(token)
  } catch (error) {
    console.error('Error creating connect token:', error)
    return Response.json(
      { error: 'Falha ao criar token de conexão' },
      { status: 500 }
    )
  }
}
