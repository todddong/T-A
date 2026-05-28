'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

const SEEN_KEY = 'loveEnvelopeSeen'
const CLOSE_ANIM_MS = 200

const seenListeners = new Set<() => void>()

function subscribeSeen(callback: () => void) {
  seenListeners.add(callback)
  return () => {
    seenListeners.delete(callback)
  }
}

function getSeen() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === 'true'
  } catch {
    return false
  }
}

// On the server we treat the message as already seen so the badge is hidden
// in initial HTML; the client snapshot takes over after hydration.
function getSeenOnServer() {
  return true
}

function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, 'true')
  } catch {}
  seenListeners.forEach((cb) => cb())
}

export default function LoveEnvelope() {
  const seen = useSyncExternalStore(subscribeSeen, getSeen, getSeenOnServer)
  const showBadge = !seen

  // The letter has its own lifecycle so the close animation has time to play
  // before the element unmounts.
  const [mounted, setMounted] = useState(false)
  const [closing, setClosing] = useState(false)
  const closeTimerRef = useRef<number | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  const openLetter = () => {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setMounted(true)
    setClosing(false)
    if (showBadge) markSeen()
  }

  const closeLetter = () => {
    if (!mounted || closing) return
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
      closeTimerRef.current = null
    }, CLOSE_ANIM_MS)
  }

  const handleToggle = () => {
    if (mounted && !closing) {
      closeLetter()
    } else {
      openLetter()
    }
  }

  useEffect(() => {
    if (!mounted || closing) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLetter()
    }
    const onClickAway = (e: MouseEvent) => {
      const target = e.target as Node | null
      if (!target) return
      if (popupRef.current?.contains(target)) return
      if (buttonRef.current?.contains(target)) return
      closeLetter()
    }

    document.addEventListener('keydown', onKey)
    const id = window.setTimeout(() => {
      document.addEventListener('click', onClickAway)
    }, 0)

    return () => {
      window.clearTimeout(id)
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('click', onClickAway)
    }
    // closeLetter is stable enough for this scope; depending on it would
    // re-attach handlers unnecessarily.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, closing])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  // Clean up the previous localStorage-based "seen" flag so it doesn't sit
  // around indefinitely after switching to per-session persistence.
  useEffect(() => {
    try {
      localStorage.removeItem(SEEN_KEY)
    } catch {}
  }, [])

  const isOpenForAria = mounted && !closing

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label={showBadge ? 'Love envelope, 1 unread message' : 'Love envelope'}
        aria-expanded={isOpenForAria}
        className={`fixed top-4 right-4 z-50 h-14 w-14 flex items-center justify-center rounded-full bg-black/40 backdrop-blur-sm border border-pink-400/40 text-pink-300 shadow-[0_0_22px_-4px_rgba(255,61,119,0.7)] hover:text-pink-200 hover:border-pink-400/70 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400 ${
          showBadge ? 'envelope-shake' : ''
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
          aria-hidden="true"
        >
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3.5 7l8 6.5a1 1 0 0 0 1.2 0L20.5 7" />
          <path
            d="M12 11.6c-1.2-1.4-3.2-1.2-3.8.4-.6 1.6 1 3 3.8 4.5 2.8-1.5 4.4-2.9 3.8-4.5-.6-1.6-2.6-1.8-3.8-.4z"
            fill="currentColor"
            stroke="none"
          />
        </svg>
        {showBadge && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -left-1 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-semibold leading-5 text-center ring-2 ring-black/60 shadow-[0_0_8px_-1px_rgba(239,68,68,0.9)]"
          >
            1
          </span>
        )}
      </button>

      {mounted && (
        <div
          ref={popupRef}
          role="dialog"
          aria-label="Message"
          className={`fixed top-20 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-md border border-amber-200/50 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6),0_8px_20px_rgba(0,0,0,0.3)] ${
            closing ? 'letter-close' : 'letter-open'
          }`}
          style={{ backgroundColor: '#fdf6e8' }}
        >
          <button
            type="button"
            onClick={closeLetter}
            aria-label="Close"
            className="absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-full text-red-600 hover:text-red-700 hover:bg-red-100/60 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <div className="px-8 pt-12 pb-20 flex flex-col items-center gap-4">
            <p
              style={{
                fontFamily: 'var(--font-script), "Brush Script MT", cursive',
                color: '#2a1f1a',
              }}
              className="text-3xl text-center leading-tight"
            >
              happy 1 month
            </p>
            <p
              style={{
                fontFamily: 'var(--font-script), "Brush Script MT", cursive',
                color: '#2a1f1a',
              }}
              className="text-xl text-center leading-snug"
            >
              I miss you a lot and look forward to spending more time with you and making more memories together. I can&apos;t wait to try every matcha spot with you in Pittsburgh next year.
            </p>
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="mt-2 h-7 w-7 text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.35)]"
            >
              <path d="M12 21s-7.5-4.8-9.5-9.5C1 7.5 4.3 4 7.7 4c1.9 0 3.4 1 4.3 2.3C12.9 5 14.4 4 16.3 4c3.4 0 6.7 3.5 5.2 7.5C19.5 16.2 12 21 12 21z" />
            </svg>
          </div>
        </div>
      )}
    </>
  )
}
