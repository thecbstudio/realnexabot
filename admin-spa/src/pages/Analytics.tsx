import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'

export function Analytics() {
  const bizId = useActiveBusinessId()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<{ conversations: any[]; leads: any[] } | null>(null)

  useEffect(() => {
    if (!bizId) return
    api.analyticsDaily(bizId, days).then(setData)
  }, [bizId, days])

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>
  if (!data) return <div className="text-sm text-ink-muted">Yükleniyor...</div>

  // Build daily series
  const today = new Date()
  const series: { day: string; date: string; msg: number; ses: number; lead: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const c = data.conversations.find(x => x.day === key)
    const l = data.leads.find(x => x.day === key)
    series.push({
      day: key,
      date: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
      msg: c ? parseInt(c.messages) : 0,
      ses: c ? parseInt(c.sessions) : 0,
      lead: l ? parseInt(l.count) : 0,
    })
  }

  const totalMsg = series.reduce((s, x) => s + x.msg, 0)
  const totalSes = series.reduce((s, x) => s + x.ses, 0)
  const totalLead = series.reduce((s, x) => s + x.lead, 0)
  const avg = totalSes ? (totalMsg / totalSes).toFixed(1) : '0'

  const maxMsg = Math.max(1, ...series.map(s => s.msg))
  const maxLead = Math.max(1, ...series.map(s => s.lead))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Analiz</h2>
          <p className="text-sm text-ink-muted mt-1">Bot kullanım istatistikleri.</p>
        </div>
        <div className="flex gap-1 bg-bg p-1 rounded-md border border-border">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded ${days === d ? 'bg-surface text-ink font-medium shadow-card' : 'text-ink-muted'}`}>
              {d} gün
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Toplam mesaj" value={totalMsg} />
        <Stat label="Oturum" value={totalSes} />
        <Stat label="Lead" value={totalLead} />
        <Stat label="Ort. mesaj/oturum" value={avg} />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-ink mb-4">Günlük mesaj</h3>
          <SimpleBars series={series.map(s => ({ label: s.date, value: s.msg }))} max={maxMsg} color="#2563EB" />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-ink mb-4">Günlük lead</h3>
          <SimpleBars series={series.map(s => ({ label: s.date, value: s.lead }))} max={maxLead} color="#10B981" />
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
        <div className="text-3xl font-semibold tabular-nums mt-2 text-ink">{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</div>
      </CardContent>
    </Card>
  )
}

function SimpleBars({ series, max, color }: { series: { label: string; value: number }[]; max: number; color: string }) {
  return (
    <div className="flex items-end gap-1 h-48">
      {series.map((s, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
          <div className="text-xs text-ink-muted tabular-nums opacity-0 group-hover:opacity-100">{s.value}</div>
          <div className="w-full rounded-t transition-all hover:opacity-80" style={{ height: `${(s.value / max) * 100}%`, background: color, minHeight: s.value > 0 ? '2px' : '0' }} />
          {i % Math.ceil(series.length / 10) === 0 && (
            <div className="text-[10px] text-ink-faint whitespace-nowrap">{s.label}</div>
          )}
        </div>
      ))}
    </div>
  )
}
