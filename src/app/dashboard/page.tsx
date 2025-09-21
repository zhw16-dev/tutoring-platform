'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@/types/database'
import StudentDashboard from '@/components/dashboards/StudentDashboard'
import TutorDashboard from '@/components/dashboards/TutorDashboard'
import AdminDashboard from '@/components/dashboards/AdminDashboard'

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<User | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      fetchProfile()
    }
  }, [user, loading, router])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
      } else if (data) {
        setProfile(data)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  // Loading states
  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sage-green mx-auto"></div>
          <p className="mt-4 text-forest-green">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <p className="text-forest-green mb-4">Unable to load your profile.</p>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (profile.role) {
      case 'student':
        return <StudentDashboard user={profile} />
      case 'tutor':
        return <TutorDashboard user={profile} />
      case 'admin':
        return <AdminDashboard user={profile} />
      default:
        return (
          <div className="text-center py-12">
            <p className="text-forest-green">Unknown user role: {profile.role}</p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation Header */}
      <nav className="bg-cream shadow-soft border-b border-sage-green-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-xl font-semibold text-forest-green font-serif">
                Will's Tutoring
              </h1>
              
              {/* Role-specific navigation */}
              {profile.role === 'student' && (
                <div className="hidden md:flex space-x-4">
                  <a
                    href="/dashboard"
                    className="text-forest-green hover:text-sage-green px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </a>
                  <a
                    href="/tutors"
                    className="text-forest-green hover:text-sage-green px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Find Tutors
                  </a>
                </div>
              )}
              
              {profile.role === 'tutor' && (
                <div className="hidden md:flex space-x-4">
                  <a
                    href="/dashboard"
                    className="text-forest-green hover:text-sage-green px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Dashboard
                  </a>
                </div>
              )}

              <div className="ml-6">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  profile.role === 'admin' 
                    ? 'bg-red-100 text-red-800'
                    : profile.role === 'tutor' 
                    ? 'badge-active' 
                    : 'badge-pending'
                }`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-forest-green text-sm">
                Welcome, {profile.name}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>
    </div>
  )
}