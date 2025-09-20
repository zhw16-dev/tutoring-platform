'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { User } from '@/types/database'
import Link from 'next/link'
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
      console.log('🔍 Fetching user profile for:', user.id)
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      console.log('📊 Profile fetch result:', { data, error })

      if (error) {
        console.error('❌ Error fetching profile:', error)
        // Still try to continue with basic user data
        setProfile({
          id: user.id,
          email: user.email || '',
          name: user.user_metadata?.name || user.email || 'User',
          role: 'student', // Default fallback
          phone: undefined,
          created_at: new Date().toISOString()
        })
      } else if (data) {
        console.log('✅ Profile loaded successfully:', data)
        setProfile(data)
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching profile:', error)
      // Fallback profile
      setProfile({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email || 'User',
        role: 'student',
        phone: undefined,
        created_at: new Date().toISOString()
      })
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Unable to load your profile.</p>
          <button
            onClick={handleSignOut}
            className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  // Render role-specific dashboard
  const renderDashboard = () => {
    console.log('🎯 Rendering dashboard for role:', profile.role)
    
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
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-medium text-gray-900 mb-4">Unknown User Role</h2>
            <p className="text-gray-600 mb-6">
              Your account role "{profile.role}" is not recognized. Please contact support.
            </p>
            <button
              onClick={handleSignOut}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="text-2xl font-bold text-blue-600">TutorPlatform</div>
              </Link>
            </div>

            {/* User Info & Navigation */}
            <div className="flex items-center space-x-4">
              {/* Role-specific navigation */}
              {profile.role === 'tutor' && (
                <div className="hidden md:flex space-x-4">
                  {/* ✅ Fixed: Using Link instead of <a> tag */}
                  <Link
                    href="/tutor/profile"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors"
                  >
                    Edit Profile
                  </Link>
                </div>
              )}

              {/* User info */}
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    profile.role === 'admin' 
                      ? 'bg-red-100 text-red-800'
                      : profile.role === 'tutor' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-gray-700 text-sm">
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
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderDashboard()}
      </main>
    </div>
  )
}