import { createClient } from '@/lib/supabase/server'
import { syncItem, removeItem } from '@/lib/pluggy/sync'

// GET: List user's connected items
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('pluggy_items')
    .select(`
      *,
      pluggy_accounts (
        pluggy_account_id, tipo, nome, saldo, currency_code
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  return Response.json({ items: data ?? [] })
}

// POST: Sync a specific item after connection
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId } = await req.json()

  if (!itemId) {
    return Response.json({ error: 'itemId é obrigatório' }, { status: 400 })
  }

  const result = await syncItem(user.id, itemId)

  if (!result.success) {
    return Response.json({ error: result.error }, { status: 500 })
  }

  return Response.json(result)
}

// DELETE: Remove item and revoke consent
export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { itemId } = await req.json()

  if (!itemId) {
    return Response.json({ error: 'itemId é obrigatório' }, { status: 400 })
  }

  try {
    const result = await removeItem(user.id, itemId)
    return Response.json(result)
  } catch (error) {
    console.error('Error removing item:', error)
    return Response.json({ error: 'Falha ao remover conexão' }, { status: 500 })
  }
}
