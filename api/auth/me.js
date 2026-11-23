import { sql } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  const user = await requireUser(req, sql())
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  res.status(200).json({ user })
}
