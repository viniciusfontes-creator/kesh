/**
 * Diagnostic script: Tests Pluggy webhook registration end-to-end
 *
 * Usage: npx tsx scripts/diagnose-webhook.ts
 *
 * Requires .env.local with PLUGGY_CLIENT_ID and PLUGGY_CLIENT_SECRET
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

const PLUGGY_BASE_URL = 'https://api.pluggy.ai'
const WEBHOOK_URL = process.env.PLUGGY_WEBHOOK_URL
  ? `${process.env.PLUGGY_WEBHOOK_URL}/api/pluggy/webhook`
  : 'https://kesh-ai.vercel.app/api/pluggy/webhook'

async function diagnose() {
  console.log('=== Pluggy Webhook Diagnostics ===\n')

  // 1. Check env vars
  console.log('1. Checking environment variables...')
  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.error('   ❌ PLUGGY_CLIENT_ID or PLUGGY_CLIENT_SECRET not set')
    process.exit(1)
  }
  console.log('   ✅ PLUGGY_CLIENT_ID:', clientId.slice(0, 8) + '...')
  console.log('   ✅ PLUGGY_CLIENT_SECRET: ****' + clientSecret.slice(-4))

  // 2. Authenticate
  console.log('\n2. Authenticating with Pluggy API...')
  let apiKey: string
  try {
    const authRes = await fetch(`${PLUGGY_BASE_URL}/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    })

    if (!authRes.ok) {
      const errText = await authRes.text()
      console.error(`   ❌ Auth failed: ${authRes.status} - ${errText}`)
      process.exit(1)
    }

    const authData = await authRes.json()
    apiKey = authData.apiKey
    console.log('   ✅ Authenticated successfully')
  } catch (err) {
    console.error('   ❌ Auth error:', (err as Error).message)
    process.exit(1)
  }

  // 3. List existing webhooks
  console.log('\n3. Listing existing webhooks...')
  try {
    const listRes = await fetch(`${PLUGGY_BASE_URL}/webhooks`, {
      headers: { 'X-API-KEY': apiKey },
    })

    if (!listRes.ok) {
      const errText = await listRes.text()
      console.error(`   ❌ List failed: ${listRes.status} - ${errText}`)
    } else {
      const data = await listRes.json()
      if (data.results?.length > 0) {
        console.log(`   Found ${data.results.length} existing webhook(s):`)
        for (const wh of data.results) {
          console.log(`   - [${wh.id}] event="${wh.event}" url="${wh.url}"`)
        }
      } else {
        console.log('   No webhooks registered yet')
      }
    }
  } catch (err) {
    console.error('   ❌ List error:', (err as Error).message)
  }

  // 4. Test the endpoint directly
  console.log(`\n4. Testing webhook endpoint: ${WEBHOOK_URL}`)
  try {
    const testStart = Date.now()
    const testRes = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'item/created',
        eventId: `diag-${Date.now()}`,
        itemId: 'diag-test',
        clientUserId: 'diag-test',
        triggeredBy: 'diagnostic-script',
      }),
    })
    const elapsed = Date.now() - testStart
    const body = await testRes.text()

    console.log(`   Status: ${testRes.status}`)
    console.log(`   Body: ${body}`)
    console.log(`   Time: ${elapsed}ms`)

    if (testRes.status >= 200 && testRes.status < 300 && elapsed < 5000) {
      console.log('   ✅ Endpoint OK (2XX within 5s)')
    } else if (elapsed >= 5000) {
      console.error('   ❌ TIMEOUT: Response took >= 5 seconds!')
    } else {
      console.error(`   ❌ Non-2XX status: ${testRes.status}`)
    }
  } catch (err) {
    console.error('   ❌ Endpoint error:', (err as Error).message)
  }

  // 5. Try registering a webhook
  console.log(`\n5. Attempting to register webhook for "item/updated"...`)
  console.log(`   URL: ${WEBHOOK_URL}`)
  try {
    const regRes = await fetch(`${PLUGGY_BASE_URL}/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        event: 'item/updated',
        url: WEBHOOK_URL,
      }),
    })

    const regBody = await regRes.text()
    console.log(`   Status: ${regRes.status}`)
    console.log(`   Response: ${regBody}`)

    if (regRes.ok) {
      console.log('   ✅ Webhook registered successfully!')
      // Clean up - delete the test webhook
      try {
        const parsed = JSON.parse(regBody)
        if (parsed.id) {
          console.log(`   Cleaning up test webhook (${parsed.id})...`)
          await fetch(`${PLUGGY_BASE_URL}/webhooks/${parsed.id}`, {
            method: 'DELETE',
            headers: { 'X-API-KEY': apiKey },
          })
          console.log('   ✅ Test webhook removed')
        }
      } catch { /* ignore cleanup errors */ }
    } else {
      console.error('   ❌ Registration FAILED')
      console.error(`   Error details: ${regBody}`)
    }
  } catch (err) {
    console.error('   ❌ Registration error:', (err as Error).message)
  }

  console.log('\n=== Diagnostics Complete ===')
}

diagnose().catch(console.error)
