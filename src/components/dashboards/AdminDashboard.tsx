'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'

interface AdminDashboardProps {
  user: User
}

interface PendingTutor {
  id: string
  user_id: string
  subjects: string[]
  bio: string
  calendar_link: string
  is_active: boolean
  created_at: string
  user_name: string
  user_email: string
}

interface AdminStats {
  totalUsers: number
  totalTutors: number
  activeTutors: number
  pendingTutors: number
  totalStudents: number
  totalSessions: number
  completedSessions: number
  pendingPayments: number
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingTutors, setPendingTutors] = useState<PendingTutor[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tutors'>('overview')

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin data...')
      
      // Get user counts
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: totalTutors } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'tutor')

      const { count: totalStudents } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      // Get tutor profile counts
      const { count: activeTutors } = await supabase
        .from('tutor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: pendingTutorCount } = await supabase
        .from('tutor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)

      // Get session counts
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })

      const { count: completedSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get pending payments count
      const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('student_paid', false)

      console.log('Fetching pending tutors...')
      
      // Skip RPC for now and go straight to manual approach
      console.log('Using manual approach...')
      
      // Get pending tutors manually
      const { data: pendingProfiles, error: profilesError } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: true })

      console.log('Manual - Pending profiles:', pendingProfiles, 'Error:', profilesError)

      let tutorsWithUserData: PendingTutor[] = []

      if (pendingProfiles && pendingProfiles.length > 0) {
        // Get user data for each pending tutor
        const userIds = pendingProfiles.map(p => p.user_id)
        console.log('Manual - User IDs to fetch:', userIds)
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('Manual - User data fetched:', userData, 'Error:', userError)

        if (userData && userData.length > 0) {
          // Combine the data
          tutorsWithUserData = pendingProfiles.map(profile => {
            const user = userData.find(u => u.id === profile.user_id)
            console.log(`Manual - Profile ${profile.id} has user_id: ${profile.user_id}`)
            console.log(`Manual - Found matching user:`, user)
            return {
              id: profile.id,
              user_id: profile.user_id,
              subjects: profile.subjects || [],
              bio: profile.bio || '',
              calendar_link: profile.calendar_link || '',
              is_active: profile.is_active,
              created_at: profile.created_at,
              user_name: user?.name || `Missing name for ID: ${profile.user_id}`,
              user_email: user?.email || `Missing email for ID: ${profile.user_id}`
            }
          })
        } else {
          console.log('No user data found')
          tutorsWithUserData = pendingProfiles.map(profile => ({
            id: profile.id,
            user_id: profile.user_id,
            subjects: profile.subjects || [],
            bio: profile.bio || '',
            calendar_link: profile.calendar_link || '',
            is_active: profile.is_active,
            created_at: profile.created_at,
            user_name: `No users found - ID: ${profile.user_id}`,
            user_email: 'No users table data'
          }))
        }
      }

      console.log('Final tutors with user data:', tutorsWithUserData)

      setStats({
        totalUsers: totalUsers || 0,
        totalTutors: totalTutors || 0,
        activeTutors: activeTutors || 0,
        pendingTutors: pendingTutorCount || 0,
        totalStudents: totalStudents || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        pendingPayments: pendingPayments || 0,
      })

      setPendingTutors(tutorsWithUserData)

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

const handleTutorApproval = async (tutorId: string, approve: boolean) => {
  console.log('🔄 Starting approval process...')
  console.log('Tutor ID:', tutorId)
  console.log('Approving:', approve)
  
  try {
    // Step 1: Check if the tutor exists
    console.log('📋 Checking if tutor exists...')
    const { data: existingTutor, error: fetchError } = await supabase
      .from('tutor_profiles')
      .select('id, user_id, is_active')
      .eq('id', tutorId)
      .single()

    console.log('Existing tutor:', existingTutor)
    
    if (fetchError || !existingTutor) {
      console.error('❌ Could not find tutor:', fetchError)
      alert('Error: Could not find this tutor profile.')
      return
    }

    // Step 2: Update the tutor approval status
    console.log('✏️ Updating tutor approval status...')
    const { data: updateResult, error: updateError } = await supabase
      .from('tutor_profiles')
      .update({ is_active: approve })
      .eq('id', tutorId)
      .select()

    console.log('Update result:', updateResult)
    
    if (updateError) {
      console.error('❌ Update failed:', updateError)
      alert(`Update failed: ${updateError.message}`)
      return
    }

    if (!updateResult || updateResult.length === 0) {
      console.error('❌ No rows were updated')
      alert('Error: No changes were made. Please try again.')
      return
    }

    // Step 3: Double-check the change worked
    console.log('🔍 Verifying the change worked...')
    const { data: verifyResult } = await supabase
      .from('tutor_profiles')
      .select('is_active')
      .eq('id', tutorId)
      .single()

    console.log('Verification result:', verifyResult)

    if (verifyResult?.is_active === approve) {
      console.log('✅ Success! Change confirmed in database')
      const message = approve ? 'Tutor approved successfully!' : 'Tutor rejected successfully!'
      alert(message)
      
      // Refresh the page data
      await fetchAdminData()
    } else {
      console.error('❌ Verification failed')
      alert('Error: The change did not save properly. Please try again.')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    alert('An unexpected error occurred. Please try again.')
  }
}

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {stats && stats.pendingTutors > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-medium">
                {stats.pendingTutors} tutor{stats.pendingTutors !== 1 ? 's' : ''} waiting for approval
              </h3>
              <p className="text-yellow-700 text-sm mt-1">
                Review pending tutor applications to activate their profiles.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('tutors')}
              className="ml-auto bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
            >
              Review Applications
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">👥</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">🎓</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Active Tutors</p>
              <p className="text-2xl font-bold text-green-900">{stats?.activeTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 cursor-pointer" onClick={() => setActiveTab('tutors')}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{stats?.pendingTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">📚</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Students</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Sessions</span>
              <span className="font-medium">{stats?.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{stats?.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">
                {stats?.totalSessions 
                  ? `${Math.round((stats.completedSessions / stats.totalSessions) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Sessions</span>
              <span className="font-medium">{stats?.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Revenue</span>
              <span className="font-medium text-green-600">
                ${((stats?.completedSessions || 0) * 25).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tutor Earnings</span>
              <span className="font-medium">
                ${((stats?.completedSessions || 0) * 25).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="font-medium text-green-600">✅ Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Payments</span>
              <span className="font-medium text-red-600">{stats?.pendingPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Tutors</span>
              <span className="font-medium">{stats?.activeTutors}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTutorManagement = () => {
    console.log('Rendering tutor management, pending tutors:', pendingTutors)
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Tutor Approvals ({pendingTutors.length})
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Review and approve tutor applications to activate their profiles
            </p>
          </div>
          
          <div className="p-6">
            {pendingTutors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No tutor applications pending approval.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingTutors.map((tutor) => {
                  console.log('Rendering tutor:', tutor)
                  return (
                    <div key={tutor.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {tutor.user_name}
                          </h4>
                          <p className="text-gray-600">{tutor.user_email}</p>
                          <p className="text-sm text-gray-500">
                            Applied: {new Date(tutor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Review
                        </span>
                      </div>

                      {/* Subjects */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Teaching Subjects</h5>
                        <div className="flex flex-wrap gap-2">
                          {tutor.subjects.map((subject, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                        <p className="text-gray-700 text-sm">{tutor.bio}</p>
                      </div>

                      {/* Calendar Link */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Calendar Link</h5>
                        <a 
                          href={tutor.calendar_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {tutor.calendar_link}
                        </a>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleTutorApproval(tutor.id, true)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                        >
                          ✅ Approve Tutor
                        </button>
                        <button
                          onClick={() => handleTutorApproval(tutor.id, false)}
                          className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                        >
                          ❌ Reject Application
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('tutors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tutors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎓 Tutor Management
              {stats && stats.pendingTutors > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingTutors}
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'tutors' && renderTutorManagement()}
    </div>
  )
}