'use client'

interface MetricCardProps {
  label: string
  value: string | number
  accent?: 'default' | 'warning' | 'success'
}

export default function MetricCard({ label, value, accent = 'default' }: MetricCardProps) {
  const valueColor =
    accent === 'warning'
      ? 'text-[var(--color-warning)]'
      : accent === 'success'
        ? 'text-[var(--color-success)]'
        : 'text-[var(--color-text-primary)]'

  return (
    <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
      <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-2xl font-semibold mt-2 ${valueColor}`}>
        {value}
      </p>
    </div>
  )
}
