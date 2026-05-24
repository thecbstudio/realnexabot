import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { Download } from 'lucide-react'

export function Conversations() {
  const bizId = useActiveBusinessId()
  const [list, setList] = useState<any[]>([])
  const [active, setActive] = useState<string | null>(null)
  const [conv, setConv] = useState<any>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.listConversations().then(setList)
  }, [])

  const filtered = list.filter(c => c.businessId === bizId && (!search || (c.lastMessage || '').toLowerCase().includes(search.toLowerCase())))

  const open = async (sid: string) => {
    setActive(sid)
    setConv(null)
    const d = await api.getConversation(sid)
    setConv(d)
  }

  const downloadCsv = async () => {
    if (!bizId) return
    const blob = await api.exportConversations(bizId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `conversations-${Date.now()}.csv`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Konuşmalar</h2>
          <p className="text-sm text-ink-muted mt-1">Tüm bot sohbetleri — okuyabilir, dışa aktarabilirsin.</p>
        </div>
        <Button variant="secondary" onClick={downloadCsv}><Download className="w-4 h-4" />CSV indir</Button>
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6 h-[calc(100vh-12rem)]">
        <Card className="flex flex-col">
          <div className="p-4 border-b border-border">
            <Input placeholder="İçerikte ara..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">Konuşma yok</div>
            ) : filtered.map(c => (
              <button key={c.sessionId} onClick={() => open(c.sessionId)}
                className={`w-full text-left p-4 border-b border-border hover:bg-bg transition-colors ${active === c.sessionId ? 'bg-bg' : ''}`}>
                <div className="flex justify-between text-xs text-ink-muted mb-1">
                  <span className="font-mono">{c.sessionId.slice(0, 12)}...</span>
                  <span>{c.msgCount} msg</span>
                </div>
                <div className="text-sm text-ink truncate">{c.lastMessage}</div>
                <div className="text-xs text-ink-faint mt-1">{new Date(parseInt(c.lastTs)).toLocaleString('tr-TR')}</div>
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">Sol panelden bir konuşma seç</div>
          ) : !conv ? (
            <div className="flex-1 flex items-center justify-center text-sm text-ink-muted">Yükleniyor...</div>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
              <div className="text-xs text-ink-muted font-mono pb-3 border-b border-border">{active}</div>
              {(conv.messages || []).map((m: any, i: number) => (
                <div key={i} className={`max-w-[75%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand text-white' : 'bg-bg border border-border text-ink'}`}>
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
