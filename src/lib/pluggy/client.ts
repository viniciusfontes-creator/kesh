/**
 * Pluggy API Client
 *
 * Handles authentication and API calls to Pluggy's Open Finance platform.
 * Credentials are stored ONLY in server-side environment variables.
 */

const PLUGGY_BASE_URL = 'https://api.pluggy.ai'

let cachedApiKey: string | null = null
let apiKeyExpiresAt: number = 0

/**
 * Authenticates with Pluggy API using CLIENT_ID and CLIENT_SECRET.
 * Returns an API key valid for 2 hours.
 * Uses in-memory caching to avoid unnecessary auth calls.
 */
export async function getPluggyApiKey(): Promise<string> {
  // Return cached key if still valid (with 5min buffer)
  if (cachedApiKey && Date.now() < apiKeyExpiresAt - 5 * 60 * 1000) {
    return cachedApiKey
  }

  const clientId = process.env.PLUGGY_CLIENT_ID
  const clientSecret = process.env.PLUGGY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET são obrigatórios')
  }

  const res = await fetch(`${PLUGGY_BASE_URL}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Falha na autenticação Pluggy: ${res.status} - ${error}`)
  }

  const data = await res.json()
  cachedApiKey = data.apiKey
  // API key expires in 2 hours
  apiKeyExpiresAt = Date.now() + 2 * 60 * 60 * 1000

  return cachedApiKey!
}

/**
 * Creates a Connect Token for the Pluggy Connect Widget.
 * Valid for 30 minutes. Used on the frontend to allow users to connect accounts.
 */
export async function createConnectToken(options?: {
  itemId?: string
  clientUserId?: string
  webhookUrl?: string
  oauthRedirectUrl?: string
}): Promise<{ accessToken: string }> {
  const apiKey = await getPluggyApiKey()

  const res = await fetch(`${PLUGGY_BASE_URL}/connect_token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      ...(options?.itemId && { itemId: options.itemId }),
      ...(options?.clientUserId && { clientUserId: options.clientUserId }),
      ...(options?.webhookUrl && { webhookUrl: options.webhookUrl }),
      ...(options?.oauthRedirectUrl && { oauthRedirectUrl: options.oauthRedirectUrl }),
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Falha ao criar connect token: ${res.status} - ${error}`)
  }

  return res.json()
}

// ============================================================
// Generic API caller
// ============================================================

async function pluggyFetch<T>(
  path: string,
  options?: RequestInit & { params?: Record<string, string> }
): Promise<T> {
  const apiKey = await getPluggyApiKey()

  const url = new URL(`${PLUGGY_BASE_URL}${path}`)
  if (options?.params) {
    Object.entries(options.params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const res = await fetch(url.toString(), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
      ...options?.headers,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`Pluggy API error [${path}]: ${res.status} - ${error}`)
  }

  return res.json()
}

// ============================================================
// Connectors
// ============================================================

export interface PluggyConnector {
  id: number
  name: string
  institutionUrl: string
  imageUrl: string
  type: string
  country: string
  credentials: Array<{
    label: string
    name: string
    type: string
    placeholder?: string
  }>
  hasMFA: boolean
  products: string[]
  isOpenFinance: boolean
}

export async function listConnectors(params?: {
  name?: string
  types?: string
  countries?: string
}): Promise<{ results: PluggyConnector[] }> {
  const searchParams: Record<string, string> = {}
  if (params?.name) searchParams.name = params.name
  if (params?.types) searchParams.types = params.types
  if (params?.countries) searchParams.countries = params.countries

  return pluggyFetch('/connectors', { params: searchParams })
}

// ============================================================
// Items
// ============================================================

export interface PluggyItem {
  id: string
  connector: { id: number; name: string }
  status: string
  executionStatus: string
  createdAt: string
  updatedAt: string
  lastUpdatedAt: string
  nextAutoSyncAt: string | null
  clientUserId: string | null
  error: { code: string; message: string } | null
  parameter: unknown | null
  userAction: string | null
}

export async function getItem(itemId: string): Promise<PluggyItem> {
  return pluggyFetch(`/items/${itemId}`)
}

export async function deleteItem(itemId: string): Promise<void> {
  const apiKey = await getPluggyApiKey()
  await fetch(`${PLUGGY_BASE_URL}/items/${itemId}`, {
    method: 'DELETE',
    headers: { 'X-API-KEY': apiKey },
  })
}

// ============================================================
// Accounts
// ============================================================

export interface PluggyAccount {
  id: string
  itemId: string
  type: 'BANK' | 'CREDIT'
  subtype: string
  name: string
  number: string
  balance: number
  currencyCode: string
  bankData?: {
    transferNumber: string
    closingBalance: number
  }
  creditData?: {
    level: string
    brand: string
    balanceCloseDate: string
    balanceDueDate: string
    availableCreditLimit: number
    creditLimit: number
  }
}

export async function getAccounts(itemId: string): Promise<{ results: PluggyAccount[] }> {
  return pluggyFetch('/accounts', { params: { itemId } })
}

export async function getAccount(accountId: string): Promise<PluggyAccount> {
  return pluggyFetch(`/accounts/${accountId}`)
}

// ============================================================
// Transactions
// ============================================================

export interface PluggyTransaction {
  id: string
  accountId: string
  date: string
  description: string
  descriptionRaw: string | null
  amount: number
  balance: number | null
  currencyCode: string
  type: 'DEBIT' | 'CREDIT'
  status: 'PENDING' | 'POSTED'
  category: string | null
  categoryId: string | null
  operationType: string | null
  providerCode: string | null
  paymentData: unknown | null
  creditCardMetadata: unknown | null
  merchant: {
    name: string
    businessName: string
    cnpj: string
    category: string
  } | null
}

export async function getTransactions(
  accountId: string,
  params?: { from?: string; to?: string; page?: number; pageSize?: number }
): Promise<{
  total: number
  totalPages: number
  page: number
  results: PluggyTransaction[]
}> {
  const searchParams: Record<string, string> = { accountId }
  if (params?.from) searchParams.from = params.from
  if (params?.to) searchParams.to = params.to
  if (params?.page) searchParams.page = String(params.page)
  if (params?.pageSize) searchParams.pageSize = String(params.pageSize)

  return pluggyFetch('/transactions', { params: searchParams })
}

// ============================================================
// Identity
// ============================================================

export interface PluggyIdentity {
  id: string
  itemId: string
  fullName: string
  cpf: string
  birthDate: string
  emails: Array<{ type: string; value: string }>
  phoneNumbers: Array<{ type: string; value: string }>
  addresses: Array<{
    fullAddress: string
    primaryAddress: string
    city: string
    state: string
    postalCode: string
    country: string
  }>
}

export async function getIdentity(itemId: string): Promise<PluggyIdentity> {
  return pluggyFetch(`/identity?itemId=${itemId}`)
}

// ============================================================
// Webhooks
// ============================================================

export async function createWebhook(params: {
  event: string
  url: string
  headers?: Record<string, string>
}): Promise<{ id: string; event: string; url: string }> {
  return pluggyFetch('/webhooks', {
    method: 'POST',
    body: JSON.stringify(params),
  })
}

export async function listWebhooks(): Promise<{ results: Array<{ id: string; event: string; url: string }> }> {
  return pluggyFetch('/webhooks')
}

export async function deleteWebhook(webhookId: string): Promise<void> {
  const apiKey = await getPluggyApiKey()
  await fetch(`${PLUGGY_BASE_URL}/webhooks/${webhookId}`, {
    method: 'DELETE',
    headers: { 'X-API-KEY': apiKey },
  })
}
