import { Users, Droplet } from 'lucide-react'
import { useDonors } from '../hooks/useDonors'
import { BLOOD_GROUPS } from '../lib/constants'
import StatCard from '../components/StatCard'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
export default function Dashboard() {
  const { donors, loading, error } = useDonors()
  if (loading) return <Spinner />
  const count = g => donors.filter(d => d.blood_group === g).length
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Dashboard<br /><span className="text-lg">Shaashadda</span></h1><p className="text-sm text-gray-500">Live overview from the donor database<br />Dulmar toos ah ee kaydka deeq-bixiyayaasha</p></div>
      <ErrorBox message={error} />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        <div className="col-span-2 lg:col-span-3 xl:col-span-1"><StatCard highlight label={<><span>Total Donors</span><span className="block text-xs font-normal">Deeq-bixiyayaasha guud</span></>} value={donors.length} icon={Users} /></div>
        {BLOOD_GROUPS.map(g => <StatCard key={g} label={<><span>{g} Donors</span><span className="block text-xs font-normal">{g} Deeq-bixiya</span></>} value={count(g)} icon={Droplet} />)}
      </div>
      <div className="card">
        <h2 className="border-b px-5 py-3 font-semibold">Recent registrations<br /><span className="text-xs font-normal text-gray-500">Diwaangelinnadii ugu dambeeyey</span></h2>
        {donors.length === 0 ? <p className="p-5 text-sm text-gray-500">No donors yet.<br />Weli ma jiraan deeq-bixiyeyaal.</p> :
          <ul className="divide-y">{donors.slice(0, 6).map(d => (
            <li key={d.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div><p className="font-medium">{d.full_name}</p><p className="text-gray-500">{d.city} · {new Date(d.created_at).toLocaleDateString()}</p></div>
              <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">{d.blood_group}</span></li>))}</ul>}
      </div>
    </div>)
}
