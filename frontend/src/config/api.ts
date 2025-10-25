export type MarketItem = {
  id: string
  title: string
  category: string
  tags: string[]
  volume: number
  liquidity: number
  endsAt: string
  probability: number
  status: 'open' | 'closed'
}

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
}

const API_BASE: string = (import.meta as any).env?.VITE_API_BASE_URL ?? 'http://localhost:3000'

function toQuery(params: Record<string, any>): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && String(v).length > 0) search.append(k, String(v))
  })
  return search.toString()
}

export async function getMarkets(params: {
  page?: number
  pageSize?: number
  category?: string
  tag?: string
  search?: string
  sort?: string
} = {}): Promise<Paginated<MarketItem>> {
  const qs = toQuery({
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 9,
    category: params.category,
    tag: params.tag,
    search: params.search,
    sort: params.sort,
  })

  const url = `${API_BASE}/api/markets${qs ? `?${qs}` : ''}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to fetch markets: ${res.status}`)
  const data = await res.json()

  // Flexible response handling: array or { items, total }
  if (Array.isArray(data)) {
    return {
      items: data as MarketItem[],
      total: data.length,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? Math.max(9, data.length),
    }
  }

  const items: MarketItem[] = (data.items ?? data) as MarketItem[]
  const total: number = Number(data.total ?? items.length)
  const page: number = Number(data.page ?? params.page ?? 1)
  const pageSize: number = Number(data.pageSize ?? params.pageSize ?? 9)

  return { items, total, page, pageSize }
}

export type CreateMarketPayload = {
  title: string
  description?: string
  category: string
  type: 'binary' | 'multi' | 'scalar'
  closeAt: string
  oracle: string
  collateral: string
  liquidity: number
  probability: number
}

export async function createMarket(payload: CreateMarketPayload): Promise<MarketItem> {
  const res = await fetch(`${API_BASE}/api/markets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`Failed to create market: ${res.status}`)
  return res.json()
}