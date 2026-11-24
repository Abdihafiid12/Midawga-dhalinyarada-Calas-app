const esc = (v, excelTextCell = false) => {
  let s = v == null ? '' : String(v)
  if (!excelTextCell && /^[=@\t\r]/.test(s)) s = "'" + s // block spreadsheet formula injection
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const excelText = v => {
  const s = v == null ? '' : String(v)
  return `="${s.replace(/"/g, '""')}"`
}
export function exportDonorsCsv(donors) {
  const head = ['Donor ID','Full Name','Gender','Age','Phone','Blood Group','City','Address','Available','Registered']
  const rows = donors.map(d => [d.donor_code,d.full_name,d.gender,d.age,excelText(d.phone),d.blood_group,d.city,d.address,
    d.availability_status ? 'Yes' : 'No', new Date(d.created_at).toISOString()])
  const csv = [head, ...rows].map((r, rowIndex) => r.map((v, columnIndex) =>
    esc(v, rowIndex > 0 && columnIndex === 4)).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }))
  const a = Object.assign(document.createElement('a'), { href: url, download: `donors-${new Date().toISOString().slice(0,10)}.csv` })
  a.click(); URL.revokeObjectURL(url)
}
