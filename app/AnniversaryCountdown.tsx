'use client'

import { useEffect, useState } from 'react'

// Relationship start date. Anniversaries land on the 30th of each month
// (falling back to the month's last day when it's shorter) until a full
// year has passed, after which milestones switch to yearly on April 30.
const START = new Date(2026, 3, 30, 0, 0, 0, 0)
const START_DAY = START.getDate()

function monthAnniversary(year: number, month: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate()
  return new Date(year, month, Math.min(START_DAY, lastDay), 0, 0, 0, 0)
}

function nextMonthAnniversary(from: Date): Date {
  let year = from.getFullYear()
  let month = from.getMonth()
  let next = monthAnniversary(year, month)
  if (next <= from) {
    month += 1
    if (month > 11) {
      month = 0
      year += 1
    }
    next = monthAnniversary(year, month)
  }
  return next
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth())
}

function yearAnniversary(years: number): Date {
  return new Date(START.getFullYear() + years, START.getMonth(), START.getDate(), 0, 0, 0, 0)
}

function nextYearAnniversary(from: Date): { date: Date; years: number } {
  let years = 1
  let date = yearAnniversary(years)
  while (date <= from) {
    years += 1
    date = yearAnniversary(years)
  }
  return { date, years }
}

type Milestone = {
  date: Date
  label: string
}

// Before the first full year, count down in months; after that, the
// milestone becomes the next full-year anniversary.
function nextMilestone(now: Date): Milestone {
  const monthCandidate = nextMonthAnniversary(now)
  const monthsIn = monthsBetween(START, monthCandidate)
  if (monthsIn < 12) {
    return { date: monthCandidate, label: `${monthsIn} month` }
  }
  const { date, years } = nextYearAnniversary(now)
  return { date, label: `${years} year` }
}

type TimeLeft = {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function getTimeLeft(target: Date, now: Date): TimeLeft {
  const diff = Math.max(0, target.getTime() - now.getTime())
  const totalSeconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

const UNITS: { key: keyof TimeLeft; label: string }[] = [
  { key: 'days', label: 'days' },
  { key: 'hours', label: 'hours' },
  { key: 'minutes', label: 'min' },
  { key: 'seconds', label: 'sec' },
]

export default function AnniversaryCountdown() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  // Avoid a server/client mismatch: render nothing for the ticking numbers
  // until we're mounted on the client.
  const milestone = now ? nextMilestone(now) : null
  const timeLeft = milestone && now ? getTimeLeft(milestone.date, now) : null

  return (
    <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 flex flex-col items-center">
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-pink-400/30 bg-black/50 backdrop-blur-sm px-2.5 pt-3.5 pb-2 shadow-[0_0_16px_-4px_rgba(255,61,119,0.7)]">
        <p
          style={{ fontFamily: 'var(--font-script), "Brush Script MT", cursive' }}
          className="text-xs sm:text-sm text-pink-100 whitespace-nowrap text-center leading-tight"
        >
          {milestone ? milestone.label : '…'}
        </p>

        <div className="flex gap-1">
          {UNITS.map(({ key, label }) => (
            <div
              key={key}
              className="flex flex-col items-center justify-center gap-0.5 rounded-md border border-pink-400/15 bg-black/30 px-1.5 py-1 min-w-[32px]"
            >
              <span className="font-mono tabular-nums text-sm font-semibold text-white drop-shadow-[0_0_6px_rgba(255,61,119,0.6)]">
                {timeLeft ? String(timeLeft[key]).padStart(2, '0') : '--'}
              </span>
              <span className="text-[7px] uppercase tracking-widest text-pink-200/70">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
