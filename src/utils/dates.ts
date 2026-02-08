export const DEMO_TODAY = new Date('2025-02-07T12:00:00')

const dateFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
})

const timeFormatter = new Intl.DateTimeFormat('en-CA', {
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

const monthYearFormatter = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: 'long',
})

const weekRangeFormatter = new Intl.DateTimeFormat('en-CA', {
  month: 'short',
  day: 'numeric',
})

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso))
}

export function formatTime(iso: string): string {
  return timeFormatter.format(new Date(iso))
}

export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso))
}

export function formatMonthYear(iso: string): string {
  return monthYearFormatter.format(new Date(iso))
}

export function formatWeekRange(startIso: string): string {
  const start = new Date(startIso)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  return `${weekRangeFormatter.format(start)}–${weekRangeFormatter.format(end)}`
}

export function isUpcoming(dateIso: string): boolean {
  return new Date(dateIso) > DEMO_TODAY
}

export function isPast(dateIso: string): boolean {
  return new Date(dateIso) <= DEMO_TODAY
}

export function isWithinDays(dateIso: string, days: number): boolean {
  const date = new Date(dateIso)
  const threshold = new Date(DEMO_TODAY)
  threshold.setDate(threshold.getDate() - days)
  return date >= threshold && date <= DEMO_TODAY
}

export function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() - day)
  d.setHours(0, 0, 0, 0)
  return d
}

export function isSameMonth(dateIso: string, reference: Date): boolean {
  const date = new Date(dateIso)
  return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear()
}
