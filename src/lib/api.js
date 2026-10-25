// src/lib/api.js
// Helper de chamadas à API do MaaxCam.
// Injeta o token do Supabase (Authorization: Bearer ...) e trata erros comuns.

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.livebybit.com'

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
  // Envio de arquivo grande com o corpo CRU (bytes do arquivo) e barra de progresso (onProgress recebe 0..1).
  // Mesmo token e mesmo formato de erro (ApiError) do apiFetch.
  uploadRaw: (path, file, onProgress) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE}${path}`)
    const token = getAccessToken()
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('Content-Type', 'application/octet-stream')
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total) }
    xhr.onerror = () => reject(new ApiError('Falha de conexão com a API.', 0))
    xhr.onabort = () => reject(new ApiError('Envio cancelado.', 0))
    xhr.onload = () => {
      let body = null
      try { body = JSON.parse(xhr.responseText) } catch {}
      if (xhr.status === 401) return reject(new ApiError('Sessão expirada ou inválida. Faça login de novo.', 401))
      if (xhr.status === 404) return reject(new ApiError('Não encontrado.', 404))
      if (xhr.status < 200 || xhr.status >= 300) return reject(new ApiError(body?.detail || `Erro ${xhr.status}.`, xhr.status))
      resolve(body)
    }
    xhr.send(file)
  }),
  // Busca um recurso binário (ex.: pré-visualização de imagem) com autenticação,
  // devolvendo um Blob. Útil pra <img src={URL.createObjectURL(blob)}>, já que
  // uma tag <img> sozinha não manda o header Authorization.
  getBlob: async (path) => {
    const token = getAccessToken()
    const headers = {}
    if (token) headers.Authorization = `Bearer ${token}`
    let res
    try {
      res = await fetch(`${API_BASE}${path}`, { headers })
    } catch {
      throw new ApiError('Falha de conexão com a API.', 0)
    }
    if (!res.ok) throw new ApiError(`Erro ${res.status}.`, res.status)
    return await res.blob()
  },
}
