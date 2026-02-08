'use client'

interface EmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-sm text-[var(--color-text-secondary)]">{message}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-3 text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
        >
          {actionLabel} →
        </button>
      )}
    </div>
  )
}
