import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ErrorBox from '../components/ErrorBox'
import mdcLogo from '../assets/mdc-logo.png'
export default function Login() {
  const { session, signIn } = useAuth()
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('')
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  if (session) return <Navigate to="/" replace />
  const submit = async e => {
    e.preventDefault(); setErr('')
    if (!/^\S+@\S+\.\S+$/.test(email)) return setErr('Enter a valid email address')
    if (password.length < 6) return setErr('Password must be at least 6 characters')
    setBusy(true); const { error } = await signIn(email.trim(), password); setBusy(false)
    if (error) setErr(error.message)
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-8" noValidate>
        <div className="text-center"><img src={mdcLogo} alt="Midawga Dhalinyarada Calas" className="mx-auto mb-3 h-28 w-28 object-contain" />
          <h1 className="text-xl font-bold text-gray-900">Midawga Dhalinyarada Calas<br /><span className="text-base">Blood Donor Management</span></h1><p className="text-sm text-gray-500">Authorized members only</p></div>
        <ErrorBox message={err} />
        <div><label className="label">Email</label><input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} autoComplete="username" /></div>
        <div><label className="label">Password</label><input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Sign in</button>
      </form>
    </div>)
}
