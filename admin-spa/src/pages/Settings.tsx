import { useEffect, useRef, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { Building2, Bot, Palette, Clock, Wrench, DollarSign, HelpCircle, CalendarCheck, Megaphone, Mail, Upload, Trash2, Plus, X, ExternalLink, Copy, Check } from 'lucide-react'

const DAYS = ['Pazartesi','Salı','Çarşamba','Perşembe','Cuma','Cumartesi','Pazar']

export function Settings() {
  const bizId = useActiveBusinessId()
  const [biz, setBiz] = useState<any>(null)
  const [status, setStatus] = useState({ text: 'Otomatik kaydeder', color: 'text-ink-muted' })
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
        setStatus({ text: '✓ Kaydedildi', color: 'text-success' })
        setTimeout(() => setStatus({ text: 'Otomatik kaydeder', color: 'text-ink-muted' }), 1500)
      } catch (e: any) {
        setStatus({ text: 'Hata: ' + e.message, color: 'text-danger' })
      }
    }, 600)
  }

  if (!biz) return <div className="text-sm text-ink-muted">Yükleniyor...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-ink">İşletme Ayarları</h2>
          <p className="text-sm text-ink-muted mt-1">{biz.name || 'Yeni işletme'} — değişiklikler otomatik kaydedilir.</p>
        </div>
        <span className={`text-sm ${status.color}`}>{status.text}</span>
      </div>

      <Tabs defaultValue="general">
        <div className="overflow-x-auto">
          <TabsList className="bg-surface border-b border-border w-max min-w-full">
            <Tab v="general" icon={Building2}>Genel</Tab>
            <Tab v="bot" icon={Bot}>Bot</Tab>
            <Tab v="appearance" icon={Palette}>Görünüm</Tab>
            <Tab v="hours" icon={Clock}>Saatler</Tab>
            <Tab v="services" icon={Wrench}>Hizmetler</Tab>
            <Tab v="pricing" icon={DollarSign}>Fiyatlar</Tab>
            <Tab v="faqs" icon={HelpCircle}>SSS</Tab>
            <Tab v="booking" icon={CalendarCheck}>Rezervasyon</Tab>
            <Tab v="marketing" icon={Megaphone}>Kampanya</Tab>
            <Tab v="email" icon={Mail}>Email/EmailJS</Tab>
          </TabsList>
        </div>

        <TabsContent value="general" className="pt-6">
          <Card><CardContent className="p-5 grid md:grid-cols-2 gap-4">
            <Field label="İşletme adı *"><Input value={biz.name || ''} onChange={e => update({ name: e.target.value })} placeholder="Çınar Ağacım Emlak" /></Field>
            <Field label="Sektör"><Input value={biz.sector || ''} onChange={e => update({ sector: e.target.value })} placeholder="Emlak / Restoran / Otel" /></Field>
            <Field label="Telefon"><Input value={biz.phone || ''} onChange={e => update({ phone: e.target.value })} placeholder="+90 ..." /></Field>
            <Field label="E-posta"><Input value={biz.email || ''} onChange={e => update({ email: e.target.value })} placeholder="info@..." /></Field>
            <Field label="Web sitesi"><Input value={biz.website || ''} onChange={e => update({ website: e.target.value })} placeholder="https://..." /></Field>
            <Field label="Adres"><Input value={biz.address || ''} onChange={e => update({ address: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label="Hakkında">
                <Textarea rows={3} value={biz.about || ''} onChange={e => update({ about: e.target.value })} placeholder="İşletme tanıtım metni..." />
              </Field>
            </div>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="bot" className="pt-6">
          <Card><CardContent className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Bot adı"><Input value={biz.bot_name || ''} onChange={e => update({ bot_name: e.target.value })} placeholder="Asistan adı" /></Field>
              <Field label="Emoji"><Input maxLength={4} value={biz.emoji || ''} onChange={e => update({ emoji: e.target.value })} placeholder="🤖" /></Field>
            </div>
            <Field label="Karşılama (TR)"><Textarea rows={2} value={biz.greeting || ''} onChange={e => update({ greeting: e.target.value })} /></Field>
            <Field label="Karşılama (EN)"><Textarea rows={2} value={biz.greeting_en || ''} onChange={e => update({ greeting_en: e.target.value })} /></Field>
            <Field label="Hızlı cevaplar (virgülle)"><Input value={(biz.quick_replies || []).join(', ')} onChange={e => update({ quick_replies: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} placeholder="Fiyatlar, Randevu, Saatler" /></Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Ton">
                <select value={biz.personality?.tone || ''} onChange={e => update({ personality: { ...(biz.personality || {}), tone: e.target.value } })} className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm">
                  <option value="">— seç —</option>
                  <option>Samimi ve profesyonel</option>
                  <option>Resmi ve kurumsal</option>
                  <option>Dostça ve esprili</option>
                  <option>Kısa ve net</option>
                </select>
              </Field>
              <Field label="Dil tercihi">
                <select value={biz.personality?.lang || 'İkisi de'} onChange={e => update({ personality: { ...(biz.personality || {}), lang: e.target.value } })} className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm">
                  <option>İkisi de</option><option>Türkçe</option><option>İngilizce</option>
                </select>
              </Field>
            </div>
            <Field label="Özel talimatlar (üst öncelikli)"><Textarea rows={3} value={biz.instructions || ''} onChange={e => update({ instructions: e.target.value })} placeholder="Botun her zaman uyacağı kurallar..." /></Field>
            <Field label="Kısıtlamalar"><Textarea rows={2} value={biz.restrictions || ''} onChange={e => update({ restrictions: e.target.value })} placeholder="Bot ne konuşmasın..." /></Field>
            <Field label="Ekstra notlar"><Textarea rows={3} value={biz.extra_notes || ''} onChange={e => update({ extra_notes: e.target.value })} /></Field>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="appearance" className="pt-6">
          <AppearanceTab biz={biz} update={update} bizId={bizId!} />
        </TabsContent>

        <TabsContent value="hours" className="pt-6">
          <HoursTab biz={biz} update={update} />
        </TabsContent>

        <TabsContent value="services" className="pt-6">
          <ServicesTab biz={biz} update={update} />
        </TabsContent>

        <TabsContent value="pricing" className="pt-6">
          <Card><CardContent className="p-5 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Para birimi"><Input value={biz.currency || ''} onChange={e => update({ currency: e.target.value })} placeholder="TL / USD / EUR" /></Field>
              <Field label="Ödeme yöntemleri"><Input value={biz.payment || ''} onChange={e => update({ payment: e.target.value })} placeholder="Nakit, Kredi kartı, Havale" /></Field>
            </div>
            <Field label="Fiyat notu"><Textarea rows={2} value={biz.price_note || ''} onChange={e => update({ price_note: e.target.value })} placeholder="KDV dahil/hariç, indirim bilgisi vb." /></Field>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="faqs" className="pt-6">
          <FaqsTab biz={biz} update={update} />
        </TabsContent>

        <TabsContent value="booking" className="pt-6">
          <Card><CardContent className="p-5 space-y-4">
            <Field label="Rezervasyon yöntemi">
              <select value={biz.booking_method || ''} onChange={e => update({ booking_method: e.target.value })} className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm">
                <option value="">Kapalı</option>
                <option value="bot">Bot üzerinden al</option>
                <option value="call">Telefon ile</option>
              </select>
            </Field>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="En az kaç saat öncesinden?"><Input type="number" value={biz.booking_min || ''} onChange={e => update({ booking_min: e.target.value })} /></Field>
              <Field label="En fazla kaç gün öncesi?"><Input type="number" value={biz.booking_max || ''} onChange={e => update({ booking_max: e.target.value })} /></Field>
              <Field label="Seans süresi (dk)"><Input type="number" value={biz.booking_duration || ''} onChange={e => update({ booking_duration: e.target.value })} /></Field>
              <Field label="Kapasite"><Input type="number" value={biz.booking_capacity || ''} onChange={e => update({ booking_capacity: e.target.value })} /></Field>
            </div>
            <Field label="İptal politikası"><Textarea rows={2} value={biz.booking_policy || ''} onChange={e => update({ booking_policy: e.target.value })} /></Field>
            <Field label="Onay mesajı"><Textarea rows={2} value={biz.booking_confirm || ''} onChange={e => update({ booking_confirm: e.target.value })} /></Field>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="marketing" className="pt-6">
          <Card><CardContent className="p-5 space-y-4">
            <Field label="Kampanyalar"><Textarea rows={3} value={biz.campaigns || ''} onChange={e => update({ campaigns: e.target.value })} placeholder="Aktif promosyonlar, indirimler..." /></Field>
            <Field label="Otopark bilgisi"><Input value={biz.parking || ''} onChange={e => update({ parking: e.target.value })} placeholder="Ücretsiz / Vale / Yok" /></Field>
            <Field label="Sosyal medya"><Textarea rows={2} value={biz.social || ''} onChange={e => update({ social: e.target.value })} placeholder="Instagram: @..., Facebook: ..." /></Field>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="email" className="pt-6">
          <Card><CardContent className="p-5 space-y-4">
            <p className="text-sm text-ink-muted">Rezervasyon onayı için EmailJS bilgileri.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Service ID"><Input value={biz.emailjs_service_id || ''} onChange={e => update({ emailjs_service_id: e.target.value })} /></Field>
              <Field label="Template ID"><Input value={biz.emailjs_template_id || ''} onChange={e => update({ emailjs_template_id: e.target.value })} /></Field>
              <Field label="Public Key"><Input value={biz.emailjs_public_key || ''} onChange={e => update({ emailjs_public_key: e.target.value })} /></Field>
              <Field label="Bildirim adresi"><Input value={biz.emailjs_notify_email || ''} onChange={e => update({ emailjs_notify_email: e.target.value })} /></Field>
            </div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Tab({ v, icon: Icon, children }: any) {
  return <TabsTrigger value={v} className="gap-2"><Icon className="w-3.5 h-3.5" />{children}</TabsTrigger>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>{children}</div>
}

function AppearanceTab({ biz, update, bizId }: any) {
  const [cropOpen, setCropOpen] = useState(false)
  const cropCanvas = useRef<HTMLCanvasElement>(null)
  const [cropImg, setCropImg] = useState<HTMLImageElement | null>(null)
  const [zoom, setZoom] = useState(100)
  const offset = useRef({ x: 0, y: 0 })
  const dragStart = useRef<{ x: number; y: number } | null>(null)
  const [copied, setCopied] = useState(false)

  const draw = () => {
    if (!cropImg || !cropCanvas.current) return
    const ctx = cropCanvas.current.getContext('2d')!
    const s = zoom / 100
    ctx.clearRect(0, 0, 300, 300)
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 300, 300)
    ctx.drawImage(cropImg, offset.current.x, offset.current.y, cropImg.width * s, cropImg.height * s)
  }
  useEffect(() => { if (cropOpen) draw() }, [zoom, cropOpen])

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f || f.size > 5 * 1024 * 1024) { if (f) alert('Max 5MB'); return }
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
    if (!cropCanvas.current) return
    const out = document.createElement('canvas')
    out.width = 256; out.height = 256
    out.getContext('2d')!.drawImage(cropCanvas.current, 0, 0, 300, 300, 0, 0, 256, 256)
    const blob = await new Promise<Blob>((r) => out.toBlob(b => r(b!), 'image/jpeg', 0.88))
    setCropOpen(false)
    await api.uploadAvatar(bizId, new File([blob], 'avatar.jpg', { type: 'image/jpeg' }))
    const fresh = await api.getBusiness(bizId)
    Object.keys(fresh).forEach(k => update({ [k]: fresh[k] }))
  }

  const removeAvatar = async () => {
    if (!confirm('Avatar silinsin mi?')) return
    update({ avatar_url: '' })
  }

  const embedUrl = `${window.location.origin}/embed/${bizId}`
  const snippet = `<script src="${embedUrl}"></script>`
  const copy = () => { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-6">
      <div className="space-y-5 min-w-0">
        <Card><CardContent className="p-5 space-y-4">
          <Field label="Logo (boş ise emoji)">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full border border-border bg-white flex items-center justify-center overflow-hidden text-2xl shrink-0">
                {biz.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz.emoji || '🤖')}
              </div>
              <label className="flex-1">
                <input type="file" accept="image/*" className="hidden" onChange={onFile} />
                <Button variant="secondary" asChild><span className="cursor-pointer"><Upload className="w-4 h-4" />Resim seç ve kırp</span></Button>
              </label>
              {biz.avatar_url && <Button variant="danger" size="sm" onClick={removeAvatar}><Trash2 className="w-4 h-4" /></Button>}
            </div>
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ana renk (buton/header)">
              <div className="flex gap-2"><input type="color" value={biz.widget_color || '#2563EB'} onChange={e => update({ widget_color: e.target.value })} className="h-9 w-12 rounded-md border border-border cursor-pointer" /><Input value={biz.widget_color || '#2563EB'} onChange={e => update({ widget_color: e.target.value })} /></div>
            </Field>
            <Field label="Sohbet arka planı">
              <div className="flex gap-2"><input type="color" value={biz.widget_bg || '#FFFFFF'} onChange={e => update({ widget_bg: e.target.value })} className="h-9 w-12 rounded-md border border-border cursor-pointer" /><Input value={biz.widget_bg || '#FFFFFF'} onChange={e => update({ widget_bg: e.target.value })} /></div>
            </Field>
          </div>
          <Field label="Konum (müşteri sitesinde)">
            <select value={biz.widget_position || 'bottom-right'} onChange={e => update({ widget_position: e.target.value })} className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm">
              <option value="bottom-right">Sağ alt</option><option value="bottom-left">Sol alt</option>
            </select>
          </Field>
        </CardContent></Card>

        <Card><CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-ink">Sitenize ekleyin</h3>
            <a href={`/widget/${bizId}`} target="_blank" rel="noreferrer" className="text-xs text-brand hover:underline flex items-center gap-1"><ExternalLink className="w-3 h-3" />Önizle</a>
          </div>
          <div className="flex gap-2">
            <code className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-xs font-mono overflow-x-auto whitespace-nowrap">{snippet}</code>
            <Button variant="secondary" onClick={copy}>{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}</Button>
          </div>
          <p className="text-xs text-ink-muted">Tek satırı sitenizin <code className="bg-bg px-1 rounded">&lt;/body&gt;</code> tagından önce yapıştırın.</p>
        </CardContent></Card>
      </div>

      <Card className="lg:sticky lg:top-20 h-fit"><CardContent className="p-4">
        <div className="text-xs uppercase tracking-wide text-ink-muted mb-3">Canlı önizleme</div>
        <div className="rounded-lg border border-border overflow-hidden h-[520px] flex flex-col" style={{ background: biz.widget_bg || '#FFFFFF' }}>
          <div className="px-4 py-3 flex items-center gap-3" style={{ background: biz.widget_color || '#2563EB', color: '#fff' }}>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg overflow-hidden">
              {biz.avatar_url ? <img src={biz.avatar_url} className="w-full h-full object-cover" /> : (biz.emoji || '🤖')}
            </div>
            <div><div className="text-sm font-semibold">{biz.bot_name || biz.name || 'Bot'}</div><div className="text-[10px] opacity-80">Çevrimiçi</div></div>
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
      </CardContent></Card>

      {cropOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg p-6 max-w-md w-full">
            <h3 className="text-base font-semibold text-ink mb-1">Resmi yerleştir</h3>
            <p className="text-sm text-ink-muted mb-4">Sürükle ve yakınlaştır.</p>
            <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp}
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

function HoursTab({ biz, update }: any) {
  const hours = biz.hours_detail || {}
  const setDay = (day: string, patch: any) => update({ hours_detail: { ...hours, [day]: { ...(hours[day] || {}), ...patch } } })
  return (
    <Card><CardContent className="p-5 space-y-3">
      <p className="text-sm text-ink-muted">Her gün için açılış-kapanış saatleri.</p>
      {DAYS.map(day => {
        const h = hours[day] || {}
        return (
          <div key={day} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
            <div className="w-24 text-sm font-medium text-ink">{day}</div>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input type="checkbox" checked={!!h.closed} onChange={e => setDay(day, { closed: e.target.checked })} />
              Kapalı
            </label>
            {!h.closed && (
              <>
                <Input type="time" value={h.open || '09:00'} onChange={e => setDay(day, { open: e.target.value })} className="w-28" />
                <span className="text-ink-muted">–</span>
                <Input type="time" value={h.close || '18:00'} onChange={e => setDay(day, { close: e.target.value })} className="w-28" />
              </>
            )}
          </div>
        )
      })}
    </CardContent></Card>
  )
}

function ServicesTab({ biz, update }: any) {
  const services = biz.services || []
  const upd = (i: number, patch: any) => update({ services: services.map((s: any, j: number) => i === j ? { ...s, ...patch } : s) })
  const add = () => update({ services: [...services, { name: '', price: '' }] })
  const del = (i: number) => update({ services: services.filter((_: any, j: number) => i !== j) })
  return (
    <Card><CardContent className="p-5 space-y-3">
      <p className="text-sm text-ink-muted">Sunduğunuz hizmetler ve fiyatlar.</p>
      <div className="space-y-2">
        {services.map((s: any, i: number) => (
          <div key={i} className="flex gap-2 items-center">
            <Input className="flex-1" placeholder="Hizmet adı" value={s.name || ''} onChange={e => upd(i, { name: e.target.value })} />
            <Input className="w-40" placeholder="Fiyat" value={s.price || ''} onChange={e => upd(i, { price: e.target.value })} />
            <Button variant="ghost" size="icon" onClick={() => del(i)} className="text-danger"><X className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <Button variant="secondary" onClick={add}><Plus className="w-4 h-4" />Hizmet ekle</Button>
    </CardContent></Card>
  )
}

function FaqsTab({ biz, update }: any) {
  const faqs = biz.faqs || []
  const upd = (i: number, patch: any) => update({ faqs: faqs.map((f: any, j: number) => i === j ? { ...f, ...patch } : f) })
  const add = () => update({ faqs: [...faqs, { q: '', a: '' }] })
  const del = (i: number) => update({ faqs: faqs.filter((_: any, j: number) => i !== j) })
  return (
    <Card><CardContent className="p-5 space-y-4">
      <p className="text-sm text-ink-muted">Müşterilerin sık sorduğu sorular ve cevapları.</p>
      <div className="space-y-3">
        {faqs.map((f: any, i: number) => (
          <div key={i} className="p-3 border border-border rounded-md bg-bg space-y-2 relative">
            <Input placeholder="Soru" value={f.q || ''} onChange={e => upd(i, { q: e.target.value })} />
            <Textarea rows={2} placeholder="Cevap" value={f.a || ''} onChange={e => upd(i, { a: e.target.value })} />
            <Button variant="ghost" size="icon" onClick={() => del(i)} className="text-danger absolute top-2 right-2"><X className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
      <Button variant="secondary" onClick={add}><Plus className="w-4 h-4" />SSS ekle</Button>
    </CardContent></Card>
  )
}
