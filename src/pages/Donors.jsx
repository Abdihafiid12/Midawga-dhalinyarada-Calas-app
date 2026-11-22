import { useMemo, useState } from 'react'
import { Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react'
import { useDonors } from '../hooks/useDonors'
import { useAuth } from '../context/AuthContext'
import { BLOOD_GROUPS } from '../lib/constants'
import DonorForm from '../components/DonorForm'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import ErrorBox from '../components/ErrorBox'
const Row = ({ k, v }) => <div className="flex justify-between gap-4 border-b py-2 text-sm"><span className="text-gray-500">{k}</span><span className="text-right font-medium">{v || '—'}</span></div>
export default function Donors() {
  const { donors, loading, error, addDonor, updateDonor, deleteDonor } = useDonors()
  const { isAdmin } = useAuth()
  const [q, setQ] = useState(''); const [bg, setBg] = useState(''); const [city, setCity] = useState('')
  const [modal, setModal] = useState(null) // {type:'add'|'edit'|'view', donor}
  const [actionErr, setActionErr] = useState('')
  const cities = useMemo(() => [...new Set(donors.map(d => d.city))].sort(), [donors])
  const term = q.trim().toLowerCase()
  const list = donors.filter(d => (!bg || d.blood_group === bg) && (!city || d.city === city) &&
    (!term || d.full_name.toLowerCase().includes(term) || d.phone.includes(term)))
  const remove = async d => {
    if (!window.confirm(`Delete donor ${d.full_name}? This cannot be undone.\nTirtir deeq-bixiyaha ${d.full_name}? Tan lama soo celin karo.`)) return
    try { setActionErr(''); await deleteDonor(d.id) } catch (e) { setActionErr(e.message) }
  }
  const close = () => setModal(null)
  const m = modal?.donor
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Donors<br /><span className="text-lg">Deeq-bixiyayaasha</span></h1><p className="text-sm text-gray-500">{list.length} of {donors.length} shown / {list.length} oo {donors.length} ah ayaa la muujiyey</p></div>
        <button className="btn-primary" onClick={() => setModal({ type: 'add' })}><Plus className="h-4 w-4" /><span><span className="block">Add donor</span><span className="block text-xs">Ku dar deeq-bixiye</span></span></button>
      </div>
      <ErrorBox message={error || actionErr} />
      <div className="card grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><input className="input pl-9" placeholder="Search name or phone / Raadi magac ama telefoon" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select className="input" value={bg} onChange={e => setBg(e.target.value)}><option value="">All blood groups / Dhammaan kooxaha dhiiga</option>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select>
        <select className="input" value={city} onChange={e => setCity(e.target.value)}><option value="">All cities / Dhammaan magaalooyinka</option>{cities.map(c => <option key={c}>{c}</option>)}</select>
      </div>
      <div className="card overflow-x-auto">
        {loading ? <Spinner /> : list.length === 0 ? <p className="p-8 text-center text-sm text-gray-500">No donors found.<br />Deeq-bixiyeyaal lama helin.</p> :
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-900 text-xs uppercase text-gray-300"><tr>{['ID','Name / Magac','Blood / Dhiig','Age/Gender / Da`/Jinsi','Phone / Tilifoon','City / Magaalo','Status / Xaalad',''].map(h => <th key={h} className="px-4 py-3">{h}</th>)}</tr></thead>
            <tbody className="divide-y">{list.map(d => (
              <tr key={d.id} className="hover:bg-red-50/40">
                <td className="px-4 py-3 text-gray-500">{d.donor_code}</td><td className="px-4 py-3 font-medium">{d.full_name}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-red-100 px-2.5 py-0.5 font-semibold text-red-700">{d.blood_group}</span></td>
                <td className="px-4 py-3">{d.age} / {d.gender}</td><td className="px-4 py-3">{d.phone}</td><td className="px-4 py-3">{d.city}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${d.availability_status ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>{d.availability_status ? 'Available / La heli karo' : 'Unavailable / Lama heli karo'}</span></td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <button className="p-1.5 text-gray-500 hover:text-gray-900" title="View / Arag" onClick={() => setModal({ type: 'view', donor: d })}><Eye className="h-4 w-4" /></button>
                  <button className="p-1.5 text-gray-500 hover:text-blue-600" title="Edit / Wax ka beddel" onClick={() => setModal({ type: 'edit', donor: d })}><Pencil className="h-4 w-4" /></button>
                  {isAdmin && <button className="p-1.5 text-gray-500 hover:text-red-600" title="Delete / Tirtir" onClick={() => remove(d)}><Trash2 className="h-4 w-4" /></button>}
                </td></tr>))}</tbody>
          </table>}
      </div>
      {modal?.type === 'add' && <Modal title="Register new donor / Diiwaangeli deeq-bixiye cusub" onClose={close}><DonorForm onCancel={close} onSubmit={async f => { await addDonor(f); close() }} /></Modal>}
      {modal?.type === 'edit' && <Modal title="Edit donor / Wax ka beddel deeq-bixiyaha" onClose={close}><DonorForm donor={m} onCancel={close} onSubmit={async f => { await updateDonor(m.id, f); close() }} /></Modal>}
      {modal?.type === 'view' && <Modal title="Donor details / Faahfaahinta deeq-bixiyaha" onClose={close}>
        <Row k="Donor ID / Aqoonsiga deeq-bixiyaha" v={m.donor_code} /><Row k="Full name / Magaca buuxa" v={m.full_name} /><Row k="Gender / Jinsi" v={m.gender} />
        <Row k="Age / Da`da" v={m.age} /><Row k="Phone / Telefoon" v={m.phone} /><Row k="Blood group / Kooxda dhiiga" v={m.blood_group} />
        <Row k="City / Magaalo" v={m.city} /><Row k="Address / Cinwaan" v={m.address} />
        <Row k="Availability / Helitaanka" v={m.availability_status ? 'Available / La heli karo' : 'Unavailable / Lama heli karo'} />
        <Row k="Registered / La diiwaangaliyey" v={new Date(m.created_at).toLocaleString()} /></Modal>}
    </div>)
}
