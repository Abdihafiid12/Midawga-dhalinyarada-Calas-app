import { Loader2 } from 'lucide-react'
export default function Spinner({ label = 'Loading...' }) {
  return <div className="flex items-center justify-center gap-2 p-10 text-gray-500"><Loader2 className="h-5 w-5 animate-spin text-red-600" />{label}</div>
}
