'use client'

import { useState, useEffect, useRef } from 'react'
import { useTour } from '@/context/TourContext'

interface SpotlightRect {
  centerX: number
  centerY: number
  width: number
  height: number
}

function getTargetSpotlight(selector: string): SpotlightRect | null {
  const target = document.querySelector(selector)
  if (!target) return null
  const rect = target.getBoundingClientRect()
  const padding = 8
  return {
    centerX: rect.left + rect.width / 2,
    centerY: rect.top + rect.height / 2,
    width: rect.width + padding * 2,
    height: rect.height + padding * 2,
  }
}

export default function TourOverlay() {
  const { state, currentStep, skipTour } = useTour()
  const [spotlight, setSpotlight] = useState<SpotlightRect | null>(null)
  const pendingRef = useRef(false)

  // On step change: hold old position, let scroll finish, then update once
  useEffect(() => {
    if (!state.isActive || state.isTransitioning || !currentStep) return

    pendingRef.current = true

    const timer = setTimeout(() => {
      const rect = getTargetSpotlight(currentStep.targetSelector)
      if (rect) setSpotlight(rect)
      pendingRef.current = false
    }, 300)

    return () => {
      clearTimeout(timer)
      pendingRef.current = false
    }
  }, [state.isActive, state.isTransitioning, state.currentStepIndex, currentStep])

  // Keep spotlight in sync with resize/scroll after placement
  useEffect(() => {
    if (!state.isActive || !currentStep) return

    function handleUpdate() {
      if (pendingRef.current) return
      const rect = getTargetSpotlight(currentStep!.targetSelector)
      if (rect) setSpotlight(rect)
    }

    window.addEventListener('resize', handleUpdate)
    window.addEventListener('scroll', handleUpdate, true)
    return () => {
      window.removeEventListener('resize', handleUpdate)
      window.removeEventListener('scroll', handleUpdate, true)
    }
  }, [state.isActive, currentStep])

  if (!state.isActive) return null

  return (
    <div
      className="fixed inset-0 z-[9998]"
      onClick={skipTour}
    >
      {spotlight && (
        <div
          style={{
            position: 'fixed',
            left: spotlight.centerX,
            top: spotlight.centerY,
            width: spotlight.width,
            height: spotlight.height,
            transform: 'translate(-50%, -50%)',
            borderRadius: 12,
            boxShadow: '0 0 0 200vmax rgba(0,0,0,0.5)',
            pointerEvents: 'none',
            transition: 'left 200ms ease-in-out, top 200ms ease-in-out, width 200ms ease-in-out, height 200ms ease-in-out',
          }}
        />
      )}
    </div>
  )
}
