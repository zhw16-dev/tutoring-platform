'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'
import Link from 'next/link'
import StudentProfileEdit from '@/components/StudentProfileEdit'

interface StudentDashboardProps {
  user: User
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  // ✅ ALL useState hooks at component level (not inside functions)
  const [sessions, setSessions] = useState<any[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview')
  
  // ✅ Sessions state moved to component level to fix hooks error
  const [allSessions, setAllSessions] = useState<any[]>([])
  const [sessionsLoading, setSessionsLoading] = useState(true)
  
  // ✅ Profile editing state
  const [showProfileEdit, setShowProfileEdit] = useState(false)

  useEffect(() => {
    fetchStudentProfile()
  }, [user.id])

  useEffect(() => {
    if (studentProfile) {
      fetchSessions()
    } else {
      setLoading(false)
    }
  }, [studentProfile])

  // ✅ Load sessions when tab changes to sessions
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchAllSessions()
    }
  }, [activeTab])

  const handleProfileUpdated = () => {
    setShowProfileEdit(false)
    fetchStudentProfile() // Refresh the profile data
  }

  const fetchStudentProfile = async () => {
    try {
      console.log('🔍 Fetching student profile for user:', user.id)
      
      const { data, error } = await supabase
        .from('students')
        .select('id, grade_level, school, parent_contact, parent_contact_email, parent_contact_phone')
        .eq('user_id', user.id)
        .single()

      console.log('📊 Student profile query result:', { data, error })

      if (data) {
        console.log('✅ Student profile found:', data)
        setStudentProfile(data)
      } else if (error?.code === 'PGRST116') {
        // No profile found - create one
        console.log('⚠️ No student profile found, creating one...')
        const { data: newProfile, error: createError } = await supabase
          .from('students')
          .insert({ user_id: user.id })
          .select()
          .single()

        if (createError) {
          console.error('❌ Error creating student profile:', createError)
        } else {
          console.log('✅ Student profile created:', newProfile)
          setStudentProfile(newProfile)
        }
      } else {
        console.error('❌ Error fetching student profile:', error)
      }
    } catch (error) {
      console.error('💥 Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    if (!studentProfile) return

    try {
      console.log('🔍 Fetching sessions for student:', studentProfile.id)
      
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_profiles (
            id,
            users!inner (
              name,
              email
            )
          ),
          payments (
            id,
            student_paid,
            amount
          )
        `)
        .eq('student_id', studentProfile.id)
        .order('scheduled_at', { ascending: false })

      console.log('📊 Sessions result:', { count: data?.length, data })
      setSessions(data || [])
    } catch (error) {
      console.error('💥 Error fetching sessions:', error)
    }
  }

  // ✅ Separate function for all sessions (for sessions tab)
  const fetchAllSessions = async () => {
    if (!studentProfile) return

    setSessionsLoading(true)
    try {
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_profiles (
            id,
            users!inner (
              name,
              email
            )
          ),
          payments (
            id,
            student_paid,
            amount
          )
        `)
        .eq('student_id', studentProfile.id)
        .order('scheduled_at', { ascending: false })

      setAllSessions(data || [])
    } catch (error) {
      console.error('Error fetching all sessions:', error)
    } finally {
      setSessionsLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your dashboard...</span>
      </div>
    )
  }

  // ✅ Calculate upcoming and completed sessions properly
  const now = new Date()
  const upcomingSessions = sessions.filter(s => 
    (s.status === 'scheduled' || s.status === 'confirmed') && 
    new Date(s.scheduled_at) > now
  )
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const pendingPayments = sessions.filter(s => 
    s.status === 'completed' && 
    s.payments && 
    s.payments.length > 0 && 
    !s.payments[0]?.student_paid
  )

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-3xl mr-4">👨‍🎓</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h2>
            <p className="text-gray-600 mt-1">Here's your learning dashboard</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📅</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Upcoming Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">✅</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Completed Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">💳</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Payments</p>
              <p className="text-2xl font-bold text-red-600">{pendingPayments.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowProfileEdit(true)}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">✏️</span>
            Edit Profile
          </button>
          <div className="flex items-center justify-center px-4 py-3 bg-gray-100 text-gray-500 rounded-lg">
            <span className="mr-2">💬</span>
            Contact Tutor (Coming Soon)
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
        </div>
        <div className="p-6">
          {upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📚</div>
              <p className="text-gray-500">No upcoming sessions scheduled</p>
              <p className="text-sm text-gray-400 mt-2">
                Your tutor will schedule sessions for you
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.subject} with {session.tutor?.users?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                      {new Date(session.scheduled_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                    {session.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        📝 {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {session.duration} min
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      ${session.price || 50}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Completed Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Completed Sessions</h3>
        </div>
        <div className="p-6">
          {completedSessions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📖</div>
              <p className="text-gray-500">No completed sessions yet</p>
              <p className="text-sm text-gray-400 mt-2">
                Your completed sessions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {completedSessions.slice(0, 3).map((session: any) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-l-4 border-green-400">
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.subject} with {session.tutor?.users?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.scheduled_at).toLocaleDateString()}
                    </p>
                    {session.notes && (
                      <p className="text-sm text-gray-500 mt-1">
                        📝 {session.notes}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                      Completed
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {session.payments && session.payments[0]?.student_paid ? '✅ Paid' : '⏳ Payment Due'}
                    </div>
                  </div>
                </div>
              ))}
              {completedSessions.length > 3 && (
                <button
                  onClick={() => setActiveTab('sessions')}
                  className="text-blue-600 text-sm hover:text-blue-800"
                >
                  View all {completedSessions.length} completed sessions →
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ✅ Fixed renderSessions - no useState hooks inside!
  const renderSessions = () => {
    if (sessionsLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading sessions...</span>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              All My Sessions ({allSessions.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tutor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allSessions.map((session) => (
                  <tr key={session.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(session.scheduled_at).toLocaleDateString()}<br/>
                      <span className="text-gray-500">
                        {new Date(session.scheduled_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.tutor?.users?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.subject}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        session.status === 'completed' 
                          ? 'bg-green-100 text-green-800'
                          : session.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : session.status === 'cancelled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {session.payments && session.payments[0] ? (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          session.payments[0].student_paid 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {session.payments[0].student_paid ? 'Paid' : 'Pending'}
                        </span>
                      ) : (
                        <span className="text-gray-500">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {allSessions.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📖</div>
              <p className="text-gray-500">No sessions found</p>
              <p className="text-sm text-gray-400 mt-2">
                Your session history will appear here once you start learning
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 My Sessions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'sessions' && renderSessions()}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <StudentProfileEdit
          user={user}
          onProfileUpdated={handleProfileUpdated}
          onCancel={() => setShowProfileEdit(false)}
        />
      )}
    </div>
  )
}