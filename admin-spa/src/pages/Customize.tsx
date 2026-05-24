import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { Upload, Trash2, ExternalLink, Copy, Check } from 'lucide-react'

export function Customize() {
  const bizId = useActiveBusinessId()
  const [biz, setBiz] = useState<any>(null)
  const [status, setStatus] = useState({ text: 'Otomatik kaydeder', color: 'text-ink-muted' })
  const [copied, setCopied] = useState(false)
  const saveTimer = useRef<any>(null)

  useEffect(() => {
    if (!bizId) return
    api.getBusiness(bizId).then(setBiz)
  }, [bizId])

  const update = (patch: any) => {
    setBiz((b: any) => ({ ...b, ...patch }))
    clearTimeout(saveTimer.current)
    setStatus({ text: 'Kaydediliyor...', color: 'text-brand' })
    saveTimer.current = setTimeout(async () => {
      try {
        await api.saveBusiness({ businessId: bizId, ...patch })
        setStatus({ text: 'Kaydedildi', color: 'text-success' })
        setTimeout(() => setStatus({ text: 'Otomatik kaydeder', color: 'text-ink-muted' }), 1500)
      } catch (e: any) {
        setStatus({ text: 'Hata: ' + e.message, color: 'text-danger' })
      }
    }, 600)
  }

  // Avatar cropper state
  const [cropOpen, setCropOpen] = useState(false)
  const cropCanvas = useRef<HTMLCanvasElement>(null)
  const cropArea = useRef<HTMLDivElement>(null)
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(100)
  const offset = useRef({ x: 0, y: 0 })
  const dragStart = useRef<{ x: number; y: number } | null>(null)

  const draw = () => {
    if (!cropImg || !cropCanvas.current) return
    const ctx = cropCanvas.current.getContext('2d')!
    const s = zoom / 100
    ctx.clearRect(0, 0, 300, 300)
    ctx.fillStyle = '#fff'
    ctx.fillRect(0, 0, 300, 300)
    ctx.drawImage(cropImg, offset.current.x, offset.current.y, cropImg.width * s, cropImg.height * s)
  }
  useEffect(() => { if (cropOpen) draw() }, [zoom, cropOpen])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!bizId) { alert('Önce işletme seç'); return }
    if (f.size > 5 * 1024 * 1024) { alert('Max 5MB'); return }
    const img = new Image()
    img.onload = () => {
      setCropImg(img)
      const s = Math.max(300 / img.width, 300 / img.height)
      offset.current = { x: (300 - img.width * s) / 2, y: (300 - img.height * s) / 2 }
      setZoom(Math.round(s * 100))
      setCropOpen(true)
      setTimeout(draw, 50)
    }
    img.src = URL.createObjectURL(f)
    e.target.value = ''
  }

  const onDown = (e: React.PointerEvent) => { dragStart.current = { x: e.clientX - offset.current.x, y: e.clientY - offset.current.y }; (e.target as Element).setPointerCapture(e.pointerId) }
  const onMove = (e: React.PointerEvent) => { if (!dragStart.current) return; offset.current = { x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y }; draw() }
  const onUp = () => { dragStart.current = null }

  const confirmCrop = async () => {
    if (!cropCanvas.current || !bizId) return
    const out = document.createElement('canvas')
    out.width = 256; out.height = 256
    out.getContext('2d')!.drawImage(cropCanvas.current, 0, 0, 300, 300, 0, 0, 256, 256)
    const blob = await new Promise<Blob>((r) => out.toBlob(b => r(b!), 'image/jpeg', 0.88))
    setCropOpen(false)
    setStatus({ text: 'Yükleniyor...', color: 'text-brand' })
    try {
      await api.uploadAvatar(bizId, new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
      const fresh = await api.getBusiness(bizId)
      setBiz(fresh)
      setStatus({ text: 'Avatar yüklendi', color: 'text-success' })
      setTimeout(() => setStatus({ text: 'Otomatik kaydeder', color: 'text-ink-muted' }), 2000)
    } catch (e: any) {
      setStatus({ text: 'Hata: ' + e.message, color: 'text-danger' })
    }
  }

  const removeAvatar = async () => {
    if (!biz || !confirm('Avatar silinsin mi?')) return
    await api.saveBusiness({ businessId: bizId, avatar_url: '' })
    const fresh = await api.getBusiness(bizId)
    setBiz(fresh)
  }

  const embedUrl = bizId ? `${window.location.origin}/embed/${bizId}` : ''
  const embedSnippet = `<script src="${embedUrl}"></script>`
  const copyEmbed = () => { navigator.clipboard.writeText(embedSnippet); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  if (!biz) return <div className="text-sm text-ink-muted">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Widget Özelleştirme</h2>
          <p className="text-sm text-ink-muted mt-1">Değişiklikler otomatik kaydedilir.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${status.color}`}>{status.text}</span>
          <a href={`/widget/${bizId}`} target="_blank" rel="noreferrer">
            <Button variant="secondary" size="sm"><ExternalLink className="w-4 h-4" />Yeni sekmede aç</Button>
          </a>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_420px] gap-6">
        {/* LEFT - settings */}
        <div className="space-y-5">
          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-ink">Bot Ayarları</h3>

              <Field label="Bot adı">
                <Input value={biz.bot_name || ''} onChange={e => update({ bot_name: e.target.value })} placeholder="Örn: Çınar Asistan" />
              </Field>

              <Field label="Emoji">
                <Input value={biz.emoji || ''} onChange={e => update({ emoji: e.target.value })} maxLength={4} placeholder="🏢" />
              </Field>

              <Field label="Logo (boş ise emoji kullanılır)">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full border border-border bg-white flex items-center justify-center overflow-hidden text-xl">
                    {biz.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz.emoji || '🤖')}
                  </div>
                  <label className="flex-1">
                    <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                    <Button variant="secondary" size="md" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" />Resim seç</span></Button>
                  </label>
                  {biz.avatar_url && (
                    <Button variant="danger" size="sm" onClick={removeAvatar}><Trash2 className="w-4 h-4" />Sil</Button>
                  )}
                </div>
              </Field>

              <Field label="Karşılama mesajı (TR)">
                <Textarea value={biz.greeting || ''} onChange={e => update({ greeting: e.target.value })} rows={2} placeholder="Merhaba, size nasıl yardımcı olabilirim?" />
              </Field>

              <Field label="Karşılama mesajı (EN)">
                <Textarea value={biz.greeting_en || ''} onChange={e => update({ greeting_en: e.target.value })} rows={2} placeholder="Hello! How can I help you?" />
              </Field>

              <Field label="Hızlı cevaplar (virgülle ayır)">
                <Input value={(biz.quick_replies || []).join(', ')} onChange={e => update({ quick_replies: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="Fiyatlar, Randevu, Saatler" />
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-4">
              <h3 className="text-sm font-semibold text-ink">Görünüm</h3>
              <ColorRow label="Ana renk" value={biz.widget_color || '#2563EB'} onChange={(v) => update({ widget_color: v })} />
              <ColorRow label="Arka plan" value={biz.widget_bg || '#FFFFFF'} onChange={(v) => update({ widget_bg: v })} />
              <Field label="Konum">
                <select value={biz.widget_position || 'bottom-right'} onChange={e => update({ widget_position: e.target.value })}
                  className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand/20">
                  <option value="bottom-right">Sağ alt</option>
                  <option value="bottom-left">Sol alt</option>
                </select>
              </Field>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5 space-y-3">
              <h3 className="text-sm font-semibold text-ink">Sitenize ekleyin</h3>
              <p className="text-xs text-ink-muted">Aşağıdaki tek satırı sitenizin <code className="bg-bg px-1 rounded">&lt;/body&gt;</code> taginden önce yapıştırın.</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-xs font-mono overflow-x-auto whitespace-nowrap">{embedSnippet}</code>
                <Button onClick={copyEmbed} variant="secondary" size="md">
                  {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT - live preview */}
        <div className="lg:sticky lg:top-20 h-fit">
          <Card>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-ink-muted mb-3 px-2">Canlı önizleme</div>
              <div className="rounded-lg border border-border overflow-hidden h-[540px] flex flex-col" style={{ background: biz.widget_bg || '#FFFFFF' }}>
                <div className="px-4 py-3 flex items-center gap-3" style={{ background: biz.widget_color || '#2563EB', color: '#fff' }}>
                  <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden">
                    {biz.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz.emoji || '🤖')}
                  </div>
                  <div className="text-sm font-semibold">{biz.bot_name || biz.name || 'Bot'}</div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-2 text-sm">
                  <div className="px-3 py-2 rounded-2xl bg-gray-100 max-w-[80%] text-ink">{biz.greeting || 'Merhaba!'}</div>
                  <div className="px-3 py-2 rounded-2xl ml-auto max-w-[80%] text-white" style={{ background: biz.widget_color || '#2563EB' }}>Fiyatlar nedir?</div>
                </div>
                <div className="px-3 pb-2 flex gap-2 flex-wrap">
                  {(biz.quick_replies || []).slice(0, 3).map((q: string, i: number) => (
                    <button key={i} className="text-xs border border-border bg-white rounded-full px-3 py-1 text-ink-muted">{q}</button>
                  ))}
                </div>
                <div className="p-3 border-t border-border bg-white flex gap-2">
                  <input disabled placeholder="Mesaj yaz..." className="flex-1 h-9 px-3 rounded-md border border-border text-sm" />
                  <button className="h-9 px-4 text-sm rounded-md text-white" style={{ background: biz.widget_color || '#2563EB' }}>Gönder</button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cropper modal */}
      {cropOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-ink mb-1">Resmi yerleştir</h3>
            <p className="text-sm text-ink-muted mb-4">Sürükle ve yakınlaştır.</p>
            <div ref={cropArea} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
              className="w-[300px] h-[300px] mx-auto rounded-full border-2 border-dashed border-brand overflow-hidden cursor-grab bg-gray-100">
              <canvas ref={cropCanvas} width={300} height={300} />
            </div>
            <div className="mt-4">
              <label className="text-xs text-ink-muted">Yakınlaştır: {zoom}%</label>
              <input type="range" min={20} max={300} value={zoom} onChange={e => setZoom(parseInt(e.target.value))} className="w-full mt-1" />
            </div>
            <div className="flex gap-2 justify-end mt-5">
              <Button variant="secondary" onClick={() => setCropOpen(false)}>İptal</Button>
              <Button onClick={confirmCrop}>Yükle</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-9 w-12 rounded-md border border-border cursor-pointer" />
        <Input value={value} onChange={e => onChange(e.target.value)} />
      </div>
    </Field>
  )
}
