import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { Plus, Trash2 } from 'lucide-react'

export function AppHeader({ title }: { title?: string }) {
  const [businesses, setBusinesses] = useState<any[]>([])
  const [active, setActive] = useState<string>(() => localStorage.getItem('nexa_active_biz') || '')
  const [showNew, setShowNew] = useState(false)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const load = async () => {
    const list = await api.listBusinesses()
    setBusinesses(list)
    if (!active && list.length) {
      setActive(list[0].id)
      localStorage.setItem('nexa_active_biz', list[0].id)
    }
    return list
  }

  useEffect(() => { load().catch(() => {}) }, [])

  const onChange = (id: string) => {
    setActive(id)
    localStorage.setItem('nexa_active_biz', id)
    window.dispatchEvent(new CustomEvent('biz-changed', { detail: id }))
  }

  const createBusiness = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const r = await api.saveBusiness({ name: newName.trim() })
      const list = await load()
      const created = list.find((b: any) => b.id === r.businessId) || list[0]
      if (created) onChange(created.id)
      setNewName('')
      setShowNew(false)
    } catch (e: any) { alert('Hata: ' + e.message) }
    finally { setCreating(false) }
  }

  const deleteBusiness = async () => {
    if (!active) return
    const biz = businesses.find(b => b.id === active)
    if (!biz) return
    if (!confirm(`"${biz.name || biz.id}" işletmesi silinsin mi? Konuşmaları, leadleri ve KB de silinir.`)) return
    try {
      await api.deleteBusiness(active)
      const list = await load()
      if (list.length) onChange(list[0].id)
      else { setActive(''); localStorage.removeItem('nexa_active_biz') }
    } catch (e: any) { alert('Hata: ' + e.message) }
  }

  return (
    <>
      <header className="h-14 border-b border-border bg-surface px-6 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-sm font-medium text-ink-muted">{title}</h1>
        <div className="flex items-center gap-2">
          {businesses.length > 0 && (
            <>
              <span className="text-xs text-ink-faint hidden sm:inline">İşletme:</span>
              <select value={active} onChange={e => onChange(e.target.value)}
                className="h-8 px-2 rounded-md border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/20 max-w-[200px]">
                {businesses.map(b => (
                  <option key={b.id} value={b.id}>{b.name || b.id}</option>
                ))}
              </select>
              <button onClick={deleteBusiness} title="Bu işletmeyi sil"
                className="h-8 w-8 flex items-center justify-center rounded-md border border-border bg-white text-ink-muted hover:text-danger hover:border-red-300">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button onClick={() => setShowNew(true)}
            className="h-8 px-3 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand-hover flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Yeni İşletme
          </button>
        </div>
      </header>

      {showNew && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => !creating && setShowNew(false)}>
          <div className="bg-surface rounded-lg p-6 max-w-md w-full shadow-pop" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-ink mb-1">Yeni İşletme</h3>
            <p className="text-sm text-ink-muted mb-4">İşletme adını yaz, sonra Ayarlar'dan detayları doldurursun.</p>
            <input autoFocus value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && createBusiness()}
              placeholder="Örn: Mehmet'in Restoranı" disabled={creating}
              className="w-full h-10 px-3 rounded-md border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            <div className="flex gap-2 justify-end mt-4">
              <button onClick={() => setShowNew(false)} disabled={creating}
                className="h-9 px-4 rounded-md border border-border bg-white text-sm text-ink hover:bg-bg">İptal</button>
              <button onClick={createBusiness} disabled={creating || !newName.trim()}
                className="h-9 px-4 rounded-md bg-brand text-white text-sm font-medium hover:bg-brand-hover disabled:opacity-50">
                {creating ? 'Oluşturuluyor...' : 'Oluştur'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
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
