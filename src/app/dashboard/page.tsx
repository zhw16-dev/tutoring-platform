'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
}

export default function Dashboard() {
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
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

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">Tutoring Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {profile?.name}</span>
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md text-sm hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Dashboard</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Role</h3>
                  <p className="text-blue-600 capitalize">{profile?.role}</p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Email</h3>
                  <p className="text-green-600">{profile?.email}</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Phone</h3>
                  <p className="text-purple-600">{profile?.phone || 'Not provided'}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-md font-medium text-gray-900 mb-4">
                  🎉 Authentication Working!
                </h3>
                <p className="text-gray-600">
                  You successfully logged in and your profile data is loading from the database.
                  Next, we'll build role-specific features based on your user type.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}