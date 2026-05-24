import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { RotateCcw, Send } from 'lucide-react'

type Msg = { role: 'user' | 'bot'; text: string; citations?: string[] }

export function Test() {
  const bizId = useActiveBusinessId()
  const [biz, setBiz] = useState<any>(null)
  const [kbStats, setKbStats] = useState({ chunks: 0, chars: 0 })
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scroll = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bizId) return
    api.getBusiness(bizId).then(setBiz)
    api.kbStats(bizId).then(setKbStats)
    reset()
  }, [bizId])

  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' }) }, [msgs])

  const reset = () => { setMsgs([]); setSessionId(null) }

  const send = async () => {
    if (!input.trim() || !bizId || loading) return
    const text = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const sid = sessionId || `test_${bizId}_${Date.now()}`
      const r = await api.chat(bizId, text, sid)
      setSessionId(r.sessionId)
      setMsgs(m => [...m, { role: 'bot', text: r.reply, citations: r.citations }])
    } catch (e: any) {
      setMsgs(m => [...m, { role: 'bot', text: 'Hata: ' + e.message }])
    } finally { setLoading(false) }
  }

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-6 h-[calc(100vh-7rem)]">
      <Card>
        <CardContent className="p-5 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-wide text-ink-muted">Aktif İşletme</div>
            <div className="text-base font-semibold text-ink mt-1">{biz?.name}</div>
          </div>
          <div className="text-sm space-y-2">
            <Row k="Bot adı" v={biz?.bot_name || '—'} />
            <Row k="Sektör" v={biz?.sector || '—'} />
            <Row k="KB parça" v={kbStats.chunks.toString()} />
            <Row k="KB karakter" v={kbStats.chars.toLocaleString('tr-TR')} />
          </div>
          <Button variant="secondary" className="w-full" onClick={reset}><RotateCcw className="w-4 h-4" />Sohbeti sıfırla</Button>
          <p className="text-xs text-ink-faint">Bu sohbet test session'ıdır, normal istatistiklere yansımaz.</p>
        </CardContent>
      </Card>

      <Card className="flex flex-col">
        <div ref={scroll} className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin">
          {msgs.length === 0 && (
            <div className="text-center py-12 text-ink-muted text-sm">
              Bot ile sohbete başla. KB doğru çalışıyor mu kontrol et.
            </div>
          )}
          {msgs.map((m, i) => (
            <div key={i} className={`max-w-[75%] ${m.role === 'user' ? 'ml-auto' : ''}`}>
              <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-brand text-white' : 'bg-bg border border-border text-ink'}`}>
                {m.text}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="flex gap-1.5 mt-1.5 flex-wrap">
                  {m.citations.map((c, j) => (
                    <Badge key={j} variant="info">{c.length > 30 ? c.slice(0, 30) + '...' : c}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="text-sm text-ink-muted">Bot yazıyor...</div>
          )}
        </div>
        <div className="p-4 border-t border-border flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Bot'a soru sor..." disabled={loading} />
          <Button onClick={send} disabled={loading || !input.trim()}><Send className="w-4 h-4" />Gönder</Button>
        </div>
      </Card>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return <div className="flex justify-between"><span className="text-ink-muted">{k}</span><span className="text-ink font-medium">{v}</span></div>
}
