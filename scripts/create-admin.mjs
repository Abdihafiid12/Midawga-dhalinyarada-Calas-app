import pg from 'pg'
import bcrypt from 'bcryptjs'
import fs from 'node:fs'

const env = {}
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const index = line.indexOf('=')
    if (index > 0) env[line.slice(0, index)] = line.slice(index + 1)
  }
}

const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL
const [email, password, fullName = 'Administrator'] = process.argv.slice(2)
if (!databaseUrl || !email || !password) throw new Error('DATABASE_URL, email, and password are required')

const hash = await bcrypt.hash(password, 12)
const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
await client.connect()
await client.query(
  `insert into users(email,password_hash,full_name,role,is_active)
   values($1,$2,$3,'admin',true)
   on conflict(email) do update set
     password_hash=excluded.password_hash,
     full_name=excluded.full_name,
     role='admin', is_active=true`,
  [email.trim().toLowerCase(), hash, fullName],
)
await client.end()
console.log(`Neon admin ready: ${email}`)
