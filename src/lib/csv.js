const esc = v => {
  let s = v == null ? '' : String(v)
  if (/^[=@\t\r]/.test(s)) s = "'" + s // block spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
export function exportDonorsCsv(donors) {
  const head = ['Donor ID / Aqoonsiga','Full Name / Magaca buuxa','Gender / Jinsi','Age / Da`da','Phone / Telefoon','Blood Group / Kooxda dhiiga','City / Magaalo','Address / Cinwaan','Available / La heli karo','Registered / Diiwaangashan']
  const rows = donors.map(d => [d.donor_code,d.full_name,d.gender,d.age,d.phone,d.blood_group,d.city,d.address,
    d.availability_status ? 'Yes' : 'No', new Date(d.created_at).toISOString()])
  const csv = [head, ...rows].map(r => r.map(esc).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `donors-${new Date().toISOString().slice(0,10)}.csv` })
  a.click(); URL.revokeObjectURL(url)
}
