'use client'

import { useContext } from 'react'
import { TourContext } from '@/context/TourContext'

// Safe hook that returns null if not inside TourProvider.
// Use this in components that may render outside the TourProvider
// (e.g., Header/RoleSwitcher which render before TourProvider wraps them).
export function useTourSafe() {
  return useContext(TourContext)
}
