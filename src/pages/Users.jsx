import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Loader2, UserPlus } from 'lucide-react'
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
export default function Users() {
  const { session } = useAuth()
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [err, setErr] = useState(''); const [ok, setOk] = useState('')
  const [f, setF] = useState({ full_name: '', email: '', password: '', role: 'staff' }); const [busy, setBusy] = useState(false)
  const load = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at')
    if (error) setErr(error.message); else setUsers(data); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const patch = async (id, changes) => {
    setErr(''); const { error } = await supabase.from('profiles').update(changes).eq('id', id)
    if (error) setErr(error.message); else load()
  }
  const create = async e => {
    e.preventDefault(); setErr(''); setOk('')
    if (f.full_name.trim().length < 2) return setErr('Enter the full name')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email')
    if (f.password.length < 8) return setErr('Password must be at least 8 characters')
    setBusy(true)
    // Separate non-persisting client keeps the admin's own session untouched. Uses the public anon key only.
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { data, error } = await tmp.auth.signUp({ email: f.email.trim(), password: f.password, options: { data: { full_name: f.full_name.trim() } } })
    if (error || !data.user) { setBusy(false); return setErr(error?.message || 'Could not create user') }
    await patch(data.user.id, { role: f.role, is_active: true, full_name: f.full_name.trim() })
    setBusy(false); setOk(`Account created for ${f.email}`); setF({ full_name: '', email: '', password: '', role: 'staff' })
  }
  if (loading) return <Spinner />
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">User Management</h1><p className="text-sm text-gray-500">Create accounts, assign roles, activate or deactivate access</p></div>
      <ErrorBox message={err} />{ok && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}
      <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5" noValidate>
        <input className="input" placeholder="Full name" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
        <input className="input" type="email" placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input className="input" type="password" placeholder="Temp password (8+)" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        <select className="input" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select>
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}Create user</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm"><thead className="bg-gray-900 text-xs uppercase text-gray-300"><tr>{['Name','Email','Role','Active'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{users.map(u => { const me = u.id === session.user.id; return (
            <tr key={u.id}><td className="px-4 py-3 font-medium">{u.full_name || '—'}</td><td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3"><select disabled={me} className="input w-28" value={u.role} onChange={e => patch(u.id, { role: e.target.value })}><option value="staff">Staff</option><option value="admin">Admin</option></select></td>
              <td className="px-4 py-3"><input type="checkbox" disabled={me} className="h-4 w-4 accent-red-600" checked={u.is_active} onChange={e => patch(u.id, { is_active: e.target.checked })} /></td></tr>)})}</tbody></table>
      </div>
    </div>)
}
