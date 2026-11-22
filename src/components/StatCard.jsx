export default function StatCard({ label, value, icon: Icon, highlight }) {
  return (
    <div className={`card flex items-center justify-between p-4 ${highlight ? 'bg-red-600 text-white border-red-600' : ''}`}>
      <div><p className={`text-xs font-semibold uppercase tracking-wide ${highlight ? 'text-red-100' : 'text-gray-500'}`}>{label}</p>
        <p className="mt-1 text-3xl font-bold">{value}</p></div>
      <div className={`rounded-full p-3 ${highlight ? 'bg-white/20' : 'bg-red-50 text-red-600'}`}><Icon className="h-6 w-6" /></div>
    </div>)
}
