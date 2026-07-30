'use client'

import 'leaflet/dist/leaflet.css'
import { useEffect, useRef, useState } from 'react'
import type { Memory } from '@/lib/supabase'
import PhotoModal from './PhotoModal'

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
  const fitToMarkersRef = useRef<(() => void) | null>(null)
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

      // CartoDB Dark Matter, labels removed for a clean dark aesthetic.
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
        {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          subdomains: 'abcd',
        }
      ).addTo(map)

      const markerLatLngs: [number, number][] = []

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
        markerLatLngs.push([memory.lat, memory.lng])

        marker.on('click', () => {
          setSelected(memory)
        })
      })

      // Frame the initial view so every star fits on screen.
      const fitToMarkers = () => {
        if (markerLatLngs.length > 1) {
          map.fitBounds(markerLatLngs, {
            padding: [48, 48],
            maxZoom: 16,
            animate: false,
          })
        } else if (markerLatLngs.length === 1) {
          map.setView(markerLatLngs[0], 15, { animate: false })
        }
      }
      fitToMarkers()
      fitToMarkersRef.current = fitToMarkers

      mapRef.current = map

      // Leaflet sometimes mis-measures size when its container animates in.
      // Re-measure and re-fit so all stars are visible at the correct zoom.
      const t = window.setTimeout(() => {
        map.invalidateSize()
        fitToMarkers()
      }, 50)

      cleanup = () => {
        window.clearTimeout(t)
        map.remove()
        mapRef.current = null
        fitToMarkersRef.current = null
      }
    })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [memories])

  // Close the photo popup when the user scrolls the map out of view.
  const mapSection = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!selected || !mapSection.current) return
    const el = mapSection.current
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) setSelected(null)
        }
      },
      { threshold: 0 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [selected])

  return (
    <>
      <div
        ref={mapSection}
        className="relative w-full h-[60vh] sm:h-[70vh] bg-zinc-950"
      >
        <div ref={mapContainer} className="absolute inset-0" />

        <button
          type="button"
          onClick={() => fitToMarkersRef.current?.()}
          aria-label="Recenter map"
          className="absolute bottom-3 left-3 z-[400] h-9 w-9 flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm border border-pink-400/30 text-pink-200 shadow-[0_0_16px_-4px_rgba(255,61,119,0.6)] hover:text-white hover:border-pink-400/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-[18px] w-[18px]"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
            <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
            <circle cx="12" cy="12" r="7" />
          </svg>
        </button>
      </div>

      {selected && (
        <PhotoModal
          imageUrl={selected.image_url}
          alt={selected.title}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function escapeAttr(s: string) {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}
