import { createClient as createServiceClient } from '@supabase/supabase-js'
import { syncItem } from '@/lib/pluggy/sync'

function getServiceClient() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const { event, eventId, itemId, clientUserId, triggeredBy } = payload

    const supabase = getServiceClient()

    // Log the webhook event
    const { error: logError } = await supabase
      .from('pluggy_webhook_events')
      .upsert({
        event,
        event_id: eventId,
        item_id: itemId,
        triggered_by: triggeredBy,
        client_user_id: clientUserId,
        payload,
      }, { onConflict: 'event_id' })

    if (logError) {
      console.error('Webhook log error:', logError.message)
    }

    // Process event based on type
    if (itemId && clientUserId) {
      switch (event) {
        case 'item/created':
        case 'item/updated': {
          const result = await syncItem(clientUserId, itemId)

          await supabase
            .from('pluggy_webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              error: result.error ?? null,
            })
            .eq('event_id', eventId)
          break
        }

        case 'item/error': {
          await supabase
            .from('pluggy_items')
            .update({
              status: 'LOGIN_ERROR',
              error_message: payload.error?.message ?? 'Erro desconhecido',
              updated_at: new Date().toISOString(),
            })
            .eq('pluggy_item_id', itemId)

          await supabase
            .from('pluggy_webhook_events')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('event_id', eventId)
          break
        }

        case 'item/deleted': {
          await supabase
            .from('pluggy_items')
            .delete()
            .eq('pluggy_item_id', itemId)

          await supabase
            .from('pluggy_webhook_events')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('event_id', eventId)
          break
        }

        case 'transactions/created':
        case 'transactions/updated': {
          // Re-sync the full item to capture new/updated transactions
          const result = await syncItem(clientUserId, itemId)

          await supabase
            .from('pluggy_webhook_events')
            .update({
              processed: true,
              processed_at: new Date().toISOString(),
              error: result.error ?? null,
            })
            .eq('event_id', eventId)
          break
        }

        default: {
          // Mark unknown events as processed
          await supabase
            .from('pluggy_webhook_events')
            .update({ processed: true, processed_at: new Date().toISOString() })
            .eq('event_id', eventId)
        }
      }
    }

    // Return 200 quickly as required by Pluggy (< 5 seconds)
    return Response.json({ ok: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    // Still return 200 to prevent retries for unrecoverable errors
    return Response.json({ ok: true })
  }
}
