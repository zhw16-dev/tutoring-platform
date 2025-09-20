'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, TutorProfile } from '@/types/database'
import Link from 'next/link'
import LogSessionForm from '@/components/LogSessionForm'

interface TutorDashboardProps {
  user: User
}

export default function TutorDashboard({ user }: TutorDashboardProps) {
  const [profile, setProfile] = useState<TutorProfile | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogForm, setShowLogForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview')
  
  // ✅ State for editing sessions
  const [editingSession, setEditingSession] = useState<string | null>(null)
  const [editSessionData, setEditSessionData] = useState<any>({})

  useEffect(() => {
    fetchTutorProfile()
  }, [user.id])

  useEffect(() => {
    if (profile) {
      fetchSessions()
    }
  }, [profile])

  const fetchTutorProfile = async () => {
    try {
      console.log('🔍 Fetching tutor profile for user:', user.id)
      
      const { data: profileData, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      console.log('📊 Tutor profile result:', { profileData, error })

      if (profileData) {
        setProfile(profileData)
      } else {
        console.log('⚠️ No tutor profile found')
      }
    } catch (error) {
      console.error('💥 Error fetching tutor profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    if (!profile) return

    try {
      console.log('🔍 Fetching sessions for tutor:', profile.id)
      
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          student:students (
            id,
            grade_level,
            school,
            parent_contact_email,
            parent_contact_phone,
            users!inner (
              name,
              email
            )
          ),
          payments (
            id,
            student_paid,
            tutor_paid
          )
        `)
        .eq('tutor_id', profile.id)
        .order('scheduled_at', { ascending: false })

      console.log('📊 Sessions result:', { count: data?.length, data })
      setSessions(data || [])
    } catch (error) {
      console.error('💥 Error fetching sessions:', error)
    }
  }

  const handleSessionLogged = () => {
    setShowLogForm(false)
    fetchSessions()
  }

  // ✅ Handle session status updates
  const handleEditSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId)
    if (session) {
      setEditingSession(sessionId)
      setEditSessionData({
        status: session.status,
        notes: session.notes || ''
      })
    }
  }

  const handleSaveSessionEdit = async (sessionId: string) => {
    try {
      console.log('💾 Updating session:', sessionId, editSessionData)
      
      const { error } = await supabase
        .from('sessions')
        .update({
          status: editSessionData.status,
          notes: editSessionData.notes
        })
        .eq('id', sessionId)

      if (error) {
        console.error('❌ Error updating session:', error)
        alert('Error updating session')
      } else {
        console.log('✅ Session updated successfully')
        setEditingSession(null)
        fetchSessions() // Refresh the list
      }
    } catch (error) {
      console.error('💥 Unexpected error updating session:', error)
      alert('Error updating session')
    }
  }

  const handleCancelEdit = () => {
    setEditingSession(null)
    setEditSessionData({})
  }

  // Calculate earnings
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalEarnings = completedSessions.length * 25
  const paidEarnings = completedSessions.filter(s => s.payments?.some((p: any) => p.tutor_paid)).length * 25

  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  )

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-3xl mr-4">🎓</div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user.name}!</h2>
            <p className="text-gray-600 mt-1">Here's your tutoring dashboard</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <div className="text-2xl mr-3">💰</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-600">${totalEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="text-2xl mr-3">🏦</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Paid Out</p>
              <p className="text-2xl font-bold text-blue-600">${paidEarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setShowLogForm(true)}
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="mr-2">📝</span>
            Log New Session
          </button>
          <Link
            href="/tutor/profile"
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <span className="mr-2">⚙️</span>
            Edit Profile
          </Link>
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
                Log a new session to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {session.subject} with {session.student?.users?.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                      {new Date(session.scheduled_at).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {session.duration} min
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  // ✅ Enhanced sessions view with editing capability
  const renderSessions = () => (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Sessions ({sessions.length})</h2>
        <button
          onClick={() => setShowLogForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <span className="mr-2">➕</span>
          Log New Session
        </button>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sessions.map((session) => (
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
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{session.student?.users?.name || 'Unknown'}</div>
                      {session.student?.grade_level && (
                        <div className="text-xs text-gray-500">📚 {session.student.grade_level}</div>
                      )}
                      {session.student?.school && (
                        <div className="text-xs text-gray-500">🏫 {session.student.school}</div>
                      )}
                      {session.student?.parent_contact_email && (
                        <div className="text-xs text-blue-600">📧 {session.student.parent_contact_email}</div>
                      )}
                      {session.student?.parent_contact_phone && (
                        <div className="text-xs text-green-600">📞 {session.student.parent_contact_phone}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingSession === session.id ? (
                      <select
                        value={editSessionData.status}
                        onChange={(e) => setEditSessionData({ ...editSessionData, status: e.target.value })}
                        className="text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500"
                      >
                        <option value="scheduled">📅 Scheduled</option>
                        <option value="completed">✅ Completed</option>
                        <option value="no_show">❌ No-Show</option>
                        <option value="cancelled">🚫 Cancelled</option>
                      </select>
                    ) : (
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
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingSession === session.id ? (
                      <textarea
                        value={editSessionData.notes}
                        onChange={(e) => setEditSessionData({ ...editSessionData, notes: e.target.value })}
                        className="w-full text-xs p-1 border border-gray-300 rounded focus:outline-none focus:ring-blue-500"
                        rows={2}
                        placeholder="Add notes..."
                      />
                    ) : (
                      <div className="max-w-xs">
                        {session.notes ? (
                          <span className="text-gray-600">{session.notes}</span>
                        ) : (
                          <span className="text-gray-400 italic">No notes</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingSession === session.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSaveSessionEdit(session.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Save"
                        >
                          ✅
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="text-red-600 hover:text-red-900"
                          title="Cancel"
                        >
                          ❌
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditSession(session.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit session"
                      >
                        ✏️
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📖</div>
            <p className="text-gray-500">No sessions logged yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Click "Log New Session" to get started
            </p>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading your dashboard...</span>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-4xl mb-4">⚠️</div>
        <h2 className="text-xl font-medium text-gray-900 mb-4">Tutor Profile Not Found</h2>
        <p className="text-gray-600 mb-6">
          It looks like your tutor profile hasn't been set up yet.
        </p>
        <Link
          href="/tutor/setup"
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
        >
          Set Up Profile
        </Link>
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

      {/* Log Session Modal */}
      {showLogForm && (
        <LogSessionForm
          onSessionLogged={handleSessionLogged}
          onCancel={() => setShowLogForm(false)}
        />
      )}
    </div>
  )
}