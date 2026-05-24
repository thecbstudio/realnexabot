import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { useActiveBusinessId } from '@/components/AppHeader'
import { Copy, ExternalLink, Check } from 'lucide-react'

export function WhatsApp() {
  const bizId = useActiveBusinessId()
  const [biz, setBiz] = useState<any>(null)
  const [copied, setCopied] = useState('')

  useEffect(() => { if (bizId) api.getBusiness(bizId).then(setBiz) }, [bizId])

  if (!bizId || !biz) return <div className="text-sm text-ink-muted">Yükleniyor...</div>

  const save = async (patch: any) => {
    await api.saveBusiness({ businessId: bizId, ...patch })
    setBiz({ ...biz, ...patch })
  }

  const webhookUrl = `${window.location.origin}/api/webhook/whatsapp/${bizId}`
  const copy = (s: string, label: string) => { navigator.clipboard.writeText(s); setCopied(label); setTimeout(() => setCopied(''), 2000) }

  const configured = biz.whatsapp_phone_number_id && biz.whatsapp_access_token && biz.whatsapp_verify_token

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-ink">WhatsApp Entegrasyonu</h2>
          <p className="text-sm text-ink-muted mt-1">Botu Meta WhatsApp Cloud API ile bağla.</p>
        </div>
        <Badge variant={configured ? 'success' : 'warning'}>{configured ? 'Yapılandırıldı' : 'Yapılandırılmamış'}</Badge>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="text-sm font-semibold text-ink">Meta'dan aldığın bilgiler</h3>
          <Field label="Phone Number ID">
            <Input value={biz.whatsapp_phone_number_id || ''} onBlur={e => save({ whatsapp_phone_number_id: e.target.value })} defaultValue={biz.whatsapp_phone_number_id || ''} placeholder="örn: 123456789012345" />
          </Field>
          <Field label="Access Token">
            <Input type="password" defaultValue={biz.whatsapp_access_token || ''} onBlur={e => save({ whatsapp_access_token: e.target.value })} placeholder="EAAxx..." />
          </Field>
          <Field label="App Secret (HMAC için)">
            <Input type="password" defaultValue={biz.whatsapp_app_secret || ''} onBlur={e => save({ whatsapp_app_secret: e.target.value })} placeholder="Meta App secret" />
          </Field>
          <Field label="Verify Token (sen oluştur, Meta'ya gir)">
            <Input defaultValue={biz.whatsapp_verify_token || ''} onBlur={e => save({ whatsapp_verify_token: e.target.value })} placeholder="örn: nexa_wa_2026_random" />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="text-sm font-semibold text-ink">Meta'ya gireceğin webhook</h3>
          <CopyRow value={webhookUrl} onCopy={() => copy(webhookUrl, 'url')} copied={copied === 'url'} label="Callback URL" />
          <CopyRow value={biz.whatsapp_verify_token || '(önce yukarıya yaz)'} onCopy={() => copy(biz.whatsapp_verify_token || '', 'tok')} copied={copied === 'tok'} label="Verify Token" />
          <p className="text-xs text-ink-muted">Meta App → WhatsApp → Configuration → Webhook → Bu URL ve token'ı gir, "messages" alanına abone ol.</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">Adım adım kılavuz</h3>
          <ol className="space-y-2 text-sm text-ink-muted list-decimal list-inside">
            <li><a className="text-brand hover:underline" href="https://developers.facebook.com" target="_blank">developers.facebook.com</a> → Create App → Business → WhatsApp ekle</li>
            <li>API Setup sayfasından <b>Phone Number ID</b>, <b>Temporary Access Token</b> ve <b>App Secret</b>'i kopyala, yukarıya yapıştır</li>
            <li>Verify Token'ı kendin uydur (uzun rastgele string), yukarıya yaz</li>
            <li>Meta'da Configuration → Webhook → yukarıdaki URL ve Token'ı gir, "messages"a abone ol</li>
            <li>Meta sandbox numarasından test mesajı at — bot cevap verecek</li>
          </ol>
          <p className="text-xs text-warning mt-4">Üretim için Meta business verification gerek (1-2 hafta). Sandbox'ta hemen test edebilirsin.</p>
        </CardContent>
      </Card>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>{children}</div>
}

function CopyRow({ value, onCopy, copied, label }: { value: string; onCopy: () => void; copied: boolean; label: string }) {
  return (
    <div>
      <label className="block text-xs font-medium text-ink-muted mb-1.5">{label}</label>
      <div className="flex gap-2">
        <code className="flex-1 bg-bg border border-border rounded-md px-3 py-2 text-xs font-mono overflow-x-auto whitespace-nowrap">{value}</code>
        <Button variant="secondary" onClick={onCopy}>{copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}{copied ? 'Kopyalandı' : 'Kopyala'}</Button>
      </div>
    </div>
  )
}
