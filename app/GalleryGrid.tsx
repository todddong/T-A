'use client'

import { useState } from 'react'
import type { GalleryPhoto } from '@/lib/supabase'
import PhotoModal from './PhotoModal'

export type GalleryPhotoWithUrl = GalleryPhoto & { image_url: string | null }

type Props = {
  photos: GalleryPhotoWithUrl[]
}

export default function GalleryGrid({ photos }: Props) {
  const [selected, setSelected] = useState<GalleryPhotoWithUrl | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {photos.map((photo) => (
          <figure
            key={photo.id}
            className="group relative rounded-2xl overflow-hidden border border-pink-400/15 bg-zinc-900/40 transition hover:border-pink-400/40 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,61,119,0.55)]"
          >
            {photo.image_url ? (
              <button
                type="button"
                onClick={() => setSelected(photo)}
                aria-label={photo.caption ?? 'Open photo'}
                className="block w-full h-72 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.image_url}
                  alt={photo.caption ?? 'Memory photo'}
                  className={`h-72 w-full transition duration-500 group-hover:scale-105 ${
                    photo.image_path.endsWith('/6.jpg')
                      ? 'object-contain bg-black'
                      : 'object-cover'
                  }`}
                />
              </button>
            ) : (
              <div className="h-72 w-full flex items-center justify-center text-pink-200/40 text-sm">
                photo coming soon
              </div>
            )}
            {photo.caption && (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-pink-50 pointer-events-none">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {selected && (
        <PhotoModal
          imageUrl={selected.image_url}
          alt={selected.caption ?? 'Memory photo'}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
