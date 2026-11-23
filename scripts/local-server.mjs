import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import pg from 'pg'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const env = {}
if (fs.existsSync('.env.local')) {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const i = line.indexOf('=')
    if (i > 0) env[line.slice(0, i)] = line.slice(i + 1)
  }
}
const databaseUrl = env.DATABASE_URL || process.env.DATABASE_URL
const jwtSecret = env.JWT_SECRET || process.env.JWT_SECRET
if (!databaseUrl) throw new Error('DATABASE_URL is missing')
if (!jwtSecret) throw new Error('JWT_SECRET is missing')

const db = new pg.Pool({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
const secret = new TextEncoder().encode(jwtSecret)
const dist = path.resolve('dist')
const mime = {
  '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json',
  '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml', '.webmanifest':'application/manifest+json',
}

const cookies = req => Object.fromEntries((req.headers.cookie || '').split(';').map(v => v.trim()).filter(Boolean).map(v => {
  const i = v.indexOf('=')
  return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))]
}))
const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type':'application/json', 'Cache-Control':'no-store' })
  res.end(JSON.stringify(data))
}
const body = req => new Promise((resolve, reject) => {
  let text = ''
  req.on('data', chunk => { text += chunk; if (text.length > 1e6) req.destroy() })
  req.on('end', () => {
    try {
      resolve(text ? JSON.parse(text) : {})
    } catch {
      reject(Object.assign(new Error('Invalid JSON request body'), { status: 400 }))
    }
  })
})
async function requireUser(req) {
  const token = cookies(req).bdms_session
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret)
    const result = await db.query('select id,email,full_name,role,is_active from users where id=$1', [payload.sub])
    return result.rows[0]?.is_active ? result.rows[0] : null
  } catch { return null }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`)
    if (url.pathname === '/api/auth/me' && req.method === 'GET') {
      const user = await requireUser(req)
      return user ? json(res, 200, { user }) : json(res, 401, { error:'Not authenticated' })
    }
    if (url.pathname === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = await body(req)
      const result = await db.query('select id,email,password_hash,full_name,role,is_active from users where lower(email)=lower($1)', [String(email || '').trim()])
      const user = result.rows[0]
      if (!user || !await bcrypt.compare(String(password || ''), user.password_hash)) return json(res, 401, { error:'Invalid email or password' })
      if (!user.is_active) return json(res, 403, { error:'Your account is not authorized yet' })
      const token = await new SignJWT({ sub:user.id, role:user.role }).setProtectedHeader({ alg:'HS256' }).setIssuedAt().setExpirationTime('12h').sign(secret)
      res.writeHead(200, { 'Set-Cookie':`bdms_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200`, 'Content-Type':'application/json' })
      return res.end(JSON.stringify({ user:{ id:user.id,email:user.email,full_name:user.full_name,role:user.role,is_active:user.is_active } }))
    }
    if (url.pathname === '/api/auth/logout' && req.method === 'POST') {
      res.writeHead(200, { 'Set-Cookie':'bdms_session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0', 'Content-Type':'application/json' })
      return res.end(JSON.stringify({ ok:true }))
    }
    if (url.pathname === '/api/donors') {
      const user = await requireUser(req)
      if (!user) return json(res, 401, { error:'Not authenticated' })
      if (req.method === 'GET') {
        const result = await db.query('select * from donors order by created_at desc')
        return json(res, 200, { donors:result.rows })
      }
      if (req.method === 'DELETE') {
        if (user.role !== 'admin') return json(res, 403, { error:'Admin access required' })
        await db.query('delete from donors where id=$1', [url.searchParams.get('id')])
        return json(res, 200, { ok:true })
      }
      const d = await body(req)
      const normalized = String(d.phone || '').replace(/\D/g, '')
      if (req.method === 'POST') {
        try {
          const result = await db.query(`insert into donors(full_name,gender,age,phone,normalized_phone,blood_group,city,address,availability_status,created_by)
            values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *`,
            [d.full_name?.trim(),d.gender,Number(d.age),d.phone?.trim(),normalized,d.blood_group,d.city?.trim(),(d.address || '').trim(),!!d.availability_status,user.id])
          return json(res, 201, { donor:result.rows[0] })
        } catch (error) {
          if (error.code === '23505') return json(res, 409, { error:'This phone number is already registered' })
          throw error
        }
      }
      if (req.method === 'PUT') {
        try {
          const result = await db.query(`update donors set full_name=$1,gender=$2,age=$3,phone=$4,normalized_phone=$5,blood_group=$6,city=$7,address=$8,
            availability_status=$9,updated_at=now() where id=$10 returning *`,
            [d.full_name?.trim(),d.gender,Number(d.age),d.phone?.trim(),normalized,d.blood_group,d.city?.trim(),(d.address || '').trim(),!!d.availability_status,d.id])
          return json(res, 200, { donor:result.rows[0] })
        } catch (error) {
          if (error.code === '23505') return json(res, 409, { error:'This phone number is already registered' })
          throw error
        }
      }
    }
    if (url.pathname === '/api/users') {
      const user = await requireUser(req)
      if (!user) return json(res, 401, { error:'Not authenticated' })
      if (user.role !== 'admin') return json(res, 403, { error:'Admin access required' })
      if (req.method === 'GET') {
        const result = await db.query('select id,email,full_name,role,is_active,created_at from users order by created_at')
        return json(res, 200, { users:result.rows })
      }
      if (req.method === 'PATCH') {
        const d = await body(req)
        await db.query(`update users set role=coalesce($1,role),is_active=coalesce($2,is_active),full_name=coalesce($3,full_name),updated_at=now() where id=$4`,
          [d.role ?? null,d.is_active ?? null,d.full_name ?? null,d.id])
        return json(res, 200, { ok:true })
      }
      if (req.method === 'POST') {
        const d = await body(req)
        const email = String(d.email || '').trim().toLowerCase()
        const password_hash = await bcrypt.hash(String(d.password || ''), 12)
        try {
          await db.query(`insert into users(email,password_hash,full_name,role,is_active) values($1,$2,$3,$4,true)`,
            [email,password_hash,String(d.full_name || '').trim(),d.role === 'admin' ? 'admin':'staff'])
          return json(res, 201, { ok:true })
        } catch (error) {
          if (error.code === '23505') return json(res, 409, { error:'Email is already registered' })
          throw error
        }
      }
    }
    if (!url.pathname.startsWith('/api/')) {
      let file = path.join(dist, url.pathname === '/' ? 'index.html' : url.pathname)
      if (!fs.existsSync(file) || fs.statSync(file).isDirectory()) file = path.join(dist, 'index.html')
      res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream' })
      return fs.createReadStream(file).pipe(res)
    }
    return json(res, 404, { error:'Unknown API endpoint' })
  } catch (error) {
    console.error(error)
    return json(res, error.status || 500, { error:error.message || 'Server error' })
  }
})

const port = Number(process.env.PORT || 4173)
const openBrowser = url => {
  if (process.env.NO_BROWSER !== '1') {
    execFile('cmd.exe', ['/c', 'start', '', url], error => {
      if (error) console.error('Could not open browser:', error.message)
    })
  }
}

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    const url = `http://127.0.0.1:${port}`
    console.log(`BDMS is already running: ${url}`)
    openBrowser(url)
    process.exit(0)
  }
  throw error
})

server.listen(port, '127.0.0.1', () => {
  const url = `http://127.0.0.1:${port}`
  console.log(`BDMS local app: ${url}`)
  openBrowser(url)
})
