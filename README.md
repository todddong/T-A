# One Month With You — CMU Relationship Map

A romantic, interactive Next.js site that maps your favorite places around CMU /
Pittsburgh. Star-shaped pins open memory popups with photos and captions, and
there's a separate gallery section for extra photos. All content (memories +
photos) is stored in **Supabase**.

## Stack

- Next.js 16 (App Router) + React 19
- Tailwind CSS v4
- Leaflet + OpenStreetMap (CartoDB dark tiles) — no API key required
- Supabase for the memory data + photo storage

## 1. Configure environment variables

Create / edit `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://zrmvlvasfbykrnmfhczh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_46oe__aij27mbJLjuJPLhw_7EnMN-Xx
```

The Supabase values above point at the project that already has the
`relationship_memories` and `relationship_gallery` tables seeded. No
map token is needed — tiles come from free OpenStreetMap / CartoDB.

## 2. Install and run

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## 3. Add your photos to Supabase Storage

All photos live in the public `images` bucket on Supabase. The seed memories
expect photos at the paths below — upload your real photos to these paths (or
update the `image_path` column in the `relationship_memories` /
`relationship_gallery` tables to point at whatever paths you upload to).

In the Supabase dashboard → Storage → `images`:

```
relationship-map/
  photos/
    cut.jpg
    porch.jpg
    park.jpg
    coffee.jpg
  gallery/
    photo1.jpg
    photo2.jpg
    photo3.jpg
```

You can also upload directly from the Supabase MCP/SQL editor.

## 4. Add or edit memories

The data lives in three tables in Supabase:

- `public.relationship_memories` — pins on the map
  - `title`, `location`, `caption`, `image_path`, `lng`, `lat`, `order_index`,
    `city`, `state`, optional `happened_on`
  - **`city`/`state` are required** — they're what drives the two ranking
    lists next to the map. Use the city/state the pin should be grouped
    under. Adding memories for a brand-new city automatically makes that
    city show up (unranked) in both ranking lists — no code changes needed.
  - Keep `city`/`state` to **big cities only** (e.g. a memory in Cary, NC
    or Georgetown, DC should still be tagged `Raleigh`/`NC` or
    `Washington`/`DC`) rather than every small suburb/neighborhood — this
    keeps the ranking lists to a manageable set of cities to actually rank.
- `public.relationship_gallery` — bonus photos in the gallery grid
  - `image_path`, `caption`, `order_index`
- `public.relationship_city_rankings` — Todd's and Annissa's drag-to-rank
  order for each city (`person`, `city`, `state`, `rank`). Written
  automatically by the app via `/api/rankings`; you shouldn't need to edit
  this table by hand.

Add rows via the Supabase dashboard or SQL — the site re-fetches every 60s
(`revalidate = 60` in `app/page.tsx`).

## 5. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it on <https://vercel.com>.
3. In the project settings, add the two environment variables from step 1.
4. Deploy and share the live link. ❤️

## Project structure

```
app/
  layout.tsx          # global metadata, romantic background
  page.tsx            # server component — fetches memories + gallery + rankings
  MapView.tsx         # client — Leaflet map, star pins, memory modal
  CityRankings.tsx     # client — draggable per-person city ranking list
  api/rankings/route.ts # server route — saves ranking order (service role)
  FloatingHearts.tsx  # client — ambient floating hearts/sparkles
  globals.css         # romantic theme + star pin animations
lib/
  supabase.ts         # Supabase client + storage URL helper + types
  supabase-admin.ts   # server-only Supabase client (service role key)
```
