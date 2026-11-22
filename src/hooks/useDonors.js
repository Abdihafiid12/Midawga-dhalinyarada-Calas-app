import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
export function useDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    let all = [], from = 0
    for (;;) { // page past Supabase's 1000-row default limit
      const { data, error } = await supabase.from('donors').select('*')
        .order('created_at', { ascending: false }).range(from, from + 999)
      if (error) { setError(error.message); break }
      all = all.concat(data)
      if (data.length < 1000) break
      from += 1000
    }
    setDonors(all); setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const clean = d => ({ full_name: d.full_name.trim(), gender: d.gender, age: Number(d.age), phone: d.phone.trim(),
    blood_group: d.blood_group, city: d.city.trim(), address: (d.address || '').trim(), availability_status: !!d.availability_status })
  const addDonor = async d => { const { error } = await supabase.from('donors').insert(clean(d)); if (error) throw error; await load() }
  const updateDonor = async (id, d) => { const { error } = await supabase.from('donors').update(clean(d)).eq('id', id); if (error) throw error; await load() }
  const deleteDonor = async id => { const { error } = await supabase.from('donors').delete().eq('id', id); if (error) throw error; await load() }
  return { donors, loading, error, reload: load, addDonor, updateDonor, deleteDonor }
}
