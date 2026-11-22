import { Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'
export default function ProtectedRoute({ children, adminOnly }) {
  const { session, profile, loading, isActive, isAdmin, signOut } = useAuth()
  if (loading) return <Spinner />
  if (!session) return <Navigate to="/login" replace />
  if (profile === undefined) return <Spinner label="Loading profile..." />
  if (!isActive) return (
    <div className="flex min-h-screen items-center justify-center p-4"><div className="card max-w-md p-8 text-center">
      <ShieldAlert className="mx-auto h-12 w-12 text-red-600" />
      <h1 className="mt-4 text-xl font-bold">Access pending</h1>
      <p className="mt-2 text-sm text-gray-600">Your account is not authorized yet. Ask an administrator to activate it.</p>
      <button className="btn-primary mt-6" onClick={signOut}>Sign out</button></div></div>)
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />
  return children
}
