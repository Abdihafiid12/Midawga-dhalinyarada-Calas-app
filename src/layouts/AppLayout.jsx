import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, FileBarChart, UserCog, LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import mdcLogo from '../assets/mdc-logo.png'
export default function AppLayout() {
  const { profile, isAdmin, signOut } = useAuth(); const [open, setOpen] = useState(false)
  const links = [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true }, { to: '/donors', label: 'Donors', icon: Users },
    { to: '/reports', label: 'Reports', icon: FileBarChart }, ...(isAdmin ? [{ to: '/users', label: 'Users', icon: UserCog }] : [])]
  return (
    <div className="min-h-screen lg:flex">
      {open && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-gray-900 text-gray-200 transition-transform lg:static lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-5 py-5"><img src={mdcLogo} alt="Midawga Dhalinyarada Calas" className="h-12 w-12 object-contain" />
          <div><p className="font-bold leading-none text-white">Midawga Dhalinyarada Calas</p><p className="text-xs text-gray-400">Blood Donor System</p></div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
        <nav className="flex-1 space-y-1 px-3">
          {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} onClick={() => setOpen(false)}
            className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-red-600 text-white' : 'hover:bg-gray-800'}`}>
            <l.icon className="h-5 w-5" />{l.label}</NavLink>)}
        </nav>
        <div className="border-t border-gray-800 p-4">
          <p className="truncate text-sm font-medium text-white">{profile?.full_name || profile?.email}</p>
          <p className="mb-3 text-xs capitalize text-gray-400">{profile?.role}</p>
          <button onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-gray-800"><LogOut className="h-4 w-4" />Sign out</button>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b bg-white px-4 py-3 lg:hidden">
          <button onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button><span className="font-bold text-red-600">Midawga Dhalinyarada Calas</span></header>
        <main className="p-4 sm:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>)
}
