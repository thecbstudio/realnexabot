import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { RotateCcw, Send, Bot, FileText, Globe } from 'lucide-react'

type Msg = { role: 'user' | 'bot'; text: string; citations?: string[]; ts: number }

export function Test() {
  const bizId = useActiveBusinessId()
  const [biz, setBiz] = useState<any>(null)
  const [kbStats, setKbStats] = useState({ chunks: 0, chars: 0 })
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!bizId) return
    api.getBusiness(bizId).then(setBiz)
    api.kbStats(bizId).then(setKbStats)
    reset()
  }, [bizId])

  useEffect(() => { scroll.current?.scrollTo({ top: scroll.current.scrollHeight, behavior: 'smooth' }) }, [msgs, loading])

  const reset = () => { setMsgs([]); setSessionId(null); setTimeout(() => inputRef.current?.focus(), 50) }

  const send = async () => {
    if (!input.trim() || !bizId || loading) return
    const text = input.trim()
    setInput('')
    setMsgs(m => [...m, { role: 'user', text, ts: Date.now() }])
    setLoading(true)
    try {
      const sid = sessionId || `test_${bizId}_${Date.now()}`
      const r = await api.chat(bizId, text, sid)
      setSessionId(r.sessionId)
      setMsgs(m => [...m, { role: 'bot', text: r.reply, citations: r.citations, ts: Date.now() }])
    } catch (e: any) {
      setMsgs(m => [...m, { role: 'bot', text: 'Hata: ' + e.message, ts: Date.now() }])
    } finally { setLoading(false); inputRef.current?.focus() }
  }

  const suggestions = biz?.quick_replies?.length ? biz.quick_replies.slice(0, 4) : ['Merhaba', 'Fiyatlar nedir?', 'Çalışma saatleri', 'Randevu almak istiyorum']

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>

  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6 h-[calc(100vh-7rem)]">
      <div className="space-y-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
              <div className="w-12 h-12 rounded-full border border-border bg-bg flex items-center justify-center overflow-hidden text-xl shrink-0">
                {biz?.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz?.emoji || '🤖')}
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold text-ink truncate">{biz?.bot_name || biz?.name || '—'}</div>
                <div className="text-xs text-ink-muted flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success" />Çevrimiçi</div>
              </div>
            </div>
            <dl className="space-y-2.5 text-sm">
              <Row k="Sektör" v={biz?.sector || '—'} />
              <Row k="Bilgi parçası" v={<Badge variant={kbStats.chunks > 0 ? 'success' : 'warning'}>{kbStats.chunks}</Badge>} />
              <Row k="Karakter" v={kbStats.chars.toLocaleString('tr-TR')} />
            </dl>
            <Button variant="secondary" className="w-full mt-4" onClick={reset}><RotateCcw className="w-4 h-4" />Sıfırla</Button>
            <p className="text-[11px] text-ink-faint mt-3 leading-relaxed">Bu test sohbeti normal istatistiklere yansımaz.</p>
          </CardContent>
        </Card>

        {kbStats.chunks === 0 && (
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4 text-sm text-amber-800">
              <div className="font-medium mb-1">Bilgi tabanı boş</div>
              <div className="text-xs text-amber-700">Bot daha akıllı cevaplar versin diye Bilgi Tabanı'na PDF veya site yükle.</div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="flex flex-col overflow-hidden">
        {/* Chat header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center gap-3 bg-surface">
          <Bot className="w-4 h-4 text-ink-muted" />
          <div className="text-sm font-medium text-ink">{biz?.bot_name || biz?.name || 'Bot'} ile test sohbeti</div>
        </div>

        {/* Messages */}
        <div ref={scroll} className="flex-1 overflow-y-auto px-5 py-6 scrollbar-thin bg-bg">
          {msgs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full border-2 border-border bg-white flex items-center justify-center text-3xl mb-4">
                {biz?.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover rounded-full" /> : (biz?.emoji || '🤖')}
              </div>
              <h3 className="text-base font-semibold text-ink mb-1">Bot ile konuşmaya başla</h3>
              <p className="text-sm text-ink-muted mb-6">KB'deki bilgileri doğru kullanıyor mu, cevap kalitesini test et.</p>
              <div className="grid grid-cols-2 gap-2 w-full">
                {suggestions.map((s: string, i: number) => (
                  <button key={i} onClick={() => { setInput(s); setTimeout(send, 50) }}
                    className="text-left p-3 bg-surface border border-border rounded-lg text-sm text-ink hover:border-brand hover:bg-brand-soft transition-colors">{s}</button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              {msgs.map((m, i) => (
                <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center overflow-hidden text-sm ${m.role === 'user' ? 'bg-brand text-white' : 'bg-surface border border-border'}`}>
                    {m.role === 'user' ? 'S' : (biz?.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz?.emoji || '🤖'))}
                  </div>
                  <div className={`max-w-[75%] ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${m.role === 'user' ? 'bg-brand text-white rounded-br-md' : 'bg-surface border border-border text-ink rounded-bl-md shadow-card'}`}>
                      {m.text}
                    </div>
                    {m.citations && m.citations.length > 0 && (
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        {m.citations.map((c, j) => {
                          const isUrl = /^https?:\/\//.test(c)
                          return (
                            <Badge key={j} variant="info" className="font-normal max-w-[200px]">
                              {isUrl ? <Globe className="w-3 h-3 mr-1" /> : <FileText className="w-3 h-3 mr-1" />}
                              <span className="truncate">{isUrl ? new URL(c).hostname : c}</span>
                            </Badge>
                          )
                        })}
                      </div>
                    )}
                    <div className="text-[10px] text-ink-faint mt-1 px-1">{new Date(m.ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center overflow-hidden">
                    {biz?.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz?.emoji || '🤖')}
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-surface border border-border shadow-card flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-5 py-4 border-t border-border bg-surface">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Bot'a soru yaz..." disabled={loading}
              className="flex-1 h-11 px-4 rounded-lg border border-border bg-bg text-sm focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand" />
            <Button onClick={send} disabled={loading || !input.trim()} size="lg"><Send className="w-4 h-4" />Gönder</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

function Row({ k, v }: { k: string; v: any }) {
  return <div className="flex justify-between items-center"><dt className="text-ink-muted">{k}</dt><dd className="text-ink font-medium">{v}</dd></div>
}
