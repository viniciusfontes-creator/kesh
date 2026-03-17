/**
 * Fix Pluggy webhooks: clean up stale ones and register a single "all" webhook
 *
 * Usage: npx tsx scripts/fix-webhooks.ts
 */

import { config } from 'dotenv'
config({ path: '.env.local' })

const PLUGGY_BASE_URL = 'https://api.pluggy.ai'
const VERCEL_WEBHOOK_URL = 'https://kesh-ai.vercel.app/api/pluggy/webhook'

async function fix() {
  const clientId = process.env.PLUGGY_CLIENT_ID!
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET!

  // 1. Authenticate
  console.log('1. Authenticating...')
  const authRes = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  })
  if (!authRes.ok) {
    console.error('Auth failed:', await authRes.text())
    process.exit(1)
  }
  const { apiKey } = await authRes.json()
  console.log('   OK\n')

  // 2. List and delete ALL existing webhooks
  console.log('2. Removing all existing webhooks...')
  const listRes = await fetch(`${PLUGGY_BASE_URL}/webhooks`, {
    headers: { 'X-API-KEY': apiKey },
  })
  const { results: existing } = await listRes.json()

  for (const wh of existing ?? []) {
    console.log(`   Deleting [${wh.id}] event="${wh.event}" url="${wh.url}"`)
    const delRes = await fetch(`${PLUGGY_BASE_URL}/webhooks/${wh.id}`, {
      method: 'DELETE',
      headers: { 'X-API-KEY': apiKey },
    })
    console.log(`   -> ${delRes.status === 200 ? 'Deleted' : 'Status ' + delRes.status}`)
  }
  console.log()

  // 3. Register a single "all" webhook pointing to Vercel
  console.log(`3. Registering webhook event="all" -> ${VERCEL_WEBHOOK_URL}`)
  const regRes = await fetch(`${PLUGGY_BASE_URL}/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      event: 'all',
      url: VERCEL_WEBHOOK_URL,
    }),
  })

  const regBody = await regRes.text()
  if (regRes.ok) {
    const data = JSON.parse(regBody)
    console.log(`   Registered! ID: ${data.id}`)
  } else {
    console.error(`   FAILED: ${regRes.status} - ${regBody}`)
    process.exit(1)
  }
  console.log()

  // 4. Verify
  console.log('4. Verifying final state...')
  const verifyRes = await fetch(`${PLUGGY_BASE_URL}/webhooks`, {
    headers: { 'X-API-KEY': apiKey },
  })
  const { results: final } = await verifyRes.json()
  for (const wh of final ?? []) {
    console.log(`   [${wh.id}] event="${wh.event}" url="${wh.url}"`)
  }

  console.log('\nDone!')
}

fix().catch(console.error)
