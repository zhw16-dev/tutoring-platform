'use client'

import { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react'
import { AppState, AppAction } from '@/types'
import { appReducer } from './appReducer'
import { seedTutors, seedStudents, seedSessions, seedPayments } from '@/data/seed'

const initialState: AppState = {
  currentRole: 'student',
  isLoggedIn: false,
  tutors: seedTutors,
  students: seedStudents,
  sessions: seedSessions,
  payments: seedPayments,
}

const AppContext = createContext<{
  state: AppState
  dispatch: Dispatch<AppAction>
} | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
