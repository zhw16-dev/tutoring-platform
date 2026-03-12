'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTour } from '@/context/TourContext'

interface SpotlightRect {
  x: number
  y: number
  width: number
  height: number
}

export default function TourOverlay() {
  const { state, currentStep, skipTour } = useTour()
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)

  const calculateSpotlight = useCallback(() => {
    if (!currentStep) {
      setSpotlight(null)
      return
    }

    const target = document.querySelector(currentStep.targetSelector)
    if (!target) {
      setSpotlight(null)
      return
    }

    const rect = target.getBoundingClientRect()
    const padding = 8

    setSpotlight({
      x: rect.left - padding,
      y: rect.top - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    })
  }, [currentStep])

  useEffect(() => {
    if (!state.isActive || state.isTransitioning) return

    const timer = setTimeout(calculateSpotlight, 250)
    return () => clearTimeout(timer)
  }, [state.isActive, state.isTransitioning, state.currentStepIndex, calculateSpotlight])

  // Recalculate on resize/scroll
  useEffect(() => {
    if (!state.isActive) return
    let timeout: NodeJS.Timeout
    function handleResize() {
      clearTimeout(timeout)
      timeout = setTimeout(calculateSpotlight, 100)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('scroll', handleResize, true)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('scroll', handleResize, true)
      clearTimeout(timeout)
    }
  }, [state.isActive, calculateSpotlight])

  if (!state.isActive) return null

  return (
    <div
      className="fixed inset-0 z-[9998]"
      onClick={skipTour}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ pointerEvents: 'none' }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.x}
                y={spotlight.y}
                width={spotlight.width}
                height={spotlight.height}
                rx="12"
                ry="12"
                fill="black"
                style={{ transition: 'all 200ms ease-in-out' }}
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-spotlight-mask)"
          style={{ pointerEvents: 'auto' }}
        />
      </svg>
    </div>
  )
}
