import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'
export default function ProtectedRoute({ children, adminOnly }) {
  const { session, profile, loading, isActive, isAdmin, signOut } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (profile === undefined) return <Spinner label="Loading profile... / Waa la soo dejinayaa xogta..." />
  if (!isActive) return (
    <div className="flex min-h-screen items-center justify-center p-4"><div className="card max-w-md p-8 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-red-600" />
      <h1 className="mt-4 text-xl font-bold">Access pending<br /><span className="text-base">Gelitaanka ayaa sugaya</span></h1>
      <p className="mt-2 text-sm text-gray-600">Your account is not authorized yet. Ask an administrator to activate it.<br />Koontadaada weli lama oggolaan. Weydii maamulaha inuu hawlgeliyo.</p>
      <button className="btn-primary mt-6" onClick={signOut}><span><span className="block">Sign out</span><span className="block text-xs">Ka bax</span></span></button></div></div>)
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}
