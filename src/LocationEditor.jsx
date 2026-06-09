import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from './lib/api'

const DEFAULT_CENTER = [-27.49, -48.66] // Biguaçu / SC
const DEFAULT_ZOOM = 12

export default function LocationEditor({ cameraId }) {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  const [location, setLocation] = useState('')
  const [coords, setCoords] = useState(null)
  const [suggested, setSuggested] = useState('')
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)
  const [banner, setBanner] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const d = await api.get(`/api/cameras/${cameraId}/location`)
        if (!active) return
        setLocation(d.location || '')
        if (d.lat != null && d.lng != null) setCoords({ lat: d.lat, lng: d.lng })
      } catch { /* ignora */ }
      finally { if (active) setLoading(false) }
    })()
    return () => { active = false }
  }, [cameraId])

  useEffect(() => {
    if (loading) return
    const L = window.L
    if (!L || !mapEl.current || mapRef.current) return
    const center = coords ? [coords.lat, coords.lng] : DEFAULT_CENTER
    const zoom = coords ? 16 : DEFAULT_ZOOM
    const map = L.map(mapEl.current).setView(center, zoom)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '© OpenStreetMap',
    }).addTo(map)
    const icon = L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;border-radius:50% 50% 50% 0;background:#3b82f6;border:2px solid #fff;transform:rotate(-45deg);box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',
      iconSize: [18, 18], iconAnchor: [9, 18],
    })
    const marker = L.marker(center, { draggable: true, icon }).addTo(map)
    marker.on('dragend', () => {
      const ll = marker.getLatLng()
      setCoords({ lat: ll.lat, lng: ll.lng })
      reverseGeocode(ll.lat, ll.lng)
    })
    map.on('click', (e) => {
      marker.setLatLng(e.latlng)
      setCoords({ lat: e.latlng.lat, lng: e.latlng.lng })
      reverseGeocode(e.latlng.lat, e.latlng.lng)
    })
    mapRef.current = map
    markerRef.current = marker
    setTimeout(() => map.invalidateSize(), 200)
    return () => { map.remove(); mapRef.current = null; markerRef.current = null }
  }, [loading])

  async function reverseGeocode(lat, lng) {
    try {
      const r = await api.get(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
      if (r && r.label) {
        setSuggested(r.label)
        setLocation((prev) => (prev && prev.trim() ? prev : r.label))
      }
    } catch { /* ignora */ }
  }

  async function doSearch(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (q.trim().length < 3) return
    setSearching(true); setBanner(null)
    try {
      const r = await api.get(`/api/geocode?q=${encodeURIComponent(q.trim())}`)
      setResults(Array.isArray(r) ? r : [])
      if (!r || r.length === 0) setBanner({ type: 'warn', text: 'Nenhum endereço encontrado.' })
    } catch (err) {
      setBanner({ type: 'err', text: err instanceof ApiError ? err.message : 'Falha na busca.' })
    } finally { setSearching(false) }
  }

  function pick(r) {
    setResults([]); setQ('')
    setCoords({ lat: r.lat, lng: r.lng })
    if (r.label) {
      setSuggested(r.label)
      setLocation((prev) => (prev && prev.trim() ? prev : r.label))
    }
    const map = mapRef.current, marker = markerRef.current
    if (map && marker) { marker.setLatLng([r.lat, r.lng]); map.setView([r.lat, r.lng], 17) }
  }

  async function save() {
    if (!coords) { setBanner({ type: 'warn', text: 'Defina um ponto no mapa primeiro.' }); return }
    setSaving(true); setBanner(null)
    try {
      await api.put(`/api/cameras/${cameraId}/location`, { location, lat: coords.lat, lng: coords.lng })
      setBanner({ type: 'ok', text: 'Localização salva.' })
    } catch (err) {
      setBanner({ type: 'err', text: err instanceof ApiError ? err.message : 'Falha ao salvar.' })
    } finally { setSaving(false) }
  }

  const bannerCls = {
    ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
    warn: 'border-amber-500/40 bg-amber-500/10 text-amber-300',
    err: 'border-red-500/40 bg-red-500/10 text-red-300',
  }

  return (
    <div className="max-w-2xl space-y-4">
      <div>
        <label className="mb-1 block text-sm text-slate-300">Endereço / identificação</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)}
          placeholder="Ex.: Loja Centro — Rua X, 123"
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
        <p className="mt-1 text-xs text-slate-500">Texto livre — você identifica do seu jeito. É o que aparece nas listas.</p>
        {suggested && suggested !== location && (
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs">
            <span className="min-w-0 text-slate-400">Endereço do pino: <span className="text-slate-200">{suggested}</span></span>
            <button type="button" onClick={() => setLocation(suggested)} className="ml-auto shrink-0 rounded-md border border-blue-500/50 px-2 py-1 font-medium text-blue-300 hover:bg-blue-500/10">Usar</button>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm text-slate-300">Buscar endereço no mapa</label>
        <div className="flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') doSearch(e) }}
            placeholder="Digite um endereço e busque"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none" />
          <button onClick={doSearch} disabled={searching}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50">
            {searching ? '...' : 'Buscar'}
          </button>
        </div>
        {results.length > 0 && (
          <ul className="mt-2 divide-y divide-slate-800 rounded-lg border border-slate-700 bg-slate-900">
            {results.map((r, i) => (
              <li key={i}>
                <button onClick={() => pick(r)} className="block w-full px-3 py-2 text-left text-sm text-slate-200 hover:bg-slate-800">
                  {r.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div ref={mapEl} className="h-72 w-full overflow-hidden rounded-xl border border-slate-700" />
      <p className="text-xs text-slate-500">
        Clique no mapa ou arraste o pino para ajustar o ponto exato.
        {coords && <span className="ml-1 text-slate-400">({coords.lat.toFixed(5)}, {coords.lng.toFixed(5)})</span>}
      </p>

      {banner && <div className={`rounded-lg border px-4 py-2.5 text-sm ${bannerCls[banner.type]}`}>{banner.text}</div>}

      <button onClick={save} disabled={saving}
        className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-60">
        {saving ? 'Salvando…' : 'Salvar localização'}
      </button>
    </div>
  )
}
