import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthed } from '@/lib/auth'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Customize } from '@/pages/Customize'
import { Test } from '@/pages/Test'
import { Knowledge } from '@/pages/Knowledge'
import { Leads } from '@/pages/Leads'
import { Conversations } from '@/pages/Conversations'
import { Analytics } from '@/pages/Analytics'
import { WhatsApp } from '@/pages/WhatsApp'

function AuthGate() {
  const loc = useLocation()
  if (!isAuthed()) return <Navigate to="/login" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

function Layout() {
  const titleMap: Record<string, string> = {
    '/': 'Genel Bakış',
    '/test': 'Test Bot',
    '/knowledge': 'Bilgi Tabanı',
    '/customize': 'Widget Özelleştirme',
    '/conversations': 'Konuşmalar',
    '/leads': 'Leadler',
    '/analytics': 'Analiz',
    '/whatsapp': 'WhatsApp Kurulum',
  }
  const loc = useLocation()
  const title = titleMap[loc.pathname] || ''
  return (
    <div className="min-h-screen flex bg-bg">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AppHeader title={title} />
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/admin-new">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<AuthGate />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="test" element={<Test />} />
            <Route path="knowledge" element={<Knowledge />} />
            <Route path="customize" element={<Customize />} />
            <Route path="conversations" element={<Conversations />} />
            <Route path="leads" element={<Leads />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="whatsapp" element={<WhatsApp />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
