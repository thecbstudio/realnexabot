import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { Link } from 'react-router-dom'
import { ArrowUpRight, MessageSquare, Users, Target, Database, TrendingUp, TrendingDown } from 'lucide-react'

export function Dashboard() {
  const bizId = useActiveBusinessId()
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (!bizId) return
    Promise.all([
      api.analyticsDaily(bizId, 30),
      api.analyticsDaily(bizId, 60),
      api.kbStats(bizId),
      api.listLeads(),
      api.listConversations(),
      api.getBusinessFull(bizId),
    ]).then(([d30, d60, kb, leads, convs, biz]) => {
      const msg30 = d30.conversations.reduce((s, x) => s + parseInt(x.messages || 0), 0)
      const ses30 = d30.conversations.reduce((s, x) => s + parseInt(x.sessions || 0), 0)
      const lead30 = d30.leads.reduce((s, x) => s + parseInt(x.count || 0), 0)
      // Previous 30 days for trend
      const msg60 = d60.conversations.reduce((s, x) => s + parseInt(x.messages || 0), 0)
      const msgPrev = msg60 - msg30
      const trend = msgPrev > 0 ? Math.round(((msg30 - msgPrev) / msgPrev) * 100) : 0

      const bizLeads = leads.filter((l: any) => l.business_id === bizId)
      const bizConvs = convs.filter((c: any) => c.businessId === bizId).slice(0, 5)
      const recentLeads = bizLeads.slice(0, 5)

      // Daily series for sparkline
      const today = new Date()
      const series: number[] = []
      for (let i = 29; i >= 0; i--) {
        const dt = new Date(today); dt.setDate(dt.getDate() - i)
        const key = dt.toISOString().slice(0, 10)
        const c = d30.conversations.find(x => x.day === key)
        series.push(c ? parseInt(c.messages) : 0)
      }

      setData({ msg30, ses30, lead30, trend, kb, bizLeads, bizConvs, recentLeads, biz, series })
    })
  }, [bizId])

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>
  if (!data) return <div className="text-sm text-ink-muted">Yükleniyor...</div>

  const newLeads = data.bizLeads.filter((l: any) => (l.status || 'new') === 'new').length

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Hoş geldin</h2>
          <p className="text-sm text-ink-muted mt-1">{data.biz.name} — son 30 günün özeti.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/settings"><div className="text-sm text-brand hover:underline flex items-center gap-1">İşletme ayarları <ArrowUpRight className="w-3 h-3" /></div></Link>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={MessageSquare} label="Mesaj" value={data.msg30} trend={data.trend} color="bg-blue-50 text-blue-600" />
        <Stat icon={Users} label="Oturum" value={data.ses30} color="bg-violet-50 text-violet-600" />
        <Stat icon={Target} label="Yeni lead" value={newLeads} sub={`Toplam ${data.bizLeads.length}`} color="bg-amber-50 text-amber-600" />
        <Stat icon={Database} label="Bilgi parçası" value={data.kb.chunks} sub={`${(data.kb.chars / 1000).toFixed(1)}K karakter`} color="bg-emerald-50 text-emerald-600" />
      </div>

      {/* Sparkline */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-baseline justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-ink">Son 30 gün mesaj akışı</h3>
              <p className="text-xs text-ink-muted mt-0.5">Günlük toplam mesaj sayısı</p>
            </div>
            <div className="text-2xl font-semibold tabular-nums text-ink">{data.msg30.toLocaleString('tr-TR')}</div>
          </div>
          <Sparkline data={data.series} />
        </CardContent>
      </Card>

      {/* Two-column: recent leads + recent conversations */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Son leadler</h3>
              <Link to="/leads" className="text-xs text-brand hover:underline">Tümünü gör →</Link>
            </div>
            {data.recentLeads.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">Henüz lead yok.</div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentLeads.map((l: any) => (
                  <div key={l.id} className="px-5 py-3 hover:bg-bg transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm text-ink line-clamp-2 flex-1">{l.message}</div>
                      <Badge variant={l.status === 'kazandi' ? 'success' : l.status === 'kaybetti' ? 'danger' : 'info'}>
                        {l.status === 'kazandi' ? 'Kazandı' : l.status === 'aradi' ? 'Aradım' : l.status === 'kaybetti' ? 'Kaybetti' : 'Yeni'}
                      </Badge>
                    </div>
                    <div className="text-xs text-ink-faint mt-1">{new Date(parseInt(l.timestamp)).toLocaleString('tr-TR')}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-ink">Son konuşmalar</h3>
              <Link to="/conversations" className="text-xs text-brand hover:underline">Tümünü gör →</Link>
            </div>
            {data.bizConvs.length === 0 ? (
              <div className="p-8 text-center text-sm text-ink-muted">Henüz konuşma yok.</div>
            ) : (
              <div className="divide-y divide-border">
                {data.bizConvs.map((c: any) => (
                  <Link key={c.sessionId} to={`/conversations`} className="block px-5 py-3 hover:bg-bg transition-colors">
                    <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
                      <span className="font-mono">{c.sessionId.slice(0, 12)}...</span>
                      <span>{c.msgCount} mesaj</span>
                    </div>
                    <div className="text-sm text-ink truncate">{c.lastMessage}</div>
                    <div className="text-xs text-ink-faint mt-1">{new Date(parseInt(c.lastTs)).toLocaleString('tr-TR')}</div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KB warning if low */}
      {data.kb.chunks < 5 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-100 flex items-center justify-center shrink-0"><Database className="w-4 h-4 text-amber-700" /></div>
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-900">Bot bilgi tabanı eksik</div>
              <div className="text-sm text-amber-700 mt-0.5">Bot daha akıllı cevaplar versin için PDF veya website yükle.</div>
            </div>
            <Link to="/knowledge"><Badge variant="warning" className="cursor-pointer">Bilgi ekle →</Badge></Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function Stat({ icon: Icon, label, value, sub, trend, color }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-9 h-9 rounded-md ${color} flex items-center justify-center`}><Icon className="w-4 h-4" /></div>
          {trend !== undefined && trend !== 0 && (
            <div className={`flex items-center gap-0.5 text-xs font-medium ${trend > 0 ? 'text-success' : 'text-danger'}`}>
              {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="text-2xl font-semibold tabular-nums mt-1 text-ink">{value.toLocaleString('tr-TR')}</div>
        {sub && <div className="text-xs text-ink-faint mt-1">{sub}</div>}
      </CardContent>
    </Card>
  )
}

function Sparkline({ data }: { data: number[] }) {
  const max = Math.max(1, ...data)
  const W = 100, H = 40
  const step = W / Math.max(1, data.length - 1)
  const points = data.map((v, i) => `${i * step},${H - (v / max) * H}`).join(' ')
  const areaPoints = `0,${H} ${points} ${W},${H}`
  return (
    <div className="w-full h-32">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full overflow-visible">
        <defs>
          <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPoints} fill="url(#grad)" />
        <polyline points={points} fill="none" stroke="#2563EB" strokeWidth="0.6" vectorEffect="non-scaling-stroke" />
      </svg>
    </div>
  )
}
