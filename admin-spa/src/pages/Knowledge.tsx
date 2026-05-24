import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { FileText, Globe, Type, Bug, Trash2, Upload } from 'lucide-react'
import { getToken } from '@/lib/auth'

export function Knowledge() {
  const bizId = useActiveBusinessId()
  const [sources, setSources] = useState<any[]>([])
  const [status, setStatus] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  const load = () => { if (bizId) api.kbSources(bizId).then(setSources) }
  useEffect(load, [bizId])

  const uploadPdf = async () => {
    const f = fileRef.current?.files?.[0]
    if (!f || !bizId) return
    setBusy(true); setStatus('PDF yükleniyor...')
    const fd = new FormData(); fd.append('file', f)
    try {
      const r = await fetch(`/api/kb/upload-pdf/${bizId}`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd })
      const d = await r.json()
      if (d.ok) { setStatus(`✓ ${d.chunkCount} parça eklendi`); load(); fileRef.current!.value = '' }
      else setStatus('Hata: ' + d.error)
    } finally { setBusy(false); setTimeout(() => setStatus(''), 3000) }
  }

  const [urlVal, setUrlVal] = useState('')
  const uploadUrl = async () => {
    if (!urlVal || !bizId) return
    setBusy(true); setStatus('Sayfa çekiliyor...')
    try {
      const d: any = await api.kbUploadUrl(bizId, urlVal)
      setStatus(`✓ ${d.chunkCount} parça eklendi`); setUrlVal(''); load()
    } catch (e: any) { setStatus('Hata: ' + e.message) }
    finally { setBusy(false); setTimeout(() => setStatus(''), 3000) }
  }

  const [crawlUrl, setCrawlUrl] = useState('')
  const [maxPages, setMaxPages] = useState(25)
  const crawl = async () => {
    if (!crawlUrl || !bizId) return
    setBusy(true); setStatus('Site taranıyor (1-3 dakika)...')
    try {
      const d: any = await api.kbCrawl(bizId, crawlUrl, maxPages)
      setStatus(`✓ ${d.pages} sayfa, ${d.totalChunks} parça eklendi`); setCrawlUrl(''); load()
    } catch (e: any) { setStatus('Hata: ' + e.message) }
    finally { setBusy(false); setTimeout(() => setStatus(''), 4000) }
  }

  const [textName, setTextName] = useState('')
  const [textBody, setTextBody] = useState('')
  const uploadText = async () => {
    if (!textBody || !bizId) return
    setBusy(true); setStatus('Ekleniyor...')
    try {
      const d: any = await api.kbUploadText(bizId, textName || 'Manuel', textBody)
      setStatus(`✓ ${d.chunkCount} parça eklendi`); setTextName(''); setTextBody(''); load()
    } catch (e: any) { setStatus('Hata: ' + e.message) }
    finally { setBusy(false); setTimeout(() => setStatus(''), 3000) }
  }

  const del = async (id: number) => {
    if (!confirm('Bu kaynak silinsin mi?') || !bizId) return
    await api.kbDeleteSource(id, bizId); load()
  }

  if (!bizId) return <div className="text-sm text-ink-muted">İşletme seç</div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-ink">Bilgi Tabanı</h2>
        <p className="text-sm text-ink-muted mt-1">Bot'un öğrenmesi için PDF, web sitesi veya metin yükle.</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <Tabs defaultValue="crawl">
            <TabsList>
              <TabsTrigger value="crawl">Site tara</TabsTrigger>
              <TabsTrigger value="pdf">PDF yükle</TabsTrigger>
              <TabsTrigger value="url">Tek sayfa</TabsTrigger>
              <TabsTrigger value="text">Metin</TabsTrigger>
            </TabsList>

            <TabsContent value="crawl" className="pt-5 space-y-3">
              <p className="text-sm text-ink-muted">Tek URL ver — bot tüm aynı domain sayfalarını otomatik öğrensin.</p>
              <Input placeholder="https://siteniz.com" value={crawlUrl} onChange={e => setCrawlUrl(e.target.value)} />
              <div className="flex items-center gap-3">
                <label className="text-sm text-ink-muted">Maks. sayfa: {maxPages}</label>
                <input type="range" min={5} max={100} step={5} value={maxPages} onChange={e => setMaxPages(parseInt(e.target.value))} className="flex-1 max-w-xs" />
              </div>
              <Button onClick={crawl} disabled={busy || !crawlUrl}><Bug className="w-4 h-4" />Siteyi tara</Button>
            </TabsContent>

            <TabsContent value="pdf" className="pt-5 space-y-3">
              <input ref={fileRef} type="file" accept="application/pdf" className="block text-sm" />
              <Button onClick={uploadPdf} disabled={busy}><Upload className="w-4 h-4" />PDF yükle</Button>
            </TabsContent>

            <TabsContent value="url" className="pt-5 space-y-3">
              <Input placeholder="https://siteniz.com/hakkimizda" value={urlVal} onChange={e => setUrlVal(e.target.value)} />
              <Button onClick={uploadUrl} disabled={busy || !urlVal}>Sayfayı çek</Button>
            </TabsContent>

            <TabsContent value="text" className="pt-5 space-y-3">
              <Input placeholder="Kaynak adı (örn: SSS)" value={textName} onChange={e => setTextName(e.target.value)} />
              <Textarea rows={6} placeholder="Bot'un öğrenmesini istediğin metni buraya yapıştır" value={textBody} onChange={e => setTextBody(e.target.value)} />
              <Button onClick={uploadText} disabled={busy || !textBody}>Ekle</Button>
            </TabsContent>
          </Tabs>
          {status && <div className="mt-4 text-sm text-brand">{status}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink">Yüklü Kaynaklar ({sources.length})</h3>
          </div>
          {sources.length === 0 ? (
            <div className="text-center py-10 text-sm text-ink-muted">Henüz kaynak yok. Yukarıdan ekle.</div>
          ) : (
            <div className="space-y-2">
              {sources.map(s => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-border rounded-md bg-bg hover:bg-white transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-md bg-white border border-border flex items-center justify-center text-ink-muted">
                      {s.source_type === 'pdf' ? <FileText className="w-4 h-4" /> : s.source_type === 'url' ? <Globe className="w-4 h-4" /> : <Type className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm text-ink truncate">{s.source_name}</div>
                      <div className="text-xs text-ink-muted">
                        <Badge variant="muted">{s.source_type}</Badge> · {s.chunk_count} parça · {s.char_count.toLocaleString('tr-TR')} karakter
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => del(s.id)} className="text-danger"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
