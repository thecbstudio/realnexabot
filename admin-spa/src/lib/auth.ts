const KEYS = ['nexa_admin_token', 'nxbt']

export function getToken(): string | null {
  for (const k of KEYS) {
    const v = localStorage.getItem(k)
    if (v) return v
  }
  return null
}

export function setToken(token: string) {
  KEYS.forEach(k => localStorage.setItem(k, token))
}

export function clearToken() {
  KEYS.forEach(k => localStorage.removeItem(k))
}

export function isAuthed(): boolean {
  return !!getToken()
}
