'use client'

import { useApp } from '@/context/AppContext'
import { Role } from '@/types'

const roles: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'admin', label: 'Admin' },
]

export default function RoleSwitcher() {
  const { state, dispatch } = useApp()

  return (
    <div className="bg-[var(--color-bg)] rounded-lg p-1 inline-flex">
      {roles.map(role => (
        <button
          key={role.value}
          onClick={() => dispatch({ type: 'SET_ROLE', payload: role.value })}
          className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer transition-all ${
            state.currentRole === role.value
              ? 'text-[var(--color-accent)] bg-white shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          {role.label}
        </button>
      ))}
    </div>
  )
}
