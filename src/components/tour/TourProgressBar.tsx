'use client'

import { useTour } from '@/context/TourContext'

export default function TourProgressBar() {
  const { state, totalSteps } = useTour()

  if (!state.isActive) return null

  const progress = ((state.currentStepIndex + 1) / totalSteps) * 100

  return (
    <div className="fixed top-0 left-0 right-0 z-[10000] h-[3px] bg-[var(--color-border)]">
      <div
        className="h-full bg-[var(--color-accent)] transition-all duration-300 ease-in-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}
