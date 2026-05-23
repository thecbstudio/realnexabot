import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, ApiError } from '@/lib/api'
import { setToken } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Login() {
  const [pw, setPw] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const nav = useNavigate()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(''); setLoading(true)
    try {
      const { token } = await api.login(pw)
      setToken(token)
      nav('/admin-new')
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Hata')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <div className="w-9 h-9 rounded-md bg-brand flex items-center justify-center text-white font-bold">N</div>
          <span className="text-xl font-semibold text-ink">NexaBot</span>
        </div>
        <div className="bg-surface border border-border rounded-lg shadow-card p-6">
          <h1 className="text-lg font-semibold text-ink mb-1">Yönetici girişi</h1>
          <p className="text-sm text-ink-muted mb-6">Devam etmek için şifrenizi girin.</p>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Şifre</label>
              <Input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="••••••••" autoFocus />
            </div>
            {err && <div className="text-sm text-danger">{err}</div>}
            <Button type="submit" disabled={loading || !pw} className="w-full">
              {loading ? 'Giriş yapılıyor...' : 'Giriş yap'}
            </Button>
          </form>
        </div>
        <p className="text-xs text-ink-faint text-center mt-6">© {new Date().getFullYear()} NexaBot</p>
      </div>
    </div>
  )
}
