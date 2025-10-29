const express = require('express');
const cors = require('cors');
const app = express();
const { Pool } = require('pg')
const crypto = require('crypto')
const fetch = require('node-fetch')

// Configure CORS: restrict in production via ALLOWED_ORIGINS, allow localhost in dev
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
const corsOptions = {
  origin: (origin, cb) => {
    // Allow non-browser or same-origin requests
    if (!origin) return cb(null, true)
    if (allowedOrigins.length) {
      return cb(null, allowedOrigins.includes(origin))
    }
    // Default: allow localhost dev ports 5173/5174
    const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1):(5173|5174)$/.test(origin)
    return cb(null, isLocal)
  },
  credentials: true,
}
app.use(cors(corsOptions));
app.use(express.json());

// Linera GraphQL
const LINERA_GRAPHQL_URL = process.env.LINERA_GRAPHQL_URL || 'http://127.0.0.1:8080/graphql'

// Seed data
let markets = [
  { id: '1', title: 'BTC above $80k by Dec 31', category: 'Crypto', tags: ['DeFi','L2'], volume: 1250000, liquidity: 75000, endsAt: '2025-12-31', probability: 62, status: 'open' },
  { id: '2', title: 'ETH staking share > 30% in Q4', category: 'Crypto', tags: ['DeFi'], volume: 620000, liquidity: 50000, endsAt: '2025-10-15', probability: 54, status: 'open' },
  { id: '3', title: 'OpenAI releases GPT-6 by May', category: 'AI', tags: ['NLP'], volume: 980000, liquidity: 82000, endsAt: '2025-05-01', probability: 47, status: 'open' },
  { id: '4', title: 'Team X wins the championship', category: 'Sports', tags: ['League'], volume: 310000, liquidity: 20000, endsAt: '2025-03-30', probability: 41, status: 'open' },
  { id: '5', title: 'Election candidate Y wins presidency', category: 'Politics', tags: ['Election'], volume: 2200000, liquidity: 120000, endsAt: '2025-11-05', probability: 58, status: 'open' },
  { id: '6', title: 'Global GDP growth > 3% in 2025', category: 'Economy', tags: ['GDP'], volume: 450000, liquidity: 45000, endsAt: '2025-12-20', probability: 35, status: 'open' },
  { id: '7', title: 'Successful lunar mission launch', category: 'Science', tags: ['Space'], volume: 530000, liquidity: 30000, endsAt: '2025-07-15', probability: 72, status: 'open' },
  { id: '8', title: 'New Layer-2 beats 5k TPS', category: 'Crypto', tags: ['L2'], volume: 270000, liquidity: 18000, endsAt: '2025-06-01', probability: 49, status: 'open' },
  { id: '9', title: 'Bitcoin ETF inflows exceed $5B in Q1', category: 'Crypto', tags: ['ETF'], volume: 800000, liquidity: 55000, endsAt: '2025-03-31', probability: 57, status: 'open' },
  { id: '10', title: 'AI model surpasses human on LSAT', category: 'AI', tags: ['NLP'], volume: 350000, liquidity: 20000, endsAt: '2025-04-30', probability: 44, status: 'open' },
  { id: '11', title: 'Team Y reaches finals', category: 'Sports', tags: ['League'], volume: 150000, liquidity: 12000, endsAt: '2025-02-10', probability: 33, status: 'open' },
  { id: '12', title: 'Candidate Z loses primary', category: 'Politics', tags: ['Election'], volume: 900000, liquidity: 65000, endsAt: '2025-09-20', probability: 48, status: 'open' },
  { id: '13', title: 'US CPI < 3% by year-end', category: 'Economy', tags: ['CPI'], volume: 420000, liquidity: 32000, endsAt: '2025-12-12', probability: 51, status: 'open' },
  { id: '14', title: 'SpaceX lands Starship successfully', category: 'Science', tags: ['Space'], volume: 1100000, liquidity: 90000, endsAt: '2025-08-01', probability: 69, status: 'open' },
  { id: '15', title: 'New L3 gains 1M users', category: 'Crypto', tags: ['L2'], volume: 380000, liquidity: 25000, endsAt: '2025-07-01', probability: 46, status: 'open' },
  { id: '16', title: 'Chatbot passes Turing Test', category: 'AI', tags: ['NLP'], volume: 730000, liquidity: 42000, endsAt: '2025-10-01', probability: 40, status: 'open' },
  { id: '17', title: 'Olympic world record broken', category: 'Sports', tags: ['Olympics'], volume: 210000, liquidity: 15000, endsAt: '2025-08-15', probability: 28, status: 'open' },
  { id: '18', title: 'EU adopts crypto MiCA v2', category: 'Politics', tags: ['Regulation'], volume: 500000, liquidity: 35000, endsAt: '2025-12-01', probability: 55, status: 'open' },
  { id: '19', title: 'Global GDP growth > 4%', category: 'Economy', tags: ['GDP'], volume: 300000, liquidity: 22000, endsAt: '2025-11-25', probability: 31, status: 'open' },
  { id: '20', title: 'James Webb discovers exoplanet biosignatures', category: 'Science', tags: ['Space'], volume: 250000, liquidity: 21000, endsAt: '2025-09-09', probability: 24, status: 'open' }
];

function applyFiltersSort(items, { category, tag, search, sort }) {
  let rows = [...items];
  if (category) rows = rows.filter(m => m.category === category);
  if (tag) rows = rows.filter(m => (m.tags || []).includes(tag));
  if (search) {
    const q = String(search).toLowerCase();
    rows = rows.filter(m => (m.title || '').toLowerCase().includes(q));
  }

  rows.sort((a, b) => {
    switch (sort) {
      case 'volume':
        return (b.volume || 0) - (a.volume || 0);
      case 'liquidity':
        return (b.liquidity || 0) - (a.liquidity || 0);
      case 'ending':
        return new Date(a.endsAt).getTime() - new Date(b.endsAt).getTime();
      case 'trending':
      default:
        return ((b.volume || 0) + (b.liquidity || 0)) - ((a.volume || 0) + (a.liquidity || 0));
    }
  });

  return rows;
}

const useDB = !!process.env.DATABASE_URL
let pool = null

if (useDB) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
  ;(async function ensureSchema() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS markets (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        tags JSONB DEFAULT '[]'::jsonb,
        volume NUMERIC DEFAULT 0,
        liquidity NUMERIC DEFAULT 0,
        ends_at TIMESTAMPTZ NOT NULL,
        probability NUMERIC DEFAULT 50,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMPTZ DEFAULT now()
      );
    `)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets (ends_at);`)
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_markets_tags ON markets USING GIN (tags);`)
    console.log('DB schema ensured')
  })().catch(err => console.error('DB init error', err))
}

// Linera proxy: health and GraphQL forward
app.get('/api/linera/health', async (req, res) => {
  try {
    const r = await fetch(LINERA_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __schema { queryType { name } } }' })
    })
    return res.json({ ok: r.ok, status: r.status })
  } catch (err) {
    return res.status(503).json({ ok: false, error: String(err && err.message || err) })
  }
})

app.post('/api/linera/graphql', async (req, res) => {
  try {
    const r = await fetch(LINERA_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(req.body || {})
    })
    const json = await r.json().catch(() => null)
    return res.status(r.status).json(json || {})
  } catch (err) {
    console.error('Linera proxy error:', err)
    return res.status(502).json({ error: 'Bad Gateway', details: String(err && err.message || err) })
  }
})

app.get('/api/markets', async (req, res) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1)
  const pageSize = Math.max(parseInt(req.query.pageSize) || 9, 1)
  const { category, tag, search, sort } = req.query

  if (useDB) {
    try {
      const whereClauses = []
      const params = []
      let idx = 1

      if (category) { whereClauses.push(`category = $${idx++}`); params.push(category) }
      if (tag) { whereClauses.push(`tags @> $${idx++}::jsonb`); params.push(JSON.stringify([tag])) }
      if (search) { whereClauses.push(`LOWER(title) LIKE $${idx++}`); params.push(`%${String(search).toLowerCase()}%`) }

      const whereSQL = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : ''
      let orderSQL = 'ORDER BY (COALESCE(volume,0) + COALESCE(liquidity,0)) DESC'
      switch (String(sort || 'trending')) {
        case 'volume': orderSQL = 'ORDER BY volume DESC'; break
        case 'liquidity': orderSQL = 'ORDER BY liquidity DESC'; break
        case 'ending': orderSQL = 'ORDER BY ends_at ASC'; break
      }

      const countRes = await pool.query(`SELECT COUNT(*) AS count FROM markets ${whereSQL}`, params)
      const total = Number(countRes.rows[0].count)

      params.push(pageSize)
      params.push((page - 1) * pageSize)

      const itemsRes = await pool.query(
        `SELECT id, title, description, category, tags, volume, liquidity, ends_at, probability, status
         FROM markets ${whereSQL} ${orderSQL}
         LIMIT $${idx++} OFFSET $${idx++}`,
        params
      )

      const items = itemsRes.rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        tags: Array.isArray(r.tags) ? r.tags : (typeof r.tags === 'string' ? JSON.parse(r.tags || '[]') : []),
        volume: Number(r.volume || 0),
        liquidity: Number(r.liquidity || 0),
        endsAt: new Date(r.ends_at).toISOString(),
        probability: Number(r.probability || 50),
        status: r.status || 'open',
      }))

      return res.json({ items, total, page, pageSize })
    } catch (err) {
      console.error('GET /api/markets error', err)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else {
    const filtered = applyFiltersSort(markets, { category, tag, search, sort })
    const total = filtered.length
    const start = (page - 1) * pageSize
    const items = filtered.slice(start, start + pageSize)
    return res.json({ items, total, page, pageSize })
  }
})

app.get('/api/markets/:id', async (req, res) => {
  const id = req.params.id
  if (useDB) {
    try {
      const r = await pool.query(
        `SELECT id, title, description, category, tags, volume, liquidity, ends_at, probability, status FROM markets WHERE id = $1`,
        [id]
      )
      if (!r.rows.length) return res.status(404).json({ error: 'Not found' })
      const m = r.rows[0]
      return res.json({
        id: m.id,
        title: m.title,
        description: m.description,
        category: m.category,
        tags: Array.isArray(m.tags) ? m.tags : (typeof m.tags === 'string' ? JSON.parse(m.tags || '[]') : []),
        volume: Number(m.volume || 0),
        liquidity: Number(m.liquidity || 0),
        endsAt: new Date(m.ends_at).toISOString(),
        probability: Number(m.probability || 50),
        status: m.status || 'open',
      })
    } catch (err) {
      console.error('GET /api/markets/:id error', err)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else {
    const found = markets.find(m => m.id === id)
    if (!found) return res.status(404).json({ error: 'Not found' })
    return res.json(found)
  }
})

app.post('/api/markets', async (req, res) => {
  const p = req.body || {}
  if (!p.title || !p.category || !p.closeAt) {
    return res.status(400).json({ error: 'title, category, and closeAt are required' })
  }
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
  const endsAtDate = new Date(p.closeAt)
  if (isNaN(endsAtDate.getTime())) {
    return res.status(400).json({ error: 'Invalid closeAt' })
  }
  const item = {
    id,
    title: String(p.title),
    description: p.description || null,
    category: String(p.category),
    tags: Array.isArray(p.tags) ? p.tags : [],
    volume: 0,
    liquidity: Number(p.liquidity) || 0,
    endsAt: endsAtDate.toISOString(),
    probability: Number(p.probability) || 50,
    status: 'open',
  }

  if (useDB) {
    try {
      await pool.query(
        `INSERT INTO markets (id, title, description, category, tags, volume, liquidity, ends_at, probability, status)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)`,
        [
          item.id,
          item.title,
          item.description,
          item.category,
          JSON.stringify(item.tags),
          item.volume,
          item.liquidity,
          item.endsAt,
          item.probability,
          item.status,
        ]
      )
      return res.status(201).json(item)
    } catch (err) {
      console.error('POST /api/markets error', err)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else {
    markets.unshift(item)
    return res.status(201).json(item)
  }
})

app.get('/health', async (req, res) => {
  if (useDB) {
    try {
      await pool.query('SELECT 1')
      return res.json({ ok: true, db: true })
    } catch (err) {
      return res.status(500).json({ ok: false, db: false })
    }
  } else {
    return res.json({ ok: true, db: false })
  }
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mock API running on http://localhost:${PORT}`);
});