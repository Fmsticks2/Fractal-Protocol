import { useState } from 'react'
import { Icon } from '@iconify/react'
import { Link } from 'react-router-dom'

const CreateMarket = () => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('Crypto')
  const [type, setType] = useState<'binary' | 'multi' | 'scalar'>('binary')
  const [closeAt, setCloseAt] = useState('')
  const [oracle, setOracle] = useState('Chainlink')
  const [collateral, setCollateral] = useState('USDC')
  const [liquidity, setLiquidity] = useState<number>(1000)
  const [probability, setProbability] = useState<number>(50)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    alert('Market created (demo). This is a placeholder interaction.')
  }

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-400 text-sm font-medium mb-4">
            <Icon icon="mdi:target" className="w-4 h-4 mr-2" />
            Create Market
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-white">Launch a prediction market</h1>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            Define your event, configure outcomes, and set resolution details. Fractal Protocol gives you professional tools to create markets in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Market Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Market name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Will BTC close above $80k by Dec 31?"
                      className="w-full bg-input text-white placeholder-white/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {['Crypto', 'AI', 'Sports', 'Politics', 'Economy', 'Science'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm text-muted-foreground mb-2">Description</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      placeholder="Add context, resolution criteria, and any additional notes for participants."
                      className="w-full bg-input text-white placeholder-white/50 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Outcome type</label>
                    <div className="flex items-center gap-3">
                      {[
                        { key: 'binary', label: 'Binary' },
                        { key: 'multi', label: 'Multiple Choice' },
                        { key: 'scalar', label: 'Scalar' },
                      ].map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setType(opt.key as typeof type)}
                          className={`px-4 py-2 rounded-xl border ${
                            type === opt.key ? 'border-primary-500 bg-primary-500/10 text-white' : 'border-border text-muted-foreground'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Binary: Yes/No  Multiple: several discrete outcomes  Scalar: numeric range
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Close date & time</label>
                    <input
                      type="datetime-local"
                      value={closeAt}
                      onChange={(e) => setCloseAt(e.target.value)}
                      className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Settlement oracle</label>
                    <select
                      value={oracle}
                      onChange={(e) => setOracle(e.target.value)}
                      className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {['Chainlink', 'UMA', 'Pyth', 'Custom'].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground mt-2">Choose trusted sources to resolve outcomes.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Collateral</label>
                    <select
                      value={collateral}
                      onChange={(e) => setCollateral(e.target.value)}
                      className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {['USDC', 'DAI', 'ETH'].map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Seed liquidity</label>
                    <input
                      type="number"
                      min={0}
                      value={liquidity}
                      onChange={(e) => setLiquidity(Number(e.target.value))}
                      className="w-full bg-input text-white border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                    <p className="text-xs text-muted-foreground mt-2">Initial liquidity for the pool, in {collateral}.</p>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">Initial odds / probability</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={probability}
                        onChange={(e) => setProbability(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-white font-medium w-14 text-right">{probability}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Sets the starting price curve for outcomes.</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold">
                  Create Market
                </button>
                <Link to="/explore" className="text-muted-foreground hover:text-white transition-colors">
                  Back to Explore
                </Link>
              </div>
            </form>
          </div>

          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Preview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white font-bold text-lg">{name || 'Untitled Market'}</div>
                  <div className="text-muted-foreground text-sm">{category}  {type.toUpperCase()}</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-primary-600 text-white text-xs">New</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {description || 'Add a description to help traders understand the event and resolution criteria.'}
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Closes</div>
                  <div className="text-white font-medium">{closeAt ? new Date(closeAt).toLocaleString() : 'Not set'}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Oracle</div>
                  <div className="text-white font-medium">{oracle}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Collateral</div>
                  <div className="text-white font-medium">{collateral}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-xs text-muted-foreground">Seed Liquidity</div>
                  <div className="text-white font-medium">{liquidity} {collateral}</div>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <div className="text-xs text-muted-foreground">Initial Odds</div>
                <div className="text-white font-bold text-2xl">{probability}%</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">Projected fee</div>
                <div className="text-white font-semibold">{(liquidity * 0.01).toFixed(2)} {collateral}</div>
              </div>
              <button className="w-full bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-semibold">
                Create Market
              </button>
              <p className="text-xs text-muted-foreground">
                Markets are subject to protocol terms. Ensure resolution criteria are objective and verifiable.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CreateMarket
