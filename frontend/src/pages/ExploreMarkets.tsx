import { useMemo, useState, useEffect } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'
import { getMarkets, type MarketItem } from '../config/api'



const categoryOptions = ['All','Crypto','AI','Sports','Politics','Economy','Science']
const sortOptions = [
  { key: 'trending', label: 'Trending' },
  { key: 'volume', label: 'Top Volume' },
  { key: 'liquidity', label: 'Top Liquidity' },
  { key: 'ending', label: 'Ending Soon' },
] as const
const tagOptions = ['DeFi','L2','NLP','Election','GDP','Space']

const ExploreMarkets = () => {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState<typeof sortOptions[number]['key']>('trending')
  const [activeTag, setActiveTag] = useState<string | null>(null)

  const [markets, setMarkets] = useState<MarketItem[]>([])
  const [page, setPage] = useState(1)
  const [pageSize] = useState(9)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        const { items, total } = await getMarkets({
          page,
          pageSize,
          category: category === 'All' ? undefined : category,
          tag: activeTag ?? undefined,
          search,
          sort,
        })
        setMarkets(items)
        setTotal(total)
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch markets')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [search, category, sort, activeTag, page, pageSize])

  const displayMarkets = useMemo(() => {
    let rows = markets.slice()

    if (activeTag) rows = rows.filter(m => (m.tags || []).includes(activeTag))
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      rows = rows.filter(m => m.title.toLowerCase().includes(q))
    }

    rows.sort((a, b) => {
      switch (sort) {
        case 'volume':
          return (b.volume ?? 0) - (a.volume ?? 0)
        case 'liquidity':
          return (b.liquidity ?? 0) - (a.liquidity ?? 0)
        case 'ending':
          return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
        case 'trending':
        default:
          return ((b.volume ?? 0) + (b.liquidity ?? 0)) - ((a.volume ?? 0) + (a.liquidity ?? 0))
      }
    })

    return rows
  }, [markets, search, sort, activeTag])

  const gradientForCategory = (cat: string) => {
    switch (cat) {
      case 'Crypto': return 'from-blue-500 to-cyan-500'
      case 'AI': return 'from-purple-500 to-pink-500'
      case 'Sports': return 'from-green-500 to-emerald-500'
      case 'Politics': return 'from-indigo-500 to-blue-500'
      case 'Economy': return 'from-teal-500 to-green-500'
      case 'Science': return 'from-orange-500 to-red-500'
      default: return 'from-primary-500 to-secondary-500'
    }
  }

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary-500/10 border border-secondary-500/20 text-secondary-400 text-sm font-medium mb-4">
              <Icon icon="mdi:compass-outline" className="w-4 h-4 mr-2" />
              Explore Markets
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-white">Discover trending prediction markets</h1>
            <p className="text-muted-foreground mt-3 max-w-2xl">
              Filter by category, tags, and popularity to find opportunities that match your interests. Professional layout and data at-a-glance.
            </p>
          </div>
          <Link to="/create" className="hidden md:inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-5 py-3 rounded-xl font-semibold">
            <Icon icon="mdi:target" className="w-5 h-5" />
            Create Market
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Search</label>
              <div className="relative">
                <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search markets..."
                  className="w-full bg-input text-white placeholder-white/50 border border-border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {categoryOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Sort by</label>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {sortOptions.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">Tags:</span>
            {tagOptions.map(t => (
              <button
                key={t}
                onClick={() => setActiveTag(activeTag === t ? null : t)}
                className={`px-3 py-1 rounded-full border ${activeTag === t ? 'border-primary-500 bg-primary-500/10 text-white' : 'border-border text-muted-foreground'}`}
              >
                {t}
              </button>
            ))}
            {activeTag && (
              <button onClick={() => setActiveTag(null)} className="ml-2 text-sm text-muted-foreground hover:text-white">Clear tag</button>
            )}
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl">
            <span className="font-semibold">Error:</span> {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading && Array.from({ length: pageSize }).map((_, i) => (
            <div key={i} className="bg-card/50 border border-border rounded-2xl p-6 animate-pulse">
              <div className="w-14 h-14 bg-white/10 rounded-xl mb-4" />
              <div className="h-4 w-3/4 bg-white/10 rounded mb-2" />
              <div className="h-3 w-1/2 bg-white/10 rounded mb-4" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-12 bg-white/10 rounded" />
                <div className="h-12 bg-white/10 rounded" />
                <div className="h-12 bg-white/10 rounded" />
              </div>
              <div className="h-2 w-full bg-white/10 rounded mt-3" />
              <div className="mt-6 h-10 bg-white/10 rounded" />
            </div>
          ))}

          {!loading && displayMarkets.map((m) => (
            <div key={m.id} className="group relative bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 hover:bg-card/80 hover:border-primary-500/30 transition-all duration-300">
              {/* Icon */}
              <div className={`w-14 h-14 bg-gradient-to-r ${gradientForCategory(m.category)} rounded-xl flex items-center justify-center mb-4`}>
                <Icon icon="mdi:graph-outline" className="w-7 h-7 text-white" />
              </div>

              {/* Title & Meta */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">{m.title}</h3>
                  <div className="text-sm text-muted-foreground">{m.category}  ends {new Date(m.endsAt).toLocaleDateString()}</div>
                </div>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white text-xs">{m.status === 'open' ? 'Open' : 'Closed'}</span>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {(m.tags || []).map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">{tag}</span>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="text-white font-semibold">${((m.volume ?? 0)/1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Liquidity</div>
                  <div className="text-white font-semibold">${((m.liquidity ?? 0)/1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Probability</div>
                  <div className="text-white font-semibold">{m.probability ?? 0}%</div>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="mt-3">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div style={{ width: `${m.probability ?? 0}%` }} className="h-2 bg-primary-600" />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between">
                <Link to="/create" className="text-muted-foreground hover:text-white transition-colors">Create similar</Link>
                <button className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold">Trade</button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        {!loading && displayMarkets.length === 0 && (
          <div className="text-center py-16">
            <Icon icon="mdi:folder-outline" className="mx-auto w-10 h-10 text-muted-foreground" />
            <h3 className="mt-4 text-white font-semibold">No markets found</h3>
            <p className="text-muted-foreground">Try adjusting filters or search terms.</p>
          </div>
        )}

        {/* Pagination */}
        <div className="mt-10 flex items-center justify-center gap-2">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-2 rounded-lg border border-border text-muted-foreground disabled:opacity-50"
          >
            Prev
          </button>
          {Array.from({ length: Math.max(1, Math.ceil((total || 0) / pageSize)) }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-2 rounded-lg border ${page === i + 1 ? 'border-primary-500 bg-primary-500/10 text-white' : 'border-border text-muted-foreground'}`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={loading || page >= Math.max(1, Math.ceil((total || 0) / pageSize))}
            onClick={() => setPage(p => p + 1)}
            className="px-3 py-2 rounded-lg border border-border text-muted-foreground disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <Link to="/create" className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-full font-semibold">
            <Icon icon="mdi:plus-circle" className="w-5 h-5" />
            Create a New Market
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ExploreMarkets
