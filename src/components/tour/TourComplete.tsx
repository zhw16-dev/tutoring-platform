'use client'

import { useEffect, useRef } from 'react'
import { useTour } from '@/context/TourContext'

export default function TourComplete() {
  const { state, completeTour, restartTour } = useTour()
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (state.phase === 'complete') {
      primaryRef.current?.focus()
    }
  }, [state.phase])

  useEffect(() => {
    if (state.phase !== 'complete') return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') completeTour()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.phase, completeTour])

  if (state.phase !== 'complete') return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]" />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Tour complete"
        className="relative bg-white rounded-lg border border-[var(--color-border)] shadow-lg w-full max-w-md mx-4 p-8 animate-[fadeIn_200ms_ease-out]"
        style={{ animation: 'tourModalIn 200ms ease-out' }}
      >
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
          That&apos;s the Full Loop
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">
          From student booking &rarr; tutor session logging &rarr; admin collections and payouts. This platform replaced spreadsheets, group chats, and manual e-transfer tracking for a network of 10+ tutors and 100+ students.
        </p>

        <div className="space-y-3">
          <button
            ref={primaryRef}
            onClick={completeTour}
            className="w-full bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Explore Freely
          </button>
          <button
            onClick={restartTour}
            className="w-full text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors py-2"
          >
            Restart Tour
          </button>
          <a
            href="https://wzhai.vercel.app/tutoring-platform"
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors py-2"
          >
            View the Case Study &rarr;
          </a>
        </div>
      </div>
    </div>
  )
}
