'use client'

import { useApp } from '@/context/AppContext'
import { useRouter } from 'next/navigation'
import RoleSwitcher from './RoleSwitcher'

export default function Header() {
  const { dispatch } = useApp()
  const router = useRouter()

  function handleLogout() {
    dispatch({ type: 'LOGOUT' })
    router.push('/')
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[var(--color-border)]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-[var(--color-text-primary)]">
            Will&apos;s Tutoring
          </span>
          <span className="text-[var(--color-text-tertiary)]">·</span>
          <span className="text-sm text-[var(--color-text-tertiary)]">Product Demo</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <RoleSwitcher />
          </div>
          <button
            onClick={handleLogout}
            className="text-[var(--color-text-secondary)] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Log out
          </button>
        </div>
      </div>
      {/* Mobile role switcher */}
      <div className="sm:hidden px-4 pb-3">
        <RoleSwitcher />
      </div>
    </header>
  )
}
