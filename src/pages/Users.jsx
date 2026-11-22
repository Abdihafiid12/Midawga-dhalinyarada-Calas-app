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
    if (f.full_name.trim().length < 2) return setErr('Enter the full name / Geli magaca buuxa')
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return setErr('Enter a valid email / Geli iimayl sax ah')
    if (f.password.length < 8) return setErr('Password must be at least 8 characters / Furaha sirta ah waa ugu yaraan 8 xarfood')
    setBusy(true)
    // Separate non-persisting client keeps the admin's own session untouched. Uses the public anon key only.
    const tmp = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
    const { data, error } = await tmp.auth.signUp({ email: f.email.trim(), password: f.password, options: { data: { full_name: f.full_name.trim() } } })
    if (error || !data.user) { setBusy(false); return setErr(error?.message ? `${error.message} / Isku day khalmay` : 'Could not create user / Isticmaalaha lama abuuri karin') }
    await patch(data.user.id, { role: f.role, is_active: true, full_name: f.full_name.trim() })
    setBusy(false); setOk(`Account created for ${f.email} / Koontada waxaa loo sameeyey ${f.email}`); setF({ full_name: '', email: '', password: '', role: 'staff' })
  }
  if (loading) return <Spinner />
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold">User Management<br /><span className="text-lg">Maareynta Isticmaalayaasha</span></h1><p className="text-sm text-gray-500">Create accounts, assign roles, activate or deactivate access<br />Samee koontooyin, dooro doorka, hawl geli ama dami gelitaanka</p></div>
      <ErrorBox message={err} />{ok && <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">{ok}</div>}
      <form onSubmit={create} className="card grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5" noValidate>
        <input className="input" placeholder="Full name / Magaca buuxa" value={f.full_name} onChange={e => setF({ ...f, full_name: e.target.value })} />
        <input className="input" type="email" placeholder="Email / Iimayl" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
        <input className="input" type="password" placeholder="Temp password (8+) / Furaha ku meel gaadhka ah (8+)" value={f.password} onChange={e => setF({ ...f, password: e.target.value })} />
        <select className="input" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}><option value="staff">Staff / Shaqaale</option><option value="admin">Admin / Maamule</option></select>
        <button className="btn-primary" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}<span><span className="block">Create user</span><span className="block text-xs">Samee isticmaalaha</span></span></button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm"><thead className="bg-gray-900 text-xs uppercase text-gray-300"><tr>{['Name / Magac','Email / Iimayl','Role / Doorka','Active / Firfircoon'].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
          <tbody className="divide-y">{users.map(u => { const me = u.id === session.user.id; return (
            <tr key={u.id}><td className="px-4 py-3 font-medium">{u.full_name || '—'}</td><td className="px-4 py-3">{u.email}</td>
              <td className="px-4 py-3"><select disabled={me} className="input w-28" value={u.role} onChange={e => patch(u.id, { role: e.target.value })}><option value="staff">Staff / Shaqaale</option><option value="admin">Admin / Maamule</option></select></td>
              <td className="px-4 py-3"><input type="checkbox" disabled={me} className="h-4 w-4 accent-red-600" checked={u.is_active} onChange={e => patch(u.id, { is_active: e.target.checked })} /></td></tr>)})}</tbody></table>
      </div>
    </div>)
}
