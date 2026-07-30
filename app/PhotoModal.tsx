'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { isVideoUrl } from '@/lib/media'

type Props = {
  imageUrl: string | null
  alt: string
  onClose: () => void
  /** Keep the cream polaroid mat around the photo, matching the gallery album. */
  framed?: boolean
  caption?: string | null
}

const CLOSE_ANIM_MS = 200

export default function PhotoModal({ imageUrl, alt, onClose, framed, caption }: Props) {
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
        className={`relative max-w-md w-full pointer-events-auto ${
          closing ? 'photo-close' : 'photo-open'
        } ${
          framed
            ? 'bg-[#faf5ea] p-3 pb-8 rounded-[2px] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.75)]'
            : 'rounded-3xl overflow-hidden border border-pink-400/30 shadow-[0_20px_80px_-10px_rgba(255,61,119,0.6)]'
        }`}
      >
        <button
          onClick={requestClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-[10000] h-9 w-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center text-lg backdrop-blur transition"
        >
          ×
        </button>

        <div className={framed ? 'overflow-hidden' : undefined}>
          {imageUrl ? (
            isVideoUrl(imageUrl) ? (
              <video
                src={imageUrl}
                controls
                playsInline
                className="block w-full h-auto max-h-[75vh] bg-black"
              >
                <track kind="captions" />
              </video>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={alt}
                className="block w-full h-auto max-h-[75vh] object-contain bg-black"
              />
            )
          ) : (
            <div className="w-full h-72 flex items-center justify-center bg-zinc-800 text-pink-200/60 text-sm">
              photo coming soon
            </div>
          )}
        </div>

        {framed && caption && (
          <p
            style={{ fontFamily: 'var(--font-script), "Brush Script MT", cursive' }}
            className="pt-3 text-center text-lg text-zinc-700"
          >
            {caption}
          </p>
        )}
      </div>
    </div>,
    document.body,
  )
}
