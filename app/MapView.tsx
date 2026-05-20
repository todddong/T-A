'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type { Memory } from '@/lib/supabase'

export type MemoryWithUrl = Memory & { image_url: string | null }

type Props = {
  memories: MemoryWithUrl[]
}

// Pittsburgh / CMU center
const CMU_CENTER: [number, number] = [40.4440, -79.9436]

export default function MapView({ memories }: Props) {
  const mapContainer = useRef<HTMLDivElement | null>(null)
  // Leaflet types are loaded dynamically (client-only), so use `unknown` here.
  const mapRef = useRef<unknown>(null)
  const [selected, setSelected] = useState<MemoryWithUrl | null>(null)

  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    // Load Leaflet only on the client (it touches `window`).
    import('leaflet').then((mod) => {
      if (cancelled || !mapContainer.current) return
      const L = mod.default ?? mod

      const map = L.map(mapContainer.current, {
        center: CMU_CENTER,
        zoom: 14,
        zoomControl: true,
        scrollWheelZoom: true,
        worldCopyJump: true,
      })

      // Free, no-token dark tiles from CartoDB.
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
        }
      ).addTo(map)

      memories.forEach((memory) => {
        const icon = L.divIcon({
          className: 'star-pin-leaflet',
          html: `
            <div class="star-pin" role="button" tabindex="0" aria-label="${escapeAttr(memory.title)}">
              <svg class="star" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5l2.95 5.98 6.6.96-4.78 4.65 1.13 6.57L12 17.77l-5.9 3.1 1.13-6.57L2.45 9.44l6.6-.96L12 2.5z"/>
              </svg>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        })

        const marker = L.marker([memory.lat, memory.lng], { icon }).addTo(map)

        marker.on('click', () => {
          setSelected(memory)
          map.flyTo([memory.lat, memory.lng], 16, { duration: 0.9 })
        })
      })

      mapRef.current = map

      // Leaflet sometimes mis-measures size when its container animates in.
      // A quick invalidateSize after mount guarantees correct tile loading.
      const t = window.setTimeout(() => map.invalidateSize(), 50)

      cleanup = () => {
        window.clearTimeout(t)
        map.remove()
        mapRef.current = null
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [memories])

  return (
    <>
      <div className="relative w-full h-[60vh] sm:h-[70vh] bg-zinc-950">
        <div ref={mapContainer} className="absolute inset-0" />
      </div>

      {selected && (
        <MemoryModal memory={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function MemoryModal({
  memory,
  onClose,
}: {
  memory: MemoryWithUrl
  onClose: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="memory-title"
    >
      <div
        className="memory-modal-enter relative bg-zinc-900/95 rounded-3xl overflow-hidden max-w-md w-full border border-pink-400/30 shadow-[0_20px_80px_-10px_rgba(255,61,119,0.6)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center text-lg backdrop-blur transition"
        >
          ×
        </button>

        {memory.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={memory.image_url}
            alt={memory.title}
            className="w-full h-72 object-cover"
          />
        ) : (
          <div className="w-full h-72 flex items-center justify-center bg-zinc-800 text-pink-200/60 text-sm">
            photo coming soon
          </div>
        )}

        <div className="p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-accent-soft/80 mb-1">
            {memory.location}
          </p>
          <h2 id="memory-title" className="text-2xl font-semibold text-white mb-3">
            {memory.title}
          </h2>
          <p className="text-pink-100/80 leading-relaxed mb-5">
            {memory.caption}
          </p>
          {memory.happened_on && (
            <p className="text-xs text-pink-100/50 mb-4">
              {new Date(memory.happened_on).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          )}

          <button
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 transition text-white font-semibold py-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
