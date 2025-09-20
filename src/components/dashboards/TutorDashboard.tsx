'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, TutorProfile } from '@/types/database'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

const APPROVED_SUBJECTS = [
  'Mathematics', 'English', 'French', 'Computer Science',
  'Biology', 'Chemistry', 'Physics', 'Economics',
  'SAT Prep', 'ACT Prep', 'University Admissions'
]

interface TutorDashboardProps {
  user: User
}

export default function TutorDashboard({ user }: TutorDashboardProps) {
  const [profile, setProfile] = useState<TutorProfile | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogForm, setShowLogForm] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview')

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
      const { data: profileData } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData)
      }
    } catch (error) {
      console.error('Error fetching tutor profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSessions = async () => {
    if (!profile) return

    try {
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          student:students(
            user:users(name, email)
          ),
          payment:payments(id, student_paid, tutor_paid)
        `)
        .eq('tutor_id', profile.id)
        .order('scheduled_at', { ascending: false })

      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const handleSessionLogged = () => {
    setShowLogForm(false)
    fetchSessions()
  }

  // Calculate earnings
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalEarnings = completedSessions.length * 25
  const paidEarnings = completedSessions.filter(s => s.payment?.[0]?.tutor_paid).length * 25
  const unpaidEarnings = totalEarnings - paidEarnings

  if (loading) {
    return <div className="p-6">Loading your dashboard...</div>
  }

  // No profile exists - needs setup
  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-xl font-medium text-gray-900 mb-4">
          Complete Your Tutor Profile
        </h2>
        <p className="text-gray-600 mb-6">
          Set up your subjects, pricing, and bio to start your application process.
        </p>
        <Link
          href="/profile/setup"
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
        >
          Set Up Profile
        </Link>
      </div>
    )
  }

  // Profile exists but not approved
  if (!profile.is_active) {
    return (
      <div className="space-y-6">
        {/* Pending Approval Status */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-medium text-yellow-800 mb-2">
              Profile Submitted for Review
            </h2>
            <p className="text-yellow-700 mb-6">
              Your tutor profile has been submitted and is currently under review by our admin team. 
              You'll receive an email notification once your profile is approved and activated.
            </p>
            <div className="bg-white rounded-lg p-4 mb-6">
              <h3 className="font-medium text-gray-900 mb-2">Review typically takes:</h3>
              <p className="text-gray-600 text-sm">• 24-48 hours during business days</p>
              <p className="text-gray-600 text-sm">• We may contact you if additional information is needed</p>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Your Submitted Profile</h3>
              <Link
                href="/profile/edit"
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Teaching Subjects</h4>
                {profile.subjects && profile.subjects.length > 0 ? (
                  <div className="space-y-1">
                    {profile.subjects.map((subject, index) => (
                      <div key={index} className="text-gray-700 text-sm">
                        {subject}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No subjects set</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
                <p className="text-gray-600 text-sm">
                  {profile.bio || 'No bio provided'}
                </p>
                
                {profile.calendar_link && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-1">Calendar Link</h4>
                    <a 
                      href={profile.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View Calendar →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-3">While You Wait</h3>
          <div className="space-y-2 text-blue-700 text-sm">
            <p>• ✅ Ensure your calendar link is working and updated</p>
            <p>• ✅ Prepare teaching materials for your subjects</p>
            <p>• ✅ Review our tutoring guidelines (coming soon)</p>
            <p>• ✅ Set up your workspace for online sessions</p>
          </div>
        </div>
      </div>
    )
  }

  // Profile is approved and active
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-green-400 text-4xl mr-4">🎉</div>
          <div>
            <h2 className="text-xl font-bold text-green-800 mb-1">
              Welcome to the team, {user.name}!
            </h2>
            <p className="text-green-700">
              Your tutor profile is active and students can now book sessions with you.
            </p>
          </div>
          <Link
            href="/profile/edit"
            className="ml-auto bg-green-600 text-white px-4 py-2 rounded-md text-sm hover:bg-green-700"
          >
            Edit Profile
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">💰</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Earnings</p>
              <p className="text-2xl font-bold text-green-900">${totalEarnings}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">📅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Sessions</p>
              <p className="text-2xl font-bold text-blue-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Completed</p>
              <p className="text-2xl font-bold text-purple-900">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending Payout</p>
              <p className="text-2xl font-bold text-yellow-900">${unpaidEarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('sessions')}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                View All →
              </button>
              <button
                onClick={() => setShowLogForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
              >
                Log New Session
              </button>
            </div>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions logged yet</h3>
            <p className="text-gray-600 mb-4">
              Start by logging your first tutoring session.
            </p>
            <button
              onClick={() => setShowLogForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Log Your First Session
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {session.student?.user?.name || session.student_notes?.replace('Student name: ', '') || 'Unknown Student'}
                      </h4>
                      <p className="text-sm text-gray-600">{session.subject}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(session.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'no_show' ? 'No Show' : 
                         session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      <p className="text-sm font-medium mt-1">
                        Your earnings: ${session.status === 'completed' ? '25' : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Active Profile</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Teaching Subjects</h4>
              {profile.subjects && profile.subjects.length > 0 ? (
                <div className="space-y-1">
                  {profile.subjects.map((subject, index) => (
                    <div key={index} className="text-gray-700 text-sm">
                      {subject}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No subjects set</p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Bio</h4>
              <p className="text-gray-600 text-sm mb-4">
                {profile.bio || 'No bio provided'}
              </p>
              
              {profile.calendar_link && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Calendar</h4>
                  <a 
                    href={profile.calendar_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    View Booking Calendar →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-medium text-blue-800 mb-3">Ready to Start Teaching!</h3>
        <div className="space-y-2 text-blue-700 text-sm">
          <p>• Students can now find you in the tutor directory</p>
          <p>• Remember to log sessions after each tutoring appointment</p>
          <p>• Track your earnings and completed sessions in the Sessions tab</p>
          <p>• Monthly payouts are processed by admin</p>
        </div>
      </div>
    </div>
  )

  const renderSessions = () => (
    <div className="space-y-6">
      {/* Header with Log Session Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
        <button
          onClick={() => setShowLogForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Log New Session
        </button>
      </div>

      {/* Earnings Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">{completedSessions.length}</div>
          <div className="text-green-700 text-sm">Completed Sessions</div>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-900">${totalEarnings}</div>
          <div className="text-blue-700 text-sm">Total Earnings</div>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-900">${paidEarnings}</div>
          <div className="text-green-700 text-sm">Paid Out</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="text-2xl font-bold text-yellow-900">${unpaidEarnings}</div>
          <div className="text-yellow-700 text-sm">Pending Payout</div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Session History</h3>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions logged yet</h3>
            <p className="text-gray-600 mb-4">
              Start by logging your first tutoring session.
            </p>
            <button
              onClick={() => setShowLogForm(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Log Your First Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-gray-900">
                        {session.student?.user?.name || session.student_notes?.replace('Student name: ', '') || 'Unknown Student'}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed' ? 'bg-green-100 text-green-800' :
                        session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'no_show' ? 'No Show' : 
                         session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                      <p><strong>Subject:</strong> {session.subject}</p>
                      <p><strong>Date:</strong> {new Date(session.scheduled_at).toLocaleString()}</p>
                      <p><strong>Duration:</strong> {session.duration} minutes</p>
                      {session.notes && (
                        <p><strong>Notes:</strong> {session.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-gray-900">${session.price}</div>
                    {session.status === 'completed' && (
                      <div className="text-sm">
                        <div className={`${session.payment?.[0]?.tutor_paid ? 'text-green-600' : 'text-yellow-600'}`}>
                          Your earnings: $25
                        </div>
                        <div className="text-xs text-gray-500">
                          {session.payment?.[0]?.tutor_paid ? '✅ Paid' : '⏳ Pending'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )

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

// Log Session Form Component (inline for completeness)
function LogSessionForm({ onSessionLogged, onCancel }: { onSessionLogged: () => void, onCancel: () => void }) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [tutorProfile, setTutorProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '',
    scheduled_at: '',
    duration: 60,
    subject: '',
    status: 'completed' as 'completed' | 'no_show' | 'cancelled',
    notes: ''
  })

  useEffect(() => {
    fetchStudents()
    fetchTutorProfile()
    
    // Set default date/time to now
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setFormData(prev => ({ ...prev, scheduled_at: localDateTime }))
  }, [user])

  const fetchStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select(`
          id,
          user:users(name, email)
        `)
        .order('created_at', { ascending: false })

      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    }
  }

  const fetchTutorProfile = async () => {
    if (!user) return

    try {
      const { data } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setTutorProfile(data)
    } catch (error) {
      console.error('Error fetching tutor profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !tutorProfile) return

    setLoading(true)

    try {
      let studentId = formData.student_id

      if (!studentId && !formData.student_name.trim()) {
        alert('Please select a student or enter a student name')
        setLoading(false)
        return
      }

      // Create session record
      const sessionData = {
        student_id: studentId || null,
        tutor_id: tutorProfile.id,
        scheduled_at: formData.scheduled_at,
        duration: formData.duration,
        subject: formData.subject,
        status: formData.status,
        price: 50,
        notes: studentId ? formData.notes : `New student: ${formData.student_name}. ${formData.notes}`,
        student_notes: studentId ? null : `Student name: ${formData.student_name}`,
        created_at: new Date().toISOString()
      }

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single()

      if (sessionError) throw sessionError

      // Create payment record if session was completed
      if (formData.status === 'completed') {
        await supabase
          .from('payments')
          .insert({
            session_id: session.id,
            amount: 50,
            student_paid: false,
            tutor_paid: false,
            created_at: new Date().toISOString()
          })
      }

      alert('Session logged successfully!')
      onSessionLogged()

    } catch (error) {
      console.error('Error logging session:', error)
      alert('Error logging session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Log Session</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student *
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value, student_name: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select existing student...</option>
                {students.map((student) => {
                  console.log('Rendering student:', student)
                  return (
                    <option key={student.id} value={student.id}>
                      {student.user?.name || 'Unknown'} ({student.user?.email || 'No email'})
                    </option>
                  )
                })}
              </select>
              
              {students.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No students found. You can still enter a new student name below.
                </p>
              )}
              
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Or enter new student name"
                  value={formData.student_name}
                  onChange={(e) => setFormData({ ...formData, student_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  New students will need to create an account later
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes) *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select subject...</option>
                {APPROVED_SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="completed">Completed</option>
                <option value="no_show">Student No-Show</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes (optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Any additional notes about the session..."
              />
            </div>

            {/* Pricing Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Rate:</strong> $50/hour • <strong>Your earnings:</strong> $25/hour
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Payment tracking will be handled by admin
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Logging...' : 'Log Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}