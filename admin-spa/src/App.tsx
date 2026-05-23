import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { isAuthed } from '@/lib/auth'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { Placeholder } from '@/pages/Placeholder'

function AuthGate() {
  const loc = useLocation()
  if (!isAuthed()) return <Navigate to="/admin-new/login" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

function Layout() {
  const titleMap: Record<string, string> = {
    '/admin-new': 'Genel Bakış',
    '/admin-new/test': 'Test Bot',
    '/admin-new/knowledge': 'Bilgi Tabanı',
    '/admin-new/customize': 'Widget Özelleştirme',
    '/admin-new/conversations': 'Konuşmalar',
    '/admin-new/leads': 'Leadler',
    '/admin-new/analytics': 'Analiz',
    '/admin-new/whatsapp': 'WhatsApp Kurulum',
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
            <Route path="test" element={<Placeholder title="Test Bot" />} />
            <Route path="knowledge" element={<Placeholder title="Bilgi Tabanı" />} />
            <Route path="customize" element={<Placeholder title="Widget Özelleştirme" />} />
            <Route path="conversations" element={<Placeholder title="Konuşmalar" />} />
            <Route path="leads" element={<Placeholder title="Leadler" />} />
            <Route path="analytics" element={<Placeholder title="Analiz" />} />
            <Route path="whatsapp" element={<Placeholder title="WhatsApp" />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
