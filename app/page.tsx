import { supabase, getPhotoUrl, type Memory, type GalleryPhoto } from '@/lib/supabase'
import MapView from './MapView'
import FloatingHearts from './FloatingHearts'

export const revalidate = 60

async function getMemories(): Promise<Memory[]> {
  const { data, error } = await supabase
    .from('relationship_memories')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Failed to load memories:', error.message)
    return []
  }
  return (data ?? []) as Memory[]
}

async function getGallery(): Promise<GalleryPhoto[]> {
  const { data, error } = await supabase
    .from('relationship_gallery')
    .select('*')
    .order('order_index', { ascending: true })

  if (error) {
    console.error('Failed to load gallery:', error.message)
    return []
  }
  return (data ?? []) as GalleryPhoto[]
}

export default async function Home() {
  const [memories, gallery] = await Promise.all([getMemories(), getGallery()])

  // Pre-resolve public photo URLs on the server so the client never has to
  // know about Supabase storage paths.
  const memoriesWithUrls = memories.map((m) => ({
    ...m,
    image_url: getPhotoUrl(m.image_path),
  }))

  const galleryWithUrls = gallery.map((g) => ({
    ...g,
    image_url: getPhotoUrl(g.image_path),
  }))

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <FloatingHearts />

      <section className="relative z-10 flex flex-col items-center justify-center pt-20 pb-12 px-6 text-center">
        <p className="uppercase tracking-[0.4em] text-xs text-accent-soft/80 mb-4">
          Carnegie Mellon · Pittsburgh
        </p>
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-semibold bg-gradient-to-b from-white via-pink-100 to-pink-300 bg-clip-text text-transparent leading-tight">
          One Month With You
        </h1>
        <p className="mt-6 max-w-xl text-pink-100/80 text-lg">
          A little map of the places that made this month feel like home.
          Tap a star to relive a memory.
        </p>
      </section>

      <section className="relative z-10 px-4 sm:px-6 max-w-6xl mx-auto w-full">
        <div className="rounded-3xl overflow-hidden border border-pink-400/20 shadow-[0_0_60px_-20px_rgba(255,61,119,0.6)]">
          <MapView memories={memoriesWithUrls} />
        </div>
        <p className="text-center text-xs text-pink-100/50 mt-3">
          {memoriesWithUrls.length} memories pinned · scroll & pinch to explore
        </p>
      </section>

      <section className="relative z-10 py-20 px-6 max-w-6xl mx-auto w-full">
        <h2 className="text-4xl sm:text-5xl font-semibold text-center bg-gradient-to-b from-white to-pink-200 bg-clip-text text-transparent mb-3">
          More Memories
        </h2>
        <p className="text-center text-pink-100/70 mb-10">
          A few more moments I never want to forget.
        </p>

        {galleryWithUrls.length === 0 ? (
          <p className="text-center text-pink-100/50">
            No photos in the gallery yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            {galleryWithUrls.map((photo) => (
              <figure
                key={photo.id}
                className="group relative rounded-2xl overflow-hidden border border-pink-400/15 bg-zinc-900/40 transition hover:border-pink-400/40 hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(255,61,119,0.55)]"
              >
                {photo.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo.image_url}
                    alt={photo.caption ?? 'Memory photo'}
                    className="h-72 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-72 w-full flex items-center justify-center text-pink-200/40 text-sm">
                    photo coming soon
                  </div>
                )}
                {photo.caption && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-sm text-pink-50">
                    {photo.caption}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>

      <footer className="relative z-10 py-10 text-center text-xs text-pink-100/40">
        made with love · one month, infinite more to go
      </footer>
    </main>
  )
}
