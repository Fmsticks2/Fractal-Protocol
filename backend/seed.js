const { Pool } = require('pg')
const crypto = require('crypto')

async function main() {
  const conn = process.env.DATABASE_URL
  if (!conn) {
    console.error('DATABASE_URL is not set. Set it and rerun: npm run seed')
    process.exit(1)
  }
  const pool = new Pool({
    connectionString: conn,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  })
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
    `)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_markets_ends_at ON markets (ends_at);`)
    await client.query(`CREATE INDEX IF NOT EXISTS idx_markets_tags ON markets USING GIN (tags);`)

    const now = new Date()
    const inDays = (d) => new Date(now.getTime() + d*24*60*60*1000).toISOString()

    const seeds = [
      { title: 'BTC above $80k by Dec 31', category: 'Crypto', tags: ['DeFi','L2'], liquidity: 75000, volume: 1250000, probability: 62, endsAt: inDays(60) },
      { title: 'ETH staking share > 30% in Q4', category: 'Crypto', tags: ['DeFi'], liquidity: 50000, volume: 620000, probability: 54, endsAt: inDays(45) },
      { title: 'OpenAI releases GPT-6 by May', category: 'AI', tags: ['NLP'], liquidity: 82000, volume: 980000, probability: 47, endsAt: inDays(180) },
      { title: 'Team X wins the championship', category: 'Sports', tags: ['League'], liquidity: 20000, volume: 310000, probability: 41, endsAt: inDays(120) },
      { title: 'Election candidate Y wins presidency', category: 'Politics', tags: ['Election'], liquidity: 120000, volume: 2200000, probability: 58, endsAt: inDays(365) }
    ].map(s => ({
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
      title: s.title,
      description: null,
      category: s.category,
      tags: s.tags,
      volume: s.volume,
      liquidity: s.liquidity,
      endsAt: s.endsAt,
      probability: s.probability,
      status: 'open',
    }))

    let inserted = 0
    for (const m of seeds) {
      await client.query(
        `INSERT INTO markets (id, title, description, category, tags, volume, liquidity, ends_at, probability, status)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)
         ON CONFLICT (id) DO NOTHING`,
        [
          m.id,
          m.title,
          m.description,
          m.category,
          JSON.stringify(m.tags),
          m.volume,
          m.liquidity,
          m.endsAt,
          m.probability,
          m.status,
        ]
      )
      inserted++
    }

    console.log(`Seed completed: inserted ${inserted} markets`)
  } catch (err) {
    console.error('Seed error:', err)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

main()