'use client'

import { useTourSafe } from '@/components/tour/useTourSafe'

export default function TourRestartButton() {
  const tour = useTourSafe()

  if (!tour) return null

  const { state, restartTour, showWelcome } = tour

  // Don't show during active tour or modals
  if (state.isActive || state.phase === 'welcome' || state.phase === 'complete') return null

  return (
    <button
      onClick={() => {
        sessionStorage.removeItem('tour-completed')
        if (state.hasSeenWelcome) {
          restartTour()
        } else {
          showWelcome()
        }
      }}
      className="text-[var(--color-text-tertiary)] text-sm font-medium px-2 py-1.5 rounded-lg hover:bg-[var(--color-bg)] hover:text-[var(--color-text-secondary)] transition-colors"
      title="Restart guided tour"
    >
      Tour
    </button>
  )
}
