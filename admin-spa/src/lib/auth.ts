const TOKEN_KEY = 'nxbt'

// eski key temizligi (tek seferlik)
try { localStorage.removeItem('nexa_admin_token') } catch {}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthed(): boolean {
  return !!getToken()
}
