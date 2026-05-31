import { getToken, clearToken } from './auth'

export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

async function request<T = any>(path: string, opts: RequestInit = {}, auth = true): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((opts.headers as Record<string, string>) || {}),
  }
  if (auth) {
    const t = getToken()
    if (t) headers['Authorization'] = `Bearer ${t}`
  }
  const r = await fetch(path, { ...opts, headers })
  if (r.status === 401 && auth) {
    clearToken()
    window.location.href = '/admin-new/login'
    throw new ApiError('Unauthorized', 401)
  }
  const text = await r.text()
  const data = text ? (() => { try { return JSON.parse(text) } catch { return text } })() : null
  if (!r.ok) throw new ApiError((data && data.error) || `HTTP ${r.status}`, r.status)
  return data as T
}

export const api = {
  login: (password: string) => request<{ token: string }>('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) }, false),

  // Businesses
  listBusinesses: () => request<any[]>('/api/businesses'),
  getBusiness: (id: string) => request<any>(`/api/business/${id}`, {}, false),
  getBusinessFull: (id: string) => request<any>(`/api/admin/business/${id}`),
  saveBusiness: (data: any) => request<any>('/api/business', { method: 'POST', body: JSON.stringify(data) }),
  deleteBusiness: (id: string) => request<any>(`/api/business/${id}`, { method: 'DELETE' }),

  // Conversations
  listConversations: (bizId?: string) => request<any[]>(`/api/conversations${bizId ? `?bizId=${bizId}` : ''}`),
  getConversation: (sid: string) => request<any>(`/api/conversation/${sid}`),
  exportConversations: async (bizId: string) => {
    const r = await fetch(`/api/conversations/export/${bizId}`, { headers: { Authorization: `Bearer ${getToken()}` } })
    return r.blob()
  },

  // Leads
  listLeads: (bizId: string) => request<any[]>(`/api/leads?bizId=${bizId}`),
  updateLead: (id: number, body: { status?: string; notes?: string }) => request(`/api/lead/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteLead: (id: number) => request(`/api/lead/${id}`, { method: 'DELETE' }),

  // Analytics
  analytics: () => request<any[]>('/api/analytics'),
  analyticsDaily: (bizId: string, days = 30) => request<{ days: number; conversations: any[]; leads: any[] }>(`/api/analytics-daily/${bizId}?days=${days}`),

  // KB
  kbStats: (bizId: string) => request<{ chunks: number; chars: number }>(`/api/kb-stats/${bizId}`),
  kbSources: (bizId: string) => request<any[]>(`/api/kb/${bizId}`),
  kbUploadText: (bizId: string, name: string, text: string) => request(`/api/kb/upload-text/${bizId}`, { method: 'POST', body: JSON.stringify({ name, text }) }),
  kbUploadUrl: (bizId: string, url: string) => request(`/api/kb/upload-url/${bizId}`, { method: 'POST', body: JSON.stringify({ url }) }),
  kbCrawl: (bizId: string, startUrl: string, maxPages = 25) => request(`/api/kb/crawl/${bizId}`, { method: 'POST', body: JSON.stringify({ startUrl, maxPages }) }),
  kbDeleteSource: (sourceId: number, bizId: string) => request(`/api/kb/source/${sourceId}/${bizId}`, { method: 'DELETE' }),

  // Avatar
  uploadAvatar: async (bizId: string, file: File) => {
    const fd = new FormData()
    fd.append('file', file)
    const r = await fetch(`/api/business/${bizId}/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${getToken()}` }, body: fd })
    if (!r.ok) throw new ApiError((await r.json()).error || 'Upload failed', r.status)
    return r.json()
  },

  // Chat (test)
  chat: (businessId: string, message: string, sessionId?: string) =>
    request<{ reply: string; sessionId: string; citations?: string[] }>('/api/chat', { method: 'POST', body: JSON.stringify({ businessId, message, sessionId }) }, false),
}
