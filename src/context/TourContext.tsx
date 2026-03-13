'use client'

import { createContext, useContext, useReducer, useCallback, useEffect, ReactNode } from 'react'
import { TOUR_STEPS, TOTAL_STEPS } from '@/components/tour/tourSteps'
import { trackTourEvent } from '@/components/tour/tourAnalytics'
import { Role } from '@/types'

type TourPhase = 'welcome' | 'student' | 'tutor' | 'admin' | 'complete' | null

interface TourState {
  isActive: boolean
  currentStepIndex: number
  phase: TourPhase
  hasSeenWelcome: boolean
  isTransitioning: boolean
  transitionTarget: TourPhase
}

type TourAction =
  | { type: 'SHOW_WELCOME' }
  | { type: 'START_TOUR' }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'RESTART_TOUR' }
  | { type: 'SET_TRANSITIONING'; payload: boolean; target?: TourPhase }
  | { type: 'CANCEL_TOUR' }

const initialState: TourState = {
  isActive: false,
  currentStepIndex: 0,
  phase: null,
  hasSeenWelcome: false,
  isTransitioning: false,
  transitionTarget: null,
}

function tourReducer(state: TourState, action: TourAction): TourState {
  switch (action.type) {
    case 'SHOW_WELCOME':
      return { ...state, phase: 'welcome', hasSeenWelcome: true }
    case 'START_TOUR':
      return { ...state, isActive: true, currentStepIndex: 0, phase: 'student' }
    case 'NEXT_STEP': {
      const nextIndex = state.currentStepIndex + 1
      if (nextIndex >= TOTAL_STEPS) {
        return { ...state, isActive: false, phase: 'complete' }
      }
      const nextStep = TOUR_STEPS[nextIndex]
      return { ...state, currentStepIndex: nextIndex, phase: nextStep.phase }
    }
    case 'PREV_STEP': {
      const prevIndex = Math.max(0, state.currentStepIndex - 1)
      const prevStep = TOUR_STEPS[prevIndex]
      return { ...state, currentStepIndex: prevIndex, phase: prevStep.phase }
    }
    case 'SKIP_TOUR':
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tour-completed', 'true')
      }
      return { ...initialState, hasSeenWelcome: true, phase: null }
    case 'COMPLETE_TOUR':
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tour-completed', 'true')
      }
      return { ...state, isActive: false, phase: null }
    case 'RESTART_TOUR':
      return { ...state, isActive: true, currentStepIndex: 0, phase: 'student' }
    case 'SET_TRANSITIONING':
      return { ...state, isTransitioning: action.payload, transitionTarget: action.payload ? (action.target ?? null) : null }
    case 'CANCEL_TOUR':
      return { ...initialState, hasSeenWelcome: true, phase: null }
    default:
      return state
  }
}

interface TourContextValue {
  state: TourState
  currentStep: typeof TOUR_STEPS[number] | null
  totalSteps: number
  showWelcome: () => void
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
  restartTour: () => void
  cancelTour: () => void
}

export const TourContext = createContext<TourContextValue | null>(null)

interface TourProviderProps {
  children: ReactNode
  onRoleChange: (role: Role) => void
  onTabChange: (tab: string) => void
  currentRole: Role
}

export function TourProvider({ children, onRoleChange, onTabChange, currentRole }: TourProviderProps) {
  const [state, dispatch] = useReducer(tourReducer, initialState)

  const currentStep = state.isActive ? TOUR_STEPS[state.currentStepIndex] : null

  const executeAutoAction = useCallback((stepIndex: number) => {
    const step = TOUR_STEPS[stepIndex]
    if (!step?.autoAction) return

    if (step.autoAction.role && step.autoAction.role !== currentRole) {
      onRoleChange(step.autoAction.role)
    }
    if (step.autoAction.tab) {
      onTabChange(step.autoAction.tab)
    }
  }, [currentRole, onRoleChange, onTabChange])

  const showWelcome = useCallback(() => dispatch({ type: 'SHOW_WELCOME' }), [])

  const startTour = useCallback(() => {
    trackTourEvent('tour_started')
    dispatch({ type: 'START_TOUR' })
    executeAutoAction(0)
  }, [executeAutoAction])

  const nextStep = useCallback(() => {
    const nextIndex = state.currentStepIndex + 1
    if (nextIndex >= TOTAL_STEPS) {
      dispatch({ type: 'NEXT_STEP' })
      return
    }

    const currentPhase = TOUR_STEPS[state.currentStepIndex]?.phase
    const nextPhase = TOUR_STEPS[nextIndex]?.phase

    if (currentPhase !== nextPhase) {
      dispatch({ type: 'SET_TRANSITIONING', payload: true, target: nextPhase as TourPhase })
      executeAutoAction(nextIndex)
      setTimeout(() => {
        dispatch({ type: 'NEXT_STEP' })
        trackTourEvent('step_viewed', { step: TOUR_STEPS[nextIndex].id, phase: nextPhase })
        dispatch({ type: 'SET_TRANSITIONING', payload: false })
      }, 400)
    } else {
      executeAutoAction(nextIndex)
      setTimeout(() => {
        dispatch({ type: 'NEXT_STEP' })
        trackTourEvent('step_viewed', { step: TOUR_STEPS[nextIndex].id, phase: currentPhase })
      }, 50)
    }
  }, [state.currentStepIndex, executeAutoAction])

  const prevStep = useCallback(() => {
    const prevIndex = Math.max(0, state.currentStepIndex - 1)
    const currentPhase = TOUR_STEPS[state.currentStepIndex]?.phase
    const prevPhase = TOUR_STEPS[prevIndex]?.phase

    if (currentPhase !== prevPhase) {
      dispatch({ type: 'SET_TRANSITIONING', payload: true, target: prevPhase as TourPhase })
      // Switch role to match the previous phase
      if (prevPhase) {
        onRoleChange(prevPhase as Role)
      }
      executeAutoAction(prevIndex)
      setTimeout(() => {
        dispatch({ type: 'PREV_STEP' })
        dispatch({ type: 'SET_TRANSITIONING', payload: false })
      }, 400)
    } else {
      executeAutoAction(prevIndex)
      setTimeout(() => {
        dispatch({ type: 'PREV_STEP' })
      }, 50)
    }
  }, [state.currentStepIndex, executeAutoAction, onRoleChange])

  const skipTour = useCallback(() => {
    trackTourEvent('tour_skipped', { step: String(state.currentStepIndex) })
    dispatch({ type: 'SKIP_TOUR' })
  }, [state.currentStepIndex])
  const completeTour = useCallback(() => {
    trackTourEvent('tour_completed')
    dispatch({ type: 'COMPLETE_TOUR' })
  }, [])
  const restartTour = useCallback(() => {
    dispatch({ type: 'RESTART_TOUR' })
    executeAutoAction(0)
  }, [executeAutoAction])
  const cancelTour = useCallback(() => dispatch({ type: 'CANCEL_TOUR' }), [])

  // Check sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = sessionStorage.getItem('tour-completed')
      if (!completed && !state.hasSeenWelcome) {
        dispatch({ type: 'SHOW_WELCOME' })
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TourContext.Provider value={{
      state,
      currentStep,
      totalSteps: TOTAL_STEPS,
      showWelcome,
      startTour,
      nextStep,
      prevStep,
      skipTour,
      completeTour,
      restartTour,
      cancelTour,
    }}>
      {children}
    </TourContext.Provider>
  )
}

export function useTour() {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
