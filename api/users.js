import { sql } from './_lib/db.js'
import { hashPassword, requireUser } from './_lib/auth.js'

export default async function handler(req, res) {
  const db = sql()
  const user = await requireUser(req, db)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  if (req.method === 'GET') {
    const users = await db`select id,email,full_name,role,is_active,created_at from users order by created_at`
    return res.status(200).json({ users })
  }
  if (req.method === 'PATCH') {
    const { id, role, is_active, full_name } = req.body
    await db`update users set role=coalesce(${role ?? null},role),is_active=coalesce(${is_active ?? null},is_active),
      full_name=coalesce(${full_name ?? null},full_name),updated_at=now() where id=${id}`
    return res.status(200).json({ ok: true })
  }
  if (req.method === 'POST') {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const full_name = String(req.body?.full_name || '').trim()
    const role = req.body?.role === 'admin' ? 'admin' : 'staff'
    if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || full_name.length < 2) {
      return res.status(400).json({ error: 'Invalid user details' })
    }
    const password_hash = await hashPassword(password)
    try {
      await db`insert into users (email,password_hash,full_name,role,is_active) values (${email},${password_hash},${full_name},${role},true)`
      return res.status(201).json({ ok: true })
    } catch (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'Email is already registered' })
      throw error
    }
  }
  return res.status(405).json({ error: 'Method not allowed' })
}
