const express = require('express');
const cors = require('cors');
const app = express();
const { Pool } = require('pg')
const crypto = require('crypto')
const fetchModule = require('node-fetch')
const fetch = fetchModule.default || fetchModule
const helmetModule = require('helmet')
/** @type {any} */ const helmet = helmetModule.default || helmetModule
const compression = require('compression')
const morgan = require('morgan')
const rateLimitModule = require('express-rate-limit')
/** @type {any} */ const rateLimit = rateLimitModule.default || rateLimitModule

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
app.set('trust proxy', 1);
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

const apiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  max: Number(process.env.RATE_LIMIT_MAX || 500),
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Linera GraphQL (use 8081 for wallet service to avoid faucet port conflict)
const LINERA_GRAPHQL_URL = process.env.LINERA_GRAPHQL_URL || 'http://127.0.0.1:8081/graphql'




const isProd = process.env.NODE_ENV === 'production'
const hasDb = !!process.env.DATABASE_URL
if (isProd && !hasDb) {
  console.error('DATABASE_URL must be set in production')
  process.exit(1)
}
const useDB = hasDb || isProd
let pool = null

if (useDB) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isProd ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PG_POOL_MAX || 10),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 30000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 5000),
  })
  pool.on('error', (err) => console.error('Unexpected DB error', err))
  ;(async function ensureSchema() {
     const client = await pool.connect()
     try {
       await client.query(`
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
        CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets (ends_at);
        CREATE INDEX IF NOT EXISTS idx_markets_tags ON markets USING GIN (tags);
      `)
     } finally {
       client.release()
     }
   })()
 }

// Linera proxy: health and GraphQL forward
app.get('/api/linera/health', async (req, res) => {
  try {
    const r = await fetch(LINERA_GRAPHQL_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query: '{ __schema { queryType { name } } } }' })
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
  const page = Math.max(parseInt(String(req.query.page || '')) || 1, 1)
  const pageSize = Math.max(parseInt(String(req.query.pageSize || '')) || 9, 1)
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
    return res.status(503).json({ error: 'Database not configured' })
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
    return res.status(503).json({ error: 'Database not configured' })
  }
})

app.post('/api/markets', async (req, res) => {
  const p = req.body || {}
  const title = String(p.title || '').trim()
  const category = String(p.category || '').trim()
  const desc = String(p.description || '').trim()
  const endsAtDate = new Date(p.closeAt)
  const tags = Array.isArray(p.tags) ? p.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 20) : []
  const liquidity = Number(p.liquidity)
  const probability = Number(p.probability)
  if (title.length < 3 || title.length > 200) return res.status(422).json({ error: 'title length must be 3-200' })
  if (!category || category.length > 50) return res.status(422).json({ error: 'category required (max 50 chars)' })
  if (isNaN(endsAtDate.getTime()) || endsAtDate.getTime() <= Date.now()) return res.status(422).json({ error: 'closeAt must be a future date' })
  if (!Number.isFinite(liquidity) || liquidity < 0) return res.status(422).json({ error: 'liquidity must be >= 0' })
  if (!Number.isFinite(probability) || probability < 0 || probability > 100) return res.status(422).json({ error: 'probability must be 0-100' })
  const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now())
  const item = {
    id,
    title,
    description: desc,
    category,
    tags,
    liquidity,
    probability,
    status: 'open',
    created_at: new Date(),
    ends_at: endsAtDate,
  }

  if (useDB) {
    try {
      const r = await pool.query(
        `INSERT INTO markets (id, title, description, category, tags, liquidity, probability, status, created_at, ends_at)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10) RETURNING id`,
        [
          item.id,
          item.title,
          item.description,
          item.category,
          JSON.stringify(item.tags),
          item.liquidity,
          item.probability,
          item.status,
          item.created_at,
          item.ends_at,
        ]
      )
      return res.status(201).json({ id: r.rows[0].id })
    } catch (err) {
      console.error('POST /api/markets error', err)
      return res.status(500).json({ error: 'Internal Server Error' })
    }
  } else {
    return res.status(503).json({ error: 'Database not configured' })
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

app.use((req, res) => res.status(404).json({ error: 'Not Found' }))
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal Server Error' })
})

const PORT = Number(process.env.PORT || 3000)
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})

function shutdown() {
  console.log('Shutting down gracefully...')
  server.close(() => {
    if (pool) {
      pool.end().catch(() => {}).finally(() => process.exit(0))
    } else {
      process.exit(0)
    }
  })
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)