import { useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { BLOOD_GROUPS, GENDERS } from '../lib/constants'
import { validateDonor } from '../lib/validation'
import ErrorBox from './ErrorBox'
const empty = { full_name:'', gender:'', age:'', phone:'', blood_group:'', city:'', address:'', availability_status:true }
export default function DonorForm({ donor, onSubmit, onCancel }) {
  const [f, setF] = useState(donor ? { ...empty, ...donor, age: String(donor.age) } : empty)
  const [errors, setErrors] = useState({}); const [saving, setSaving] = useState(false); const [serverErr, setServerErr] = useState('')
  const submitting = useRef(false)
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const submit = async e => {
    e.preventDefault(); const errs = validateDonor(f); setErrors(errs); setServerErr('')
    if (Object.keys(errs).length) return
    if (submitting.current) return
    submitting.current = true
    setSaving(true)
    try { await onSubmit(f) } catch (err) {
      setServerErr(err.message)
      submitting.current = false
      setSaving(false)
    }
  }
  const err = k => errors[k] && <p className="mt-1 text-xs text-red-600">{errors[k]}</p>
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <ErrorBox message={serverErr} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div><label className="label">Donor ID</label><input className="input bg-gray-100" disabled value={donor?.donor_code || 'Auto-generated'} /></div>
        <div><label className="label">Registration Date</label><input className="input bg-gray-100" disabled value={new Date(donor?.created_at || Date.now()).toLocaleDateString()} /></div>
        <div><label className="label">Full Name *</label><input className="input" value={f.full_name} onChange={e => set('full_name', e.target.value)} />{err('full_name')}</div>
        <div><label className="label">Gender *</label><select className="input" value={f.gender} onChange={e => set('gender', e.target.value)}><option value="">Select</option>{GENDERS.map(g => <option key={g}>{g}</option>)}</select>{err('gender')}</div>
        <div><label className="label">Age (18–65) *</label><input type="number" className="input" value={f.age} onChange={e => set('age', e.target.value)} />{err('age')}</div>
        <div><label className="label">Phone Number *</label><input type="text" inputMode="tel" autoComplete="tel" className="input" value={f.phone} onChange={e => set('phone', e.target.value)} />{err('phone')}</div>
        <div><label className="label">Blood Group *</label><select className="input" value={f.blood_group} onChange={e => set('blood_group', e.target.value)}><option value="">Select</option>{BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}</select>{err('blood_group')}</div>
        <div><label className="label">City *</label><input className="input" value={f.city} onChange={e => set('city', e.target.value)} />{err('city')}</div>
      </div>
      <div><label className="label">Address</label><textarea rows={2} className="input" value={f.address || ''} onChange={e => set('address', e.target.value)} />{err('address')}</div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="h-4 w-4 accent-red-600" checked={f.availability_status} onChange={e => set('availability_status', e.target.checked)} /> Available to donate</label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn-primary" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />}{donor ? 'Save changes' : 'Register donor'}</button>
      </div>
    </form>)
}
