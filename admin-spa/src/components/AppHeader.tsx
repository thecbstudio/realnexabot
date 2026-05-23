import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export function AppHeader({ title }: { title?: string }) {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [active, setActive] = useState<string>(() => localStorage.getItem('nexa_active_biz') || '')

  useEffect(() => {
    api.listBusinesses().then(list => {
      setBusinesses(list)
      if (!active && list.length) {
        setActive(list[0].id)
        localStorage.setItem('nexa_active_biz', list[0].id)
      }
    }).catch(() => {})
  }, [])

  const onChange = (id: string) => {
    setActive(id)
    localStorage.setItem('nexa_active_biz', id)
    // Re-render listeners (simple global event)
    window.dispatchEvent(new CustomEvent('biz-changed', { detail: id }))
  }

  return (
    <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-10">
      <h1 className="text-sm font-medium text-ink-muted">{title}</h1>
      {businesses.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-faint">İşletme:</span>
          <select
            value={active}
            onChange={e => onChange(e.target.value)}
            className="h-8 px-2 rounded-md border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20"
          >
            {businesses.map(b => (
              <option key={b.id} value={b.id}>{b.name || b.id}</option>
            ))}
          </select>
        </div>
      )}
    </header>
  )
}

export function useActiveBusinessId() {
  const [id, setId] = useState(() => localStorage.getItem('nexa_active_biz') || '')
  useEffect(() => {
    const handler = (e: any) => setId(e.detail)
    window.addEventListener('biz-changed', handler)
    return () => window.removeEventListener('biz-changed', handler)
  }, [])
  return id
}
