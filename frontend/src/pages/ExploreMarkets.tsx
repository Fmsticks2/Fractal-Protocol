import { useMemo, useState } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'

 type Market = {
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

const mockMarkets: Market[] = [
  { id: '1', title: 'BTC above $80k by Dec 31', category: 'Crypto', tags: ['DeFi','L2'], volume: 1250000, liquidity: 75000, endsAt: '2025-12-31', probability: 62, status: 'open' },
  { id: '2', title: 'ETH staking share > 30% in Q4', category: 'Crypto', tags: ['DeFi'], volume: 620000, liquidity: 50000, endsAt: '2025-10-15', probability: 54, status: 'open' },
  { id: '3', title: 'OpenAI releases GPT-6 by May', category: 'AI', tags: ['NLP'], volume: 980000, liquidity: 82000, endsAt: '2025-05-01', probability: 47, status: 'open' },
  { id: '4', title: 'Team X wins the championship', category: 'Sports', tags: ['League'], volume: 310000, liquidity: 20000, endsAt: '2025-03-30', probability: 41, status: 'open' },
  { id: '5', title: 'Election candidate Y wins presidency', category: 'Politics', tags: ['Election'], volume: 2200000, liquidity: 120000, endsAt: '2025-11-05', probability: 58, status: 'open' },
  { id: '6', title: 'Global GDP growth > 3% in 2025', category: 'Economy', tags: ['GDP'], volume: 450000, liquidity: 45000, endsAt: '2025-12-20', probability: 35, status: 'open' },
  { id: '7', title: 'Successful lunar mission launch', category: 'Science', tags: ['Space'], volume: 530000, liquidity: 30000, endsAt: '2025-07-15', probability: 72, status: 'open' },
  { id: '8', title: 'New Layer-2 beats 5k TPS', category: 'Crypto', tags: ['L2'], volume: 270000, liquidity: 18000, endsAt: '2025-06-01', probability: 49, status: 'open' },
]

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

  const markets = useMemo(() => {
    let rows = mockMarkets.filter(m => m.status === 'open')

    if (category !== 'All') rows = rows.filter(m => m.category === category)
    if (activeTag) rows = rows.filter(m => m.tags.includes(activeTag))
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      rows = rows.filter(m => m.title.toLowerCase().includes(q))
    }

    rows = rows.slice()
    rows.sort((a, b) => {
      switch (sort) {
        case 'volume':
          return b.volume - a.volume
        case 'liquidity':
          return b.liquidity - a.liquidity
        case 'ending':
          return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime()
        case 'trending':
        default:
          return (b.volume + b.liquidity) - (a.volume + a.liquidity)
      }
    })

    return rows
  }, [search, category, sort, activeTag])

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
          <Link to="/create" className="hidden md:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-semibold">
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

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {markets.map((m) => (
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
                <span className="px-2 py-1 rounded-full bg-white/10 text-white text-xs">Open</span>
              </div>

              {/* Tags */}
              <div className="mt-3 flex flex-wrap gap-2">
                {m.tags.map(tag => (
                  <span key={tag} className="px-2 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-muted-foreground">{tag}</span>
                ))}
              </div>

              {/* Stats */}
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">Volume</div>
                  <div className="text-white font-semibold">${(m.volume/1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Liquidity</div>
                  <div className="text-white font-semibold">${(m.liquidity/1000).toFixed(0)}k</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Probability</div>
                  <div className="text-white font-semibold">{m.probability}%</div>
                </div>
              </div>

              {/* Probability Bar */}
              <div className="mt-3">
                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                  <div style={{ width: `${m.probability}%` }} className="h-2 bg-blue-600" />
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 flex items-center justify-between">
                <Link to="/create" className="text-muted-foreground hover:text-white transition-colors">Create similar</Link>
                <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold">Trade</button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA */}
        <div className="text-center mt-12">
          <Link to="/create" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-semibold">
            <Icon icon="mdi:plus-circle" className="w-5 h-5" />
            Create a New Market
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ExploreMarkets
