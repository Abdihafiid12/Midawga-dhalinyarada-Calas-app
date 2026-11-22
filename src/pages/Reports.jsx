import { Download } from 'lucide-react'
import { useDonors } from '../hooks/useDonors'
import { BLOOD_GROUPS } from '../lib/constants'
import { exportDonorsCsv } from '../lib/csv'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
export default function Reports() {
  const { donors, loading, error } = useDonors()
  if (loading) return <Spinner />
  const avail = donors.filter(d => d.availability_status).length
  const max = Math.max(1, ...BLOOD_GROUPS.map(g => donors.filter(d => d.blood_group === g).length))
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Reports</h1><p className="text-sm text-gray-500">Statistics from the live database</p></div>
        <button className="btn-primary" disabled={!donors.length} onClick={() => exportDonorsCsv(donors)}><Download className="h-4 w-4" />Export CSV</button>
      </div>
      <ErrorBox message={error} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[['Total registered', donors.length], ['Available', avail], ['Unavailable', donors.length - avail]].map(([l, v]) =>
          <div key={l} className="card p-5"><p className="text-xs font-semibold uppercase text-gray-500">{l}</p><p className="mt-1 text-3xl font-bold text-red-600">{v}</p></div>)}
      </div>
      <div className="card p-5">
        <h2 className="mb-4 font-semibold">Blood group statistics &amp; availability</h2>
        <div className="space-y-3">{BLOOD_GROUPS.map(g => {
          const all = donors.filter(d => d.blood_group === g); const a = all.filter(d => d.availability_status).length
          return (<div key={g} className="flex items-center gap-3 text-sm">
            <span className="w-10 font-bold">{g}</span>
            <div className="h-5 flex-1 overflow-hidden rounded bg-gray-100"><div className="h-full bg-red-600" style={{ width: `${(all.length / max) * 100}%` }} /></div>
            <span className="w-40 text-right text-gray-600">{all.length} total · {a} available</span></div>)})}</div>
      </div>
    </div>)
}
