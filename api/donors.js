import { sql } from './_lib/db.js'
import { requireUser } from './_lib/auth.js'

export default async function handler(req, res) {
  const db = sql()
  const user = await requireUser(req, db)
  if (!user) return res.status(401).json({ error: 'Not authenticated' })
  if (!['GET','POST','PUT','DELETE'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' })

  if (req.method === 'GET') {
    const rows = await db`select * from donors order by created_at desc`
    return res.status(200).json({ donors: rows })
  }
  if (req.method === 'DELETE') {
    if (user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
    await db`delete from donors where id=${req.query.id}`
    return res.status(200).json({ ok: true })
  }
  const d = req.body
  if (!d?.full_name || !d?.phone || !d?.gender || !d?.blood_group || !d?.city) {
    return res.status(400).json({ error: 'Required donor fields are missing' })
  }
  const phone = String(d.phone).trim()
  const normalized = phone.replace(/\D/g, '')
  const clean = {
    full_name:d.full_name.trim(), gender:d.gender, age:Number(d.age), phone,
    normalized_phone:normalized, blood_group:d.blood_group, city:d.city.trim(),
    address:(d.address || '').trim(), availability_status:!!d.availability_status
  }
  try {
    if (req.method === 'POST') {
      const rows = await db`
        insert into donors (full_name,gender,age,phone,normalized_phone,blood_group,city,address,availability_status,created_by)
        values (${clean.full_name},${clean.gender},${clean.age},${clean.phone},${clean.normalized_phone},${clean.blood_group},${clean.city},${clean.address},${clean.availability_status},${user.id})
        returning *`
      return res.status(201).json({ donor: rows[0] })
    }
    if (req.method === 'PUT') {
      const rows = await db`
        update donors set full_name=${clean.full_name},gender=${clean.gender},age=${clean.age},phone=${clean.phone},
          normalized_phone=${clean.normalized_phone},blood_group=${clean.blood_group},city=${clean.city},
          address=${clean.address},availability_status=${clean.availability_status},updated_at=now()
        where id=${d.id} returning *`
      return res.status(200).json({ donor: rows[0] })
    }
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ error: 'This phone number is already registered' })
    throw error
  }
}
