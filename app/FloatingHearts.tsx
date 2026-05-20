'use client'

const HEART_EMOJIS = ['💗', '💖', '💕', '🌸', '✨']

// Deterministic pseudo-random so positions look organic but render identically
// on server and client (no hydration mismatch, no effect / setState dance).
function hash(seed: number) {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Round to fixed precision so server and client emit identical strings
// (React's number-to-string formatting can differ between Node and the
// browser at full float precision, causing hydration mismatches).
const r2 = (n: number) => Math.round(n * 100) / 100

const HEARTS = Array.from({ length: 14 }).map((_, i) => ({
  id: i,
  left: r2(hash(i + 1) * 100),
  delay: r2(hash(i + 21) * 10),
  duration: r2(12 + hash(i + 41) * 14),
  size: r2(16 + hash(i + 61) * 14),
  emoji: HEART_EMOJIS[Math.floor(hash(i + 81) * HEART_EMOJIS.length)],
}))

export default function FloatingHearts() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
    >
      {HEARTS.map((h) => (
        <span
          key={h.id}
          className="floating-heart"
          style={{
            left: `${h.left}%`,
            animationDelay: `${h.delay}s`,
            animationDuration: `${h.duration}s`,
            fontSize: `${h.size}px`,
          }}
        >
          {h.emoji}
        </span>
      ))}
    </div>
  )
}
