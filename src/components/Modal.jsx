import { X } from 'lucide-react'
export default function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-5 py-3"><h2 className="font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-gray-100" aria-label="Close"><X className="h-5 w-5" /></button></div>
        <div className="p-5">{children}</div>
      </div>
    </div>)
}
