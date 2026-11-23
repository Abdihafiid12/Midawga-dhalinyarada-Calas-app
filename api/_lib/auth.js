import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
const COOKIE = 'bdms_session'
function secret() {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET is not configured')
  return new TextEncoder().encode(process.env.JWT_SECRET)
}
export function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map(v => v.trim()).filter(Boolean).map(v => {
    const i = v.indexOf('=')
    return [v.slice(0, i), decodeURIComponent(v.slice(i + 1))]
  }))
}
export async function createSession(user) {
  return new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('12h').sign(secret())
}
export async function requireUser(req, sql) {
  const token = parseCookies(req)[COOKIE]
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, secret())
    const rows = await sql`select id,email,full_name,role,is_active from users where id=${payload.sub}`
    return rows[0]?.is_active ? rows[0] : null
  } catch { return null }
}
export function sessionCookie(token, maxAge = 43200) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure}`
}
export function clearSessionCookie() {
  return sessionCookie('', 0)
}
export const hashPassword = password => bcrypt.hash(password, 12)
export const verifyPassword = (password, hash) => bcrypt.compare(password, hash)
