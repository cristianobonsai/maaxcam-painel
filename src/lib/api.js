// src/lib/api.js
// Helper de chamadas à API do MaaxCam.
// Injeta o token do Supabase (Authorization: Bearer ...) e trata erros comuns.

const API_BASE = 'https://api.livebybit.com'

// O Supabase guarda a sessão no localStorage nesta chave.
const SESSION_KEY = 'sb-qtvrzdwgfeomzahtjwpz-auth-token'

function getAccessToken() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw)?.access_token ?? null
  } catch {
    return null
  }
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export async function apiFetch(path, options = {}) {
  const token = getAccessToken()
  const isForm = options.body instanceof FormData
  const headers = {
    ...(isForm ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers || {}),
  }
  if (token) headers.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch {
    throw new ApiError('Falha de conexão com a API.', 0)
  }

  if (res.status === 401) throw new ApiError('Sessão expirada ou inválida. Faça login de novo.', 401)
  if (res.status === 404) throw new ApiError('Não encontrado.', 404)

  if (!res.ok) {
    let detail = ''
    try { detail = (await res.json())?.detail || '' } catch {}
    throw new ApiError(detail || `Erro ${res.status}.`, res.status)
  }

  if (res.status === 204) return null
  try { return await res.json() } catch { return null }
}

export const api = {
  get: (path) => apiFetch(path),
  post: (path, body) => apiFetch(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
  put: (path, body) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
  del: (path) => apiFetch(path, { method: 'DELETE' }),
  upload: (path, formData) => apiFetch(path, { method: 'POST', body: formData }),
}
