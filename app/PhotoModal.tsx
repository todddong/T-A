'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

type Props = {
  imageUrl: string | null
  alt: string
  onClose: () => void
}

const CLOSE_ANIM_MS = 200

export default function PhotoModal({ imageUrl, alt, onClose }: Props) {
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const modalRef = useRef<HTMLDivElement | null>(null)

  const requestClose = () => {
    if (closing) return
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      onClose()
    }, CLOSE_ANIM_MS)
  }

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
    // requestClose only depends on closing, which we check inside it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Close on any click that lands outside the photo. We attach on the next
  // tick so the same click that opened the modal doesn't immediately close it.
  useEffect(() => {
    const onClickAway = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (modalRef.current && target && !modalRef.current.contains(target)) {
        requestClose()
      }
    }
    const id = window.setTimeout(() => {
      document.addEventListener('click', onClickAway)
    }, 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onClickAway)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none"
      role="dialog"
      aria-modal="false"
      aria-label={alt}
    >
      <div
        ref={modalRef}
        className={`relative max-w-md w-full rounded-3xl overflow-hidden border border-pink-400/30 shadow-[0_20px_80px_-10px_rgba(255,61,119,0.6)] pointer-events-auto ${
          closing ? 'photo-close' : 'photo-open'
        }`}
      >
        <button
          onClick={requestClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-[10000] h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-lg backdrop-blur transition"
        >
          ×
        </button>

        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={alt}
            className="block w-full h-auto max-h-[80vh] object-contain bg-black"
          />
        ) : (
          <div className="w-full h-72 flex items-center justify-center bg-zinc-800 text-pink-200/60 text-sm">
            photo coming soon
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
