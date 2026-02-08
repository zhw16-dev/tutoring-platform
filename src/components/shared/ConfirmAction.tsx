'use client'

interface ConfirmActionProps {
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmAction({ message, onConfirm, onCancel }: ConfirmActionProps) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-[var(--color-text-secondary)]">{message}</span>
      <button
        onClick={onConfirm}
        className="text-[var(--color-error)] font-medium hover:underline"
      >
        Yes, cancel
      </button>
      <button
        onClick={onCancel}
        className="text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)]"
      >
        No, keep it
      </button>
    </div>
  )
}
