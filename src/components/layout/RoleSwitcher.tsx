'use client'

import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast'
import { Role } from '@/types'
import { useTourSafe } from '@/components/tour/useTourSafe'

const roles: { value: Role; label: string }[] = [
  { value: 'student', label: 'Student' },
  { value: 'tutor', label: 'Tutor' },
  { value: 'admin', label: 'Admin' },
]

export default function RoleSwitcher() {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const tour = useTourSafe()

  function handleRoleClick(role: Role) {
    if (tour?.state.isActive) {
      tour.cancelTour()
      showToast('Tour ended \u2014 explore freely!')
    }
    dispatch({ type: 'SET_ROLE', payload: role })
  }

  return (
    <div data-tour="role-switcher" className="bg-[var(--color-bg)] rounded-lg p-1 inline-flex">
      {roles.map(role => (
        <button
          key={role.value}
          onClick={() => handleRoleClick(role.value)}
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
