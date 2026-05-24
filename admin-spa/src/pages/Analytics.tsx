import { useEffect, useMemo, useState, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'

export function Analytics() {
  const bizId = useActiveBusinessId()
  const [days, setDays] = useState(30)
  const [data, setData] = useState<{ conversations: any[]; leads: any[] } | null>(null)

  useEffect(() => { if (bizId) api.analyticsDaily(bizId, days).then(setData) }, [bizId, days])

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
        full: d.toLocaleDateString('tr-TR', { weekday: 'short', day: 'numeric', month: 'long' }),
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
              className={`px-3 py-1.5 text-sm rounded transition-colors ${days === d ? 'bg-surface text-ink font-medium shadow-card' : 'text-ink-muted hover:text-ink'}`}>{d} gün</button>
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
          <h3 className="text-sm font-semibold text-ink mb-1">Mesaj & Oturum</h3>
          <p className="text-xs text-ink-muted mb-4">Üzerine gel — detayları gör</p>
          <LineChart series={series} keys={[{ k: 'msg', label: 'Mesaj', color: '#2563EB' }, { k: 'ses', label: 'Oturum', color: '#7C3AED' }]} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-ink mb-1">Günlük lead</h3>
          <p className="text-xs text-ink-muted mb-4">Üzerine gel — günlük sayı</p>
          <BarChart series={series} />
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <Card><CardContent className="p-5">
      <div className="text-xs uppercase tracking-wide text-ink-muted">{label}</div>
      <div className={`text-3xl font-semibold tabular-nums mt-2 ${color}`}>{typeof value === 'number' ? value.toLocaleString('tr-TR') : value}</div>
    </CardContent></Card>
  )
}

function LineChart({ series, keys }: { series: any[]; keys: { k: string; label: string; color: string }[] }) {
  const W = 800, H = 260, PAD_L = 44, PAD_B = 32, PAD_T = 10, PAD_R = 14
  const innerW = W - PAD_L - PAD_R, innerH = H - PAD_T - PAD_B
  const max = Math.max(1, ...keys.flatMap(k => series.map(s => s[k.k])))
  const step = innerW / Math.max(1, series.length - 1)
  const svgRef = useRef<SVGSVGElement>(null)
  const [hover, setHover] = useState<{ idx: number; x: number; y: number } | null>(null)

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return
    const rect = svgRef.current.getBoundingClientRect()
    const scale = W / rect.width
    const x = (e.clientX - rect.left) * scale - PAD_L
    const idx = Math.round(x / step)
    if (idx < 0 || idx >= series.length) { setHover(null); return }
    setHover({ idx, x: e.clientX - rect.left, y: e.clientY - rect.top })
  }
  const onLeave = () => setHover(null)

  return (
    <div className="space-y-3">
      <div className="flex gap-5">
        {keys.map(k => (
          <div key={k.k} className="flex items-center gap-2 text-xs text-ink-muted">
            <div className="w-3 h-3 rounded-full" style={{ background: k.color }} />
            {k.label}
          </div>
        ))}
      </div>
      <div className="relative w-full overflow-x-auto">
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="w-full block" style={{ minWidth: 500 }} onMouseMove={onMove} onMouseLeave={onLeave}>
          {Array.from({ length: 5 }).map((_, i) => {
            const y = PAD_T + (innerH / 4) * i
            const v = Math.round(max - (max / 4) * i)
            return <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="#E5E7EB" strokeDasharray="2,3" />
              <text x={PAD_L - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#9CA3AF">{v}</text>
            </g>
          })}
          {keys.map(k => {
            const pts = series.map((s, i) => `${PAD_L + i * step},${PAD_T + innerH - (s[k.k] / max) * innerH}`).join(' ')
            return (
              <g key={k.k}>
                <polyline points={pts} fill="none" stroke={k.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
                {series.map((s, i) => (
                  <circle key={i} cx={PAD_L + i * step} cy={PAD_T + innerH - (s[k.k] / max) * innerH} r={hover?.idx === i ? 4 : 2.5} fill={k.color} />
                ))}
              </g>
            )
          })}
          {series.map((s, i) => {
            if (i % Math.ceil(series.length / 8) !== 0) return null
            return <text key={i} x={PAD_L + i * step} y={H - 10} textAnchor="middle" fontSize="10" fill="#9CA3AF">{s.label}</text>
          })}
          {hover && <line x1={PAD_L + hover.idx * step} x2={PAD_L + hover.idx * step} y1={PAD_T} y2={PAD_T + innerH} stroke="#9CA3AF" strokeDasharray="3,3" strokeWidth="1" />}
        </svg>
        {hover && (
          <div className="absolute pointer-events-none bg-ink text-white text-xs rounded-md px-3 py-2 shadow-pop z-10"
            style={{ left: Math.min(hover.x + 12, 600), top: hover.y - 50 }}>
            <div className="font-medium mb-1">{series[hover.idx].full}</div>
            {keys.map(k => (
              <div key={k.k} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ background: k.color }} />
                <span className="text-ink-faint">{k.label}:</span>
                <span className="font-medium tabular-nums">{series[hover.idx][k.k]}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BarChart({ series }: { series: any[] }) {
  const max = Math.max(1, ...series.map(s => s.lead))
  const [hover, setHover] = useState<number | null>(null)
  return (
    <div className="relative">
      <div className="flex items-end gap-1 h-52" onMouseLeave={() => setHover(null)}>
        {series.map((s, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0"
            onMouseEnter={() => setHover(i)}>
            <div className="w-full rounded-t transition-all cursor-pointer"
              style={{ height: `${(s.lead / max) * 100}%`, background: hover === i ? '#D97706' : '#F59E0B', minHeight: s.lead > 0 ? '3px' : '0' }} />
            {i % Math.ceil(series.length / 10) === 0 && <div className="text-[10px] text-ink-faint whitespace-nowrap">{s.label}</div>}
          </div>
        ))}
      </div>
      {hover !== null && (
        <div className="absolute -top-1 bg-ink text-white text-xs rounded-md px-3 py-2 shadow-pop z-10 pointer-events-none"
          style={{ left: `${(hover / series.length) * 100}%`, transform: 'translateX(-50%)' }}>
          <div className="font-medium">{series[hover].full}</div>
          <div className="text-amber-300 mt-0.5">Lead: <span className="font-semibold tabular-nums">{series[hover].lead}</span></div>
        </div>
      )}
    </div>
  )
}
