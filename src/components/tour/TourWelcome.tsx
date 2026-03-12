'use client'

import { useEffect, useRef } from 'react'
import { useTour } from '@/context/TourContext'

export default function TourWelcome() {
  const { state, startTour, skipTour } = useTour()
  const primaryRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (state.phase === 'welcome') {
      primaryRef.current?.focus()
    }
  }, [state.phase])

  // Focus trap
  useEffect(() => {
    if (state.phase !== 'welcome') return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') skipTour()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.phase, skipTour])

  if (state.phase !== 'welcome') return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-[fadeIn_150ms_ease-out]" />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Welcome to the guided tour"
        className="relative bg-white rounded-lg border border-[var(--color-border)] shadow-lg w-full max-w-md mx-4 p-8 animate-[fadeIn_200ms_ease-out]"
        style={{ transform: 'scale(1)', animation: 'tourModalIn 200ms ease-out' }}
      >
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">
          Welcome to Will&apos;s Tutoring
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-8">
          This platform manages the end-to-end tutoring workflow &mdash; from student booking to tutor payouts. Take a 60-second guided tour across all three roles, or jump in and explore on your own.
        </p>

        <div className="space-y-3">
          <button
            ref={primaryRef}
            onClick={startTour}
            className="w-full bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-3 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Take the Guided Tour
          </button>
          <button
            onClick={skipTour}
            className="w-full text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors py-2"
          >
            Explore on My Own
          </button>
        </div>
      </div>
    </div>
  )
}
