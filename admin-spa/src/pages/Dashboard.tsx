import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'

export function Dashboard() {
  const bizId = useActiveBusinessId()
  const [stats, setStats] = useState({ messages: 0, sessions: 0, leads: 0, sources: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bizId) return
    setLoading(true)
    Promise.all([api.analyticsDaily(bizId, 30), api.kbStats(bizId), api.listLeads()])
      .then(([daily, kb, leads]) => {
        const m = daily.conversations.reduce((s, x) => s + parseInt(x.messages || 0), 0)
        const ses = daily.conversations.reduce((s, x) => s + parseInt(x.sessions || 0), 0)
        const ld = leads.filter((l: any) => l.business_id === bizId).length
        setStats({ messages: m, sessions: ses, leads: ld, sources: kb.chunks })
      })
      .finally(() => setLoading(false))
  }, [bizId])

  const cards = [
    { label: 'Bu ay mesaj', value: stats.messages },
    { label: 'Oturum', value: stats.sessions },
    { label: 'Lead', value: stats.leads },
    { label: 'Bilgi parçası', value: stats.sources },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Genel bakış</h2>
        <p className="text-sm text-ink-muted mt-1">Son 30 günün özeti.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map(c => (
          <Card key={c.label}>
            <CardContent className="p-5">
              <div className="text-xs uppercase tracking-wide text-ink-muted">{c.label}</div>
              <div className="text-3xl font-semibold tabular-nums mt-2 text-ink">{loading ? '—' : c.value.toLocaleString('tr-TR')}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-ink-muted">Yeni yönetim paneli aktif. Sol menüden bölümlere erişebilirsin.</p>
        </CardContent>
      </Card>
    </div>
  )
}
