'use client'

import { useEffect, useRef, useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { CityInfo, Person } from '@/lib/supabase'

type RankedCity = CityInfo & { rank: number | null }

type Props = {
  person: Person
  label: string
  avatarSrc: string
  cities: CityInfo[]
  initialRanks: Record<string, number | null>
}

function keyOf(c: CityInfo) {
  return `${c.city}|${c.state}`
}

function displayName(c: CityInfo) {
  return `${c.city}, ${c.state}`
}

function buildOrder(cities: CityInfo[], ranks: Record<string, number | null>): RankedCity[] {
  const withRank = cities.map((c) => ({ ...c, rank: ranks[keyOf(c)] ?? null }))
  return withRank.sort((a, b) => {
    if (a.rank != null && b.rank != null) return a.rank - b.rank
    if (a.rank != null) return -1
    if (b.rank != null) return 1
    return displayName(a).localeCompare(displayName(b))
  })
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export default function CityRankings({ person, label, avatarSrc, cities, initialRanks }: Props) {
  const [items, setItems] = useState<RankedCity[]>(() => buildOrder(cities, initialRanks))
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [showHint, setShowHint] = useState(false)
  const hintRef = useRef<HTMLDivElement | null>(null)
  const hasUnranked = items.some((i) => i.rank == null)

  // The hint only ever reflects live state — if the last unranked city gets
  // ranked while the tooltip is open, close it along with the badge.
  useEffect(() => {
    if (!hasUnranked) setShowHint(false)
  }, [hasUnranked])

  useEffect(() => {
    if (!showHint) return
    const onClickAway = (e: MouseEvent) => {
      if (hintRef.current && !hintRef.current.contains(e.target as Node)) {
        setShowHint(false)
      }
    }
    const id = window.setTimeout(() => document.addEventListener('click', onClickAway), 0)
    return () => {
      window.clearTimeout(id)
      document.removeEventListener('click', onClickAway)
    }
  }, [showHint])

  // If the set of known cities changes (e.g. a new city's memories were
  // added and the page reloaded), fold in any new ones as unranked without
  // disturbing the current order of existing ones.
  useEffect(() => {
    setItems((prev) => {
      const prevKeys = new Set(prev.map(keyOf))
      const cityKeys = new Set(cities.map(keyOf))
      const kept = prev.filter((p) => cityKeys.has(keyOf(p)))
      const added = cities
        .filter((c) => !prevKeys.has(keyOf(c)))
        .map((c) => ({ ...c, rank: initialRanks[keyOf(c)] ?? null }))
      if (added.length === 0 && kept.length === prev.length) return prev
      return [...kept, ...added].sort((a, b) => {
        if (a.rank != null && b.rank != null) return a.rank - b.rank
        if (a.rank != null) return -1
        if (b.rank != null) return 1
        return displayName(a).localeCompare(displayName(b))
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cities])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  async function persist(newItems: RankedCity[]) {
    setSaveState('saving')
    try {
      const res = await fetch('/api/rankings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person,
          order: newItems.map((it) => ({ city: it.city, state: it.state })),
        }),
      })
      if (!res.ok) throw new Error('save failed')
      setSaveState('saved')
      window.setTimeout(() => setSaveState((s) => (s === 'saved' ? 'idle' : s)), 1500)
    } catch (err) {
      console.error('Failed to save ranking', err)
      setSaveState('error')
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => keyOf(i) === active.id)
      const newIndex = prev.findIndex((i) => keyOf(i) === over.id)
      if (oldIndex === -1 || newIndex === -1) return prev
      const reordered = arrayMove(prev, oldIndex, newIndex).map((it, idx) => ({
        ...it,
        rank: idx + 1,
      }))
      void persist(reordered)
      return reordered
    })
  }

  return (
    <div className="flex flex-col h-[45vh] lg:h-[70vh] lg:w-64 shrink-0 rounded-3xl overflow-hidden border border-pink-400/20 bg-zinc-950/60 shadow-[0_0_60px_-20px_rgba(255,61,119,0.6)]">
      <div className="px-4 py-3 border-b border-pink-400/10 flex items-center gap-2.5 shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarSrc}
          alt={label}
          className="h-8 w-8 rounded-full object-cover border border-pink-400/50 shrink-0"
        />
        <h3 className="font-sans font-semibold tracking-tight text-lg text-white">
          City Rankings
        </h3>

        {hasUnranked && (
          <div className="relative ml-auto" ref={hintRef}>
            <button
              type="button"
              onClick={() => setShowHint((s) => !s)}
              aria-label="You have unranked cities"
              className="h-5 w-5 rounded-full bg-red-500 text-white text-[11px] font-bold leading-5 text-center ring-2 ring-black/40 shadow-[0_0_8px_-1px_rgba(239,68,68,0.9)] animate-pulse hover:animate-none focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-400"
            >
              !
            </button>
            {showHint && (
              <div className="absolute right-0 top-7 z-30 w-48 rounded-lg border border-pink-400/30 bg-zinc-900 px-3 py-2 text-xs leading-snug text-white/90 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.7)]">
                Drag to rank your unranked cities!
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-2 min-h-0">
        <DndContext
          id={`city-ranking-${person}`}
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items.map(keyOf)} strategy={verticalListSortingStrategy}>
            <ul className="flex flex-col gap-1.5">
              {items.map((item) => (
                <SortableCityRow key={keyOf(item)} id={keyOf(item)} item={item} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      <div className="px-4 py-2 border-t border-pink-400/10 shrink-0 h-8 flex items-center">
        <span className="text-xs text-white/40">
          {saveState === 'saving' && 'Saving…'}
          {saveState === 'saved' && 'Saved'}
          {saveState === 'error' && (
            <span className="text-red-300/80">Couldn&rsquo;t save — try again</span>
          )}
        </span>
      </div>
    </div>
  )
}

function SortableCityRow({ id, item }: { id: string; item: RankedCity }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 bg-white/5 border border-white/10 cursor-grab active:cursor-grabbing select-none touch-none transition-colors ${
        isDragging ? 'opacity-60 ring-2 ring-pink-400/60 z-10' : ''
      }`}
    >
      <span
        className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
          item.rank != null ? 'bg-pink-500/80 text-white' : 'bg-white/10 text-white/30'
        }`}
      >
        {item.rank ?? '–'}
      </span>
      <span className="text-sm text-white/90 truncate">{displayName(item)}</span>
    </li>
  )
}
