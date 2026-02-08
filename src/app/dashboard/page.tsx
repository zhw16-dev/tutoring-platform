'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'
import Header from '@/components/layout/Header'
import StudentDashboard from '@/components/student/StudentDashboard'
import BrowseTutors from '@/components/student/BrowseTutors'
import StudentSessions from '@/components/student/StudentSessions'
import TutorDashboard from '@/components/tutor/TutorDashboard'
import TutorSessions from '@/components/tutor/TutorSessions'
import TutorProfile from '@/components/tutor/TutorProfile'
import AdminOverview from '@/components/admin/AdminOverview'
import AdminSessions from '@/components/admin/AdminSessions'
import AdminFinancials from '@/components/admin/AdminFinancials'
import AdminUsers from '@/components/admin/AdminUsers'

const TABS: Record<string, { key: string; label: string }[]> = {
  student: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'browse', label: 'Browse Tutors' },
    { key: 'sessions', label: 'My Sessions' },
  ],
  tutor: [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'sessions', label: 'My Sessions' },
    { key: 'profile', label: 'Profile' },
  ],
  admin: [
    { key: 'overview', label: 'Overview' },
    { key: 'sessions', label: 'Sessions' },
    { key: 'financials', label: 'Financials' },
    { key: 'users', label: 'Users' },
  ],
}

export default function DashboardPage() {
  const { state } = useApp()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [fadeKey, setFadeKey] = useState(0)

  useEffect(() => {
    if (!state.isLoggedIn) {
      router.push('/')
    }
  }, [state.isLoggedIn, router])

  useEffect(() => {
    const tabs = TABS[state.currentRole]
    setActiveTab(tabs[0].key)
    setFadeKey(prev => prev + 1)
  }, [state.currentRole])

  function handleTabChange(key: string) {
    setActiveTab(key)
    setFadeKey(prev => prev + 1)
  }

  if (!state.isLoggedIn) return null

  const tabs = TABS[state.currentRole]

  function renderContent() {
    switch (state.currentRole) {
      case 'student':
        switch (activeTab) {
          case 'dashboard': return <StudentDashboard onNavigate={handleTabChange} />
          case 'browse': return <BrowseTutors />
          case 'sessions': return <StudentSessions />
        }
        break
      case 'tutor':
        switch (activeTab) {
          case 'dashboard': return <TutorDashboard onNavigate={handleTabChange} />
          case 'sessions': return <TutorSessions />
          case 'profile': return <TutorProfile />
        }
        break
      case 'admin':
        switch (activeTab) {
          case 'overview': return <AdminOverview />
          case 'sessions': return <AdminSessions />
          case 'financials': return <AdminFinancials />
          case 'users': return <AdminUsers />
        }
        break
    }
    return null
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Header />
      <main className="max-w-[1200px] mx-auto px-4 py-6 md:px-6 md:py-8">
        {/* Tabs */}
        <div className="flex gap-0 border-b border-[var(--color-border)] mb-8 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`pb-3 px-1 mr-6 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[var(--color-accent)] border-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div key={fadeKey} className="animate-[fadeIn_150ms_ease-out]">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
