import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table'
import { api } from '@/lib/api'
import { Trash2 } from 'lucide-react'

const STATUS_META: Record<string, { label: string; variant: any }> = {
  new: { label: 'Yeni', variant: 'info' },
  aradi: { label: 'Aradım', variant: 'warning' },
  kazandi: { label: 'Kazandı', variant: 'success' },
  kaybetti: { label: 'Kaybetti', variant: 'danger' },
  spam: { label: 'Spam', variant: 'muted' },
}

export function Leads() {
  const [all, setAll] = useState<any[]>([])
  const [bizMap, setBizMap] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('')

  useEffect(() => {
    api.listBusinesses().then(bs => setBizMap(Object.fromEntries(bs.map(b => [b.id, b.name]))))
    api.listLeads().then(setAll)
  }, [])

  const filtered = all.filter(l => {
    if (statusF && (l.status || 'new') !== statusF) return false
    if (search && !(l.message || '').toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const counts = all.reduce((acc, l) => { acc[l.status || 'new'] = (acc[l.status || 'new'] || 0) + 1; return acc }, {} as Record<string, number>)

  const update = async (id: number, patch: any) => {
    await api.updateLead(id, patch)
    setAll(a => a.map(x => x.id === id ? { ...x, ...patch } : x))
  }

  const del = async (id: number) => {
    if (!confirm('Bu lead silinsin mi?')) return
    await api.deleteLead(id)
    setAll(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Leadler</h2>
        <p className="text-sm text-ink-muted mt-1">Bot'a "fiyat / randevu / teklif" yazan ziyaretçiler.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_META).map(([k, v]) => (
          <button key={k} onClick={() => setStatusF(statusF === k ? '' : k)}
            className={`p-4 rounded-lg border text-left transition-colors ${statusF === k ? 'border-brand bg-brand-soft' : 'border-border bg-surface hover:bg-bg'}`}>
            <div className="text-xs uppercase tracking-wide text-ink-muted">{v.label}</div>
            <div className="text-2xl font-semibold mt-1 tabular-nums">{counts[k] || 0}</div>
          </button>
        ))}
      </div>

      <Card>
        <CardContent className="p-5">
          <div className="flex gap-2 mb-4 flex-wrap">
            <Input placeholder="Mesajda ara..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />
            {statusF && <Button variant="ghost" size="sm" onClick={() => setStatusF('')}>Filtreyi kaldır</Button>}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12 text-sm text-ink-muted">Lead bulunamadı.</div>
          ) : (
            <div className="overflow-x-auto -mx-5">
              <Table>
                <THead>
                  <TR>
                    <TH>Tarih</TH>
                    <TH>İşletme</TH>
                    <TH>Mesaj</TH>
                    <TH>Durum</TH>
                    <TH>Not</TH>
                    <TH></TH>
                  </TR>
                </THead>
                <TBody>
                  {filtered.map(l => {
                    const meta = STATUS_META[l.status || 'new']
                    const ts = new Date(parseInt(l.timestamp))
                    return (
                      <TR key={l.id}>
                        <TD className="text-xs text-ink-muted whitespace-nowrap">
                          {ts.toLocaleDateString('tr-TR')}<br />{ts.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </TD>
                        <TD className="text-sm">{bizMap[l.business_id] || '—'}</TD>
                        <TD className="max-w-sm"><div className="text-sm">{l.message}</div></TD>
                        <TD>
                          <select value={l.status || 'new'} onChange={e => update(l.id, { status: e.target.value })}
                            className="h-8 px-2 rounded-md border border-border bg-white text-xs">
                            {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                          </select>
                        </TD>
                        <TD>
                          <input value={l.notes || ''} onChange={e => update(l.id, { notes: e.target.value })}
                            placeholder="Not..." className="h-8 px-2 text-xs border border-border rounded-md w-40" />
                        </TD>
                        <TD>
                          <Button variant="ghost" size="icon" onClick={() => del(l.id)} className="text-danger"><Trash2 className="w-4 h-4" /></Button>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
