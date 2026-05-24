import { useEffect, useMemo, useState } from 'react'
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

  const series = useMemo(() => {
    if (!data) return []
    const today = new Date()
    const out = []
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today); d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      const c = data.conversations.find(x => x.day === key)
      const l = data.leads.find(x => x.day === key)
      out.push({
        date: d,
        label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }),
        msg: c ? parseInt(c.messages) : 0,
        ses: c ? parseInt(c.sessions) : 0,
        lead: l ? parseInt(l.count) : 0,
      })
    }
    return out
  }, [data, days])

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>
  if (!data) return <div className="text-sm text-ink-muted">Yükleniyor...</div>

  const totalMsg = series.reduce((s, x) => s + x.msg, 0)
  const totalSes = series.reduce((s, x) => s + x.ses, 0)
  const totalLead = series.reduce((s, x) => s + x.lead, 0)
  const avg = totalSes ? (totalMsg / totalSes).toFixed(1) : '0'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Analiz</h2>
          <p className="text-sm text-ink-muted mt-1">Bot kullanım trendi.</p>
        </div>
        <div className="flex gap-1 bg-bg p-1 rounded-md border border-border">
          {[7, 30, 90].map(d => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-3 py-1.5 text-sm rounded ${days === d ? 'bg-surface text-ink font-medium shadow-card' : 'text-ink-muted hover:text-ink'}`}>
              {d} gün
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat label="Toplam mesaj" value={totalMsg} color="text-brand" />
        <Stat label="Oturum" value={totalSes} color="text-violet-600" />
        <Stat label="Lead" value={totalLead} color="text-amber-600" />
        <Stat label="Ort. mesaj/oturum" value={avg} color="text-emerald-600" />
      </div>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-ink mb-4">Mesaj & Oturum</h3>
          <LineChart series={series} keys={[{ k: 'msg', label: 'Mesaj', color: '#2563EB' }, { k: 'ses', label: 'Oturum', color: '#7C3AED' }]} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-ink mb-4">Günlük lead</h3>
          <BarChart series={series.map(s => ({ label: s.label, value: s.lead }))} color="#F59E0B" />
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
        <div className={`text-3xl font-semibold tabular-nums mt-2 ${color}`}>{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</div>
      </CardContent>
    </Card>
  )
}

function LineChart({ series, keys }: { series: any[]; keys: { k: string; label: string; color: string }[] }) {
  const W = 800, H = 240, PAD_L = 40, PAD_B = 30, PAD_T = 10, PAD_R = 10
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B
  const max = Math.max(1, ...keys.flatMap(k => series.map(s => s[k.k])))
  const yTicks = 4
  const step = innerW / Math.max(1, series.length - 1)

  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        {keys.map(k => (
          <div key={k.k} className="flex items-center gap-2 text-xs text-ink-muted">
            <div className="w-3 h-3 rounded-full" style={{ background: k.color }} />
            {k.label}
          </div>
        ))}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 500 }}>
          {Array.from({ length: yTicks + 1 }).map((_, i) => {
            const y = PAD_T + (innerH / yTicks) * i
            const v = Math.round(max - (max / yTicks) * i)
            return <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#E5E7EB" strokeDasharray="2,3" />
              <text x={PAD_L - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{v}</text>
            </g>
          })}
          {keys.map(k => {
            const pts = series.map((s, i) => `${PAD_L + i * step},${PAD_T + innerH - (s[k.k] / max) * innerH}`).join(' ')
            return (
              <g key={k.k}>
                <polyline points={pts} fill="none" stroke={k.color} strokeWidth="2" strokeLinejoin="round" />
                {series.map((s, i) => (
                  <circle key={i} cx={PAD_L + i * step} cy={PAD_T + innerH - (s[k.k] / max) * innerH} r="3" fill={k.color}>
                    <title>{s.label}: {s[k.k]}</title>
                  </circle>
                ))}
              </g>
            )
          })}
          {series.map((s, i) => {
            if (i % Math.ceil(series.length / 8) !== 0) return null
            return <text key={i} x={PAD_L + i * step} y={H - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF">{s.label}</text>
          })}
        </svg>
      </div>
    </div>
  )
}

function BarChart({ series, color }: { series: { label: string; value: number }[]; color: string }) {
  const max = Math.max(1, ...series.map(s => s.value))
  return (
    <div className="flex items-end gap-1 h-52">
      {series.map((s, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
          <div className="text-[10px] text-ink tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">{s.value}</div>
          <div className="w-full rounded-t transition-all hover:opacity-80 cursor-pointer" style={{ height: `${(s.value / max) * 100}%`, background: color, minHeight: s.value > 0 ? '3px' : '0' }}>
            <title>{s.label}: {s.value}</title>
          </div>
          {i % Math.ceil(series.length / 10) === 0 && <div className="text-[10px] text-ink-faint whitespace-nowrap">{s.label}</div>}
        </div>
      ))}
    </div>
  )
}
