'use client'

import { useState, type CSSProperties } from 'react'
import type { GalleryPhoto } from '@/lib/supabase'
import { isVideoUrl } from '@/lib/media'
import PhotoModal from './PhotoModal'

export type GalleryPhotoWithUrl = GalleryPhoto & { image_url: string | null }

type Props = {
  photos: GalleryPhotoWithUrl[]
}

// Deterministic per-card tilt/vertical offset so the stack looks like a
// hand-arranged photo album instead of a uniform grid — fixed, not random,
// so server and client render the same layout.
const TILTS = [-5, 3, -4, 5, -3, 4, -6, 2, -2, 6, -4.5, 3.5]
const LIFTS = [0, 14, -8, 6, -12, 10, -6, 8, -10, 4, -14, 12]

type CardStyle = CSSProperties & { '--tilt': string; '--lift': string }

export default function GalleryGrid({ photos }: Props) {
  const [selected, setSelected] = useState<GalleryPhotoWithUrl | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="flex flex-wrap justify-center gap-y-12 px-2 py-4">
        {photos.map((photo, i) => {
          const style: CardStyle = {
            '--tilt': `${TILTS[i % TILTS.length]}deg`,
            '--lift': `${LIFTS[i % LIFTS.length]}px`,
          }
          return (
            <figure
              key={photo.id}
              style={style}
              className="photo-card group relative -mx-2 sm:-mx-3 w-36 sm:w-44 md:w-52 shrink-0 bg-[#faf5ea] p-2 pb-6 sm:p-2.5 sm:pb-8 rounded-[2px] shadow-[0_10px_24px_-8px_rgba(0,0,0,0.65)] hover:shadow-[0_28px_50px_-12px_rgba(255,61,119,0.5)]"
            >
              {photo.image_url ? (
                <button
                  type="button"
                  onClick={() => setSelected(photo)}
                  aria-label={photo.caption ?? 'Open photo'}
                  className="relative block w-full cursor-pointer focus:outline-none"
                >
                  {isVideoUrl(photo.image_url) ? (
                    <>
                      <video
                        src={photo.image_url}
                        muted
                        playsInline
                        preload="metadata"
                        className="aspect-square w-full object-cover"
                      />
                      <span className="absolute inset-0 flex items-center justify-center">
                        <span className="h-10 w-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
                          <svg
                            viewBox="0 0 24 24"
                            fill="white"
                            className="h-4 w-4 translate-x-[1px]"
                            aria-hidden="true"
                          >
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </span>
                      </span>
                    </>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photo.image_url}
                      alt={photo.caption ?? 'Memory photo'}
                      className={`aspect-square w-full ${
                        photo.image_path.endsWith('/6.jpg')
                          ? 'object-contain bg-black'
                          : 'object-cover'
                      }`}
                    />
                  )}
                </button>
              ) : (
                <div className="aspect-square w-full flex items-center justify-center bg-black/5 text-zinc-500 text-xs">
                  photo coming soon
                </div>
              )}
              {photo.caption && (
                <figcaption
                  style={{ fontFamily: 'var(--font-script), "Brush Script MT", cursive' }}
                  className="pt-2 text-center text-sm sm:text-base text-zinc-700 truncate"
                >
                  {photo.caption}
                </figcaption>
              )}
            </figure>
          )
        })}
      </div>

      {selected && (
        <PhotoModal
          imageUrl={selected.image_url}
          alt={selected.caption ?? 'Memory photo'}
          onClose={() => setSelected(null)}
          framed
          caption={selected.caption}
        />
      )}
    </>
  )
}
