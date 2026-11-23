import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api'
export function useDonors() {
  const [donors, setDonors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const load = useCallback(async () => {
    setError('')
    try {
      const { donors } = await api('/api/donors')
      setDonors(donors)
    } catch (error) {
      setError(error.message)
    }
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])
  const addDonor = async d => {
    await api('/api/donors', { method: 'POST', body: JSON.stringify(d) })
    await load()
  }
  const updateDonor = async (id, d) => {
    await api('/api/donors', { method: 'PUT', body: JSON.stringify({ ...d, id }) })
    await load()
  }
  const deleteDonor = async id => { await api(`/api/donors?id=${encodeURIComponent(id)}`, { method: 'DELETE' }); await load() }
  return { donors, loading, error, reload: load, addDonor, updateDonor, deleteDonor }
}
