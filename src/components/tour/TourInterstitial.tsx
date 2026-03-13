'use client'

import { useTour } from '@/context/TourContext'
import { getPhaseLabel } from './tourSteps'

export default function TourInterstitial() {
  const { state } = useTour()

  if (!state.isTransitioning || !state.isActive) return null

  const label = state.transitionTarget ? getPhaseLabel(state.transitionTarget) : ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
      <div
        className="bg-white rounded-lg border border-[var(--color-border)] shadow-lg px-8 py-6 text-center"
        style={{ animation: 'tourModalIn 200ms ease-out' }}
      >
        <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide mb-1">
          Switching to
        </p>
        <p className="text-lg font-semibold text-[var(--color-text-primary)]">
          {label}
        </p>
      </div>
    </div>
  )
}
