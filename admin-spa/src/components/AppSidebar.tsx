import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Database, Settings as SettingsIcon, MessagesSquare, Target, BarChart3, Smartphone, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { clearToken } from '@/lib/auth'

const items = [
  { to: '/', label: 'Genel Bakış', icon: LayoutDashboard, end: true, group: 'Ana' },
  { to: '/settings', label: 'İşletme Ayarları', icon: SettingsIcon, group: 'Yapılandırma' },
  { to: '/knowledge', label: 'Bilgi Tabanı', icon: Database, group: 'Yapılandırma' },
  { to: '/test', label: 'Test Bot', icon: MessageSquare, group: 'Yapılandırma' },
  { to: '/conversations', label: 'Konuşmalar', icon: MessagesSquare, group: 'Veri' },
  { to: '/leads', label: 'Leadler', icon: Target, group: 'Veri' },
  { to: '/analytics', label: 'Analiz', icon: BarChart3, group: 'Veri' },
  { to: '/whatsapp', label: 'WhatsApp', icon: Smartphone, group: 'Entegrasyon' },
]

export function AppSidebar() {
  const nav = useNavigate()
  const groups = Array.from(new Set(items.map(i => i.group)))
  return (
    <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="h-14 px-5 flex items-center border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-brand flex items-center justify-center text-white text-sm font-bold">N</div>
          <span className="font-semibold text-ink">NexaBot</span>
        </div>
      </div>
      <nav className="flex-1 p-3 overflow-y-auto scrollbar-thin">
        {groups.map(g => (
          <div key={g} className="mb-4">
            <div className="text-[10px] uppercase tracking-wider text-ink-faint font-semibold px-3 mb-1.5">{g}</div>
            <div className="space-y-0.5">
              {items.filter(i => i.group === g).map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    cn('flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors',
                      isActive ? 'bg-bg text-ink font-medium border-l-2 border-brand pl-[10px]' : 'text-ink-muted hover:bg-bg hover:text-ink')
                  }>
                  <Icon className="w-4 h-4" />{label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <button onClick={() => { clearToken(); nav('/login') }}
          className="flex items-center gap-3 px-3 h-9 w-full rounded-md text-sm text-ink-muted hover:bg-bg hover:text-ink">
          <LogOut className="w-4 h-4" />Çıkış
        </button>
      </div>
    </aside>
  )
}
