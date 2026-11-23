import { sql } from '../_lib/db.js'
import { createSession, sessionCookie, verifyPassword } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const db = sql()
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })
  const rows = await db`select id,email,password_hash,full_name,role,is_active from users where email=${email}`
  const user = rows[0]
  if (!user || !await verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }
  if (!user.is_active) return res.status(403).json({ error: 'Your account is not authorized yet' })
  const token = await createSession(user)
  res.setHeader('Set-Cookie', sessionCookie(token))
  res.status(200).json({ user: { id:user.id, email:user.email, full_name:user.full_name, role:user.role, is_active:user.is_active } })
}
