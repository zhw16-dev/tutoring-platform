'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useTour } from '@/context/TourContext'
import { getPhaseLabel, getStepInPhase } from './tourSteps'

export default function TourTooltip() {
  const { state, currentStep, nextStep, prevStep, skipTour } = useTour()
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const [arrowSide, setArrowSide] = useState<'top' | 'bottom' | 'left' | 'right'>('top')
  const [visible, setVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const calculatePosition = useCallback(() => {
    if (!currentStep) return

    const target = document.querySelector(currentStep.targetSelector)
    if (!target) {
      console.warn(`[Tour] Target not found: ${currentStep.targetSelector}`)
      nextStep()
      return
    }

    const rect = target.getBoundingClientRect()
    const tooltipEl = tooltipRef.current
    const tooltipWidth = tooltipEl?.offsetWidth || 340
    const tooltipHeight = tooltipEl?.offsetHeight || 200
    const padding = 16
    const arrowOffset = 12

    let top = 0
    let left = 0
    let arrow: 'top' | 'bottom' | 'left' | 'right' = 'top'

    const isMobile = window.innerWidth < 640

    // On mobile, always position below or above
    let preferredPosition = currentStep.position
    if (isMobile && (preferredPosition === 'left' || preferredPosition === 'right')) {
      preferredPosition = 'bottom'
    }

    switch (preferredPosition) {
      case 'bottom':
        top = rect.bottom + arrowOffset
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        arrow = 'top'
        // Flip to top if overflows bottom
        if (top + tooltipHeight > window.innerHeight - padding) {
          top = rect.top - tooltipHeight - arrowOffset
          arrow = 'bottom'
        }
        break
      case 'top':
        top = rect.top - tooltipHeight - arrowOffset
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        arrow = 'bottom'
        // Flip to bottom if overflows top
        if (top < padding) {
          top = rect.bottom + arrowOffset
          arrow = 'top'
        }
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - tooltipWidth - arrowOffset
        arrow = 'right'
        if (left < padding) {
          top = rect.bottom + arrowOffset
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          arrow = 'top'
        }
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + arrowOffset
        arrow = 'left'
        if (left + tooltipWidth > window.innerWidth - padding) {
          top = rect.bottom + arrowOffset
          left = rect.left + rect.width / 2 - tooltipWidth / 2
          arrow = 'top'
        }
        break
    }

    // Clamp horizontal
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
    // Clamp vertical
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding))

    setPosition({ top, left })
    setArrowSide(arrow)
  }, [currentStep, nextStep])

  useEffect(() => {
    if (!currentStep || state.isTransitioning) {
      setVisible(false)
      return
    }

    setVisible(false)

    const showTimer = setTimeout(() => {
      const target = document.querySelector(currentStep.targetSelector)
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }

      // Wait a beat for scroll to finish, then position
      setTimeout(() => {
        calculatePosition()
        setVisible(true)
      }, 150)
    }, 100)

    return () => clearTimeout(showTimer)
  }, [currentStep, state.isTransitioning, calculatePosition])

  // Recalculate on resize
  useEffect(() => {
    if (!visible) return
    let timeout: NodeJS.Timeout
    function handleResize() {
      clearTimeout(timeout)
      timeout = setTimeout(calculatePosition, 100)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeout)
    }
  }, [visible, calculatePosition])

  // Keyboard navigation
  useEffect(() => {
    if (!state.isActive) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') skipTour()
      if (e.key === 'ArrowRight' || e.key === 'Enter') nextStep()
      if (e.key === 'ArrowLeft') prevStep()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.isActive, nextStep, prevStep, skipTour])

  if (!currentStep || !position || !state.isActive) return null

  const { current, total } = getStepInPhase(state.currentStepIndex)
  const phaseLabel = getPhaseLabel(currentStep.phase)
  const isFirstStep = state.currentStepIndex === 0

  const arrowClasses: Record<string, string> = {
    top: 'left-1/2 -translate-x-1/2 -top-2 border-l-transparent border-r-transparent border-t-transparent border-b-white',
    bottom: 'left-1/2 -translate-x-1/2 -bottom-2 border-l-transparent border-r-transparent border-b-transparent border-t-white',
    left: 'top-1/2 -translate-y-1/2 -left-2 border-t-transparent border-b-transparent border-l-transparent border-r-white',
    right: 'top-1/2 -translate-y-1/2 -right-2 border-t-transparent border-b-transparent border-r-transparent border-l-white',
  }

  return (
    <div
      ref={tooltipRef}
      role="dialog"
      aria-label={currentStep.title}
      className="fixed z-[9999] w-[340px] max-w-[90vw] bg-white rounded-xl border border-[var(--color-border)] p-5"
      style={{
        top: position.top,
        left: position.left,
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(4px)',
        transition: 'opacity 150ms ease-out, transform 150ms ease-out',
      }}
    >
      {/* Arrow */}
      <div
        className={`absolute w-0 h-0 border-[8px] ${arrowClasses[arrowSide]}`}
      />

      {/* Step counter */}
      <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wide mb-3">
        Step {current} of {total} &middot; {phaseLabel}
      </p>

      {/* Content */}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">
        {currentStep.title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-5">
        {currentStep.body}
      </p>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={prevStep}
          disabled={isFirstStep}
          className={`text-sm font-medium transition-colors ${
            isFirstStep
              ? 'text-[var(--color-text-tertiary)] cursor-not-allowed'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          &larr; Back
        </button>
        <button
          onClick={skipTour}
          className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Skip Tour
        </button>
        <button
          onClick={nextStep}
          className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Next &rarr;
        </button>
      </div>
    </div>
  )
}
