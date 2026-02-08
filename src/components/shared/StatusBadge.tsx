'use client'

const STATUS_STYLES: Record<string, string> = {
  completed: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  scheduled: 'bg-[var(--color-accent-light)] text-[var(--color-accent)]',
  cancelled: 'bg-gray-100 text-gray-500',
  'no-show': 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
  paid: 'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  owing: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  overdue: 'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  pending: 'bg-gray-100 text-gray-500',
}

const STATUS_LABELS: Record<string, string> = {
  completed: 'Completed',
  scheduled: 'Scheduled',
  cancelled: 'Cancelled',
  'no-show': 'No Show',
  paid: 'Paid',
  owing: 'Owing',
  overdue: 'Overdue',
  pending: 'Pending',
}

interface StatusBadgeProps {
  status: string
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-500'
  const label = STATUS_LABELS[status] ?? status

  return (
    <span className={`${style} text-xs font-medium px-2.5 py-1 rounded-full inline-block`}>
      {label}
    </span>
  )
}
