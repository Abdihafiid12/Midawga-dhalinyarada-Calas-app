import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify } from 'jose'

const COOKIE = 'bdms_session'

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...headers },
  })
}

function parseCookies(request) {
  return Object.fromEntries((request.headers.get('cookie') || '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)
    .map(value => {
      const index = value.indexOf('=')
      return [value.slice(0, index), decodeURIComponent(value.slice(index + 1))]
    }))
}

function secret(env) {
  if (!env.JWT_SECRET) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(env.JWT_SECRET)
}

async function requireUser(request, env, sql) {
  const token = parseCookies(request)[COOKIE]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret(env))
    const rows = await sql`select id,email,full_name,role,is_active from users where id=${payload.sub}`
    return rows[0]?.is_active ? rows[0] : null
  } catch {
    return null
  }
}

function sessionCookie(token, maxAge = 43200) {
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}; Secure`
}

async function readJson(request) {
  try {
    return await request.json()
  } catch {
    throw Object.assign(new Error('Invalid JSON request body'), { status: 400 })
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (!env.DATABASE_URL) {
      if (url.pathname.startsWith('/api/')) {
        return json({ error: 'DATABASE_URL is not configured' }, 500)
      }
    }

    if (url.pathname.startsWith('/api/')) {
      try {
        if (url.pathname === '/api/health' && request.method === 'GET') {
          return json({
            ok: true,
            databaseConfigured: !!env.DATABASE_URL,
            jwtConfigured: !!env.JWT_SECRET,
          })
        }

        const sql = neon(env.DATABASE_URL)

        if (url.pathname === '/api/auth/me' && request.method === 'GET') {
          const user = await requireUser(request, env, sql)
          return user ? json({ user }) : json({ error: 'Not authenticated' }, 401)
        }

        if (url.pathname === '/api/auth/login' && request.method === 'POST') {
          const { email, password } = await readJson(request)
          const normalizedEmail = String(email || '').trim().toLowerCase()
          const rows = await sql`select id,email,password_hash,full_name,role,is_active from users where lower(email)=${normalizedEmail}`
          const user = rows[0]
          if (!user || !await bcrypt.compare(String(password || ''), user.password_hash)) {
            return json({ error: 'Invalid email or password' }, 401)
          }
          if (!user.is_active) return json({ error: 'Your account is not authorized yet' }, 403)
          const token = await new SignJWT({ sub: user.id, role: user.role })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('12h')
            .sign(secret(env))
          return json(
            { user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role, is_active: user.is_active } },
            200,
            { 'set-cookie': sessionCookie(token) },
          )
        }

        if (url.pathname === '/api/auth/logout' && request.method === 'POST') {
          return json({ ok: true }, 200, { 'set-cookie': `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0; Secure` })
        }

        if (url.pathname === '/api/donors') {
          const user = await requireUser(request, env, sql)
          if (!user) return json({ error: 'Not authenticated' }, 401)

          if (request.method === 'GET') {
            const donors = await sql`select * from donors order by created_at desc`
            return json({ donors })
          }

          if (request.method === 'DELETE') {
            if (user.role !== 'admin') return json({ error: 'Admin access required' }, 403)
            await sql`delete from donors where id=${url.searchParams.get('id')}`
            return json({ ok: true })
          }

          const d = await readJson(request)
          const normalizedPhone = String(d.phone || '').replace(/\D/g, '')
          if (!d.full_name || !d.phone || !d.gender || !d.blood_group || !d.city) {
            return json({ error: 'Required donor fields are missing' }, 400)
          }

          if (request.method === 'POST') {
            try {
              const rows = await sql`
                insert into donors(full_name,gender,age,phone,normalized_phone,blood_group,city,address,availability_status,created_by)
                values(${d.full_name.trim()},${d.gender},${Number(d.age)},${d.phone.trim()},${normalizedPhone},
                  ${d.blood_group},${d.city.trim()},${(d.address || '').trim()},${!!d.availability_status},${user.id})
                returning *`
              return json({ donor: rows[0] }, 201)
            } catch (error) {
              if (error.code === '23505') return json({ error: 'This phone number is already registered' }, 409)
              throw error
            }
          }

          if (request.method === 'PUT') {
            try {
              const rows = await sql`
                update donors set full_name=${d.full_name.trim()},gender=${d.gender},age=${Number(d.age)},
                  phone=${d.phone.trim()},normalized_phone=${normalizedPhone},blood_group=${d.blood_group},
                  city=${d.city.trim()},address=${(d.address || '').trim()},
                  availability_status=${!!d.availability_status},updated_at=now()
                where id=${d.id} returning *`
              return json({ donor: rows[0] })
            } catch (error) {
              if (error.code === '23505') return json({ error: 'This phone number is already registered' }, 409)
              throw error
            }
          }
        }

        if (url.pathname === '/api/users') {
          const user = await requireUser(request, env, sql)
          if (!user) return json({ error: 'Not authenticated' }, 401)
          if (user.role !== 'admin') return json({ error: 'Admin access required' }, 403)

          if (request.method === 'GET') {
            const users = await sql`select id,email,full_name,role,is_active,created_at from users order by created_at`
            return json({ users })
          }
          if (request.method === 'PATCH') {
            const d = await readJson(request)
            await sql`
              update users set role=coalesce(${d.role ?? null},role),
                is_active=coalesce(${d.is_active ?? null},is_active),
                full_name=coalesce(${d.full_name ?? null},full_name),updated_at=now()
              where id=${d.id}`
            return json({ ok: true })
          }
          if (request.method === 'POST') {
            const d = await readJson(request)
            const email = String(d.email || '').trim().toLowerCase()
            const passwordHash = await bcrypt.hash(String(d.password || ''), 12)
            try {
              await sql`
                insert into users(email,password_hash,full_name,role,is_active)
                values(${email},${passwordHash},${String(d.full_name || '').trim()},${d.role === 'admin' ? 'admin' : 'staff'},true)`
              return json({ ok: true }, 201)
            } catch (error) {
              if (error.code === '23505') return json({ error: 'Email is already registered' }, 409)
              throw error
            }
          }
        }

        return json({ error: 'Unknown API endpoint' }, 404)
      } catch (error) {
        return json({ error: error.message || 'Server error' }, error.status || 500)
      }
    }

    if (env.ASSETS) return env.ASSETS.fetch(request)
    return new Response('Not found', { status: 404 })
  },
}
