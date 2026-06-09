import { useEffect, useRef, useState } from 'react'
import { api, ApiError } from '../lib/api'

const DEFAULT_CENTER = [-27.49, -48.66]
const DEFAULT_ZOOM = 11

function color(c) {
  if (!c.enabled) return '#94a3b8'
  if (c.is_streaming) return '#10b981'
  return '#3b82f6'
}
function statusLabel(c) {
  if (!c.enabled) return 'Desativada'
  if (c.is_streaming) return 'No ar'
  return 'Ociosa'
}

export default function Mapa() {
  const mapEl = useRef(null)
  const mapRef = useRef(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [withCoords, setWithCoords] = useState(0)

  useEffect(() => {
    let active = true
    ;(async () => {
      setLoading(true); setError('')
      try {
        const [list, coords] = await Promise.all([
          api.get('/api/cameras?mine=1'),
          api.get('/api/map/coords'),
        ])
        if (!active) return
        const cams = Array.isArray(list) ? list : (list?.cameras ?? [])
        const pts = cams
          .filter((c) => coords && coords[c.camera_id])
          .map((c) => ({ ...c, lat: coords[c.camera_id].lat, lng: coords[c.camera_id].lng }))
        setWithCoords(pts.length)
        renderMap(pts)
      } catch (e) {
        if (active) setError(e instanceof ApiError ? e.message : 'Erro ao carregar.')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => { active = false; if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function renderMap(pts) {
    const L = window.L
    if (!L || !mapEl.current || mapRef.current) return
    const map = L.map(mapEl.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map)
    mapRef.current = map
    const latlngs = []
    const safe = (s) => String(s || '').replace(/</g, '&lt;')
    pts.forEach((c) => {
      L.circleMarker([c.lat, c.lng], {
        radius: 9, color: '#fff', weight: 2, fillColor: color(c), fillOpacity: 0.9,
      }).addTo(map).bindPopup(
        `<div style="min-width:160px"><b>${safe(c.name || c.camera_id)}</b>` +
        (c.location ? `<br>${safe(c.location)}` : '') +
        `<br><span style="color:#64748b">${statusLabel(c)}</span>` +
        `<br><a href="/painel/cameras/${encodeURIComponent(c.camera_id)}/seguranca">Gerenciar</a></div>`
      )
      latlngs.push([c.lat, c.lng])
    })
    if (latlngs.length === 1) map.setView(latlngs[0], 15)
    else if (latlngs.length > 1) map.fitBounds(L.latLngBounds(latlngs).pad(0.2))
    setTimeout(() => map.invalidateSize(), 200)
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 py-8">
      <h1 className="font-display text-2xl font-bold text-white">Mapa</h1>
      <p className="mt-1 text-sm text-slate-400">Suas câmeras com localização definida.</p>

      {error && <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
      {!loading && !error && withCoords === 0 && (
        <p className="mt-4 rounded-lg border border-slate-700 bg-slate-800/60 px-4 py-3 text-sm text-slate-300">
          Nenhuma câmera com localização ainda. Abra uma câmera → aba <b>Localização</b> para definir.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#10b981' }} /> No ar</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#3b82f6' }} /> Ociosa</span>
        <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: '#94a3b8' }} /> Desativada</span>
      </div>

      <div ref={mapEl} className="mt-3 h-[560px] w-full overflow-hidden rounded-xl border border-slate-700" />
    </main>
  )
}
