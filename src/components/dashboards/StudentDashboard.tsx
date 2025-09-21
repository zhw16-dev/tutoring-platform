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
  const [sessions, setSessions] = useState<any[]>([])
  const [allSessions, setAllSessions] = useState<any[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sessionsLoading, setSessionsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'profile'>('overview')
  const [loginCount, setLoginCount] = useState(0)

  useEffect(() => {
    fetchStudentProfile()
    // Get login count from localStorage
    const count = parseInt(localStorage.getItem(`loginCount_${user.id}`) || '0')
    setLoginCount(count)
    // Increment login count
    localStorage.setItem(`loginCount_${user.id}`, (count + 1).toString())
  }, [user.id])

  useEffect(() => {
    if (studentProfile) {
      fetchSessions()
    }
  }, [studentProfile])

  useEffect(() => {
    if (activeTab === 'sessions' && studentProfile) {
      fetchAllSessions()
    }
  }, [activeTab, studentProfile])

  const fetchStudentProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching student profile:', error)
      }

      if (data) {
        setStudentProfile(data)
      } else {
        // Create student profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from('students')
          .insert({
            user_id: user.id
          })
          .select('id')
          .single()

        if (createError) {
          console.error('Error creating student profile:', createError)
        } else {
          setStudentProfile(newProfile)
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error)
    }
  }


const handleProfileUpdated = () => {
  setActiveTab('overview')
  // Optionally refresh any profile-dependent data
  fetchStudentProfile()
}

  const fetchSessions = async () => {
    if (!studentProfile) {
      setLoading(false)
      return
    }

    try {
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_profiles(
            user:users(name, email)
          ),
          payment:payments(id, student_paid, tutor_paid, amount)
        `)
        .eq('student_id', studentProfile.id)
        .order('scheduled_at', { ascending: false })
        .limit(5)

      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllSessions = async () => {
    if (!studentProfile) return

    setSessionsLoading(true)
    try {
      const { data } = await supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_profiles(
            user:users(name, email)
          ),
          payment:payments(id, student_paid, tutor_paid, amount)
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

  // Calculate metrics - Focus on progress, not spending
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  )
  
  // Only calculate unpaid amount for actionable payment alerts (not display in stats)
  const unpaidAmount = completedSessions
    .filter(s => !s.payment?.[0]?.student_paid)
    .reduce((sum, session) => sum + (session.price || 0), 0)

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Actions - Moved to Top */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/tutors"
          className="bg-sage-green text-white p-6 rounded-lg hover:bg-forest-green transition-colors text-center shadow-soft"
        >
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold mb-1 text-cream">Find a Tutor</h3>
          <p className="text-cream opacity-80 text-sm">Browse our qualified tutors and book a session</p>
        </Link>

        <button
          onClick={() => setActiveTab('sessions')}
          className="bg-golden-yellow text-forest-green p-6 rounded-lg hover:bg-golden-yellow-dark transition-colors text-center shadow-soft"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold mb-1">View My Sessions</h3>
          <p className="text-forest-green opacity-80 text-sm">See your session history and upcoming bookings</p>
        </button>
      </div>

      {/* Welcome Section - Only show for first 5 logins */}
      {loginCount <= 5 && (
        <div className="bg-sage-green-light border border-sage-green rounded-lg p-6">
          <h2 className="text-xl font-bold text-forest-green mb-2">
            Welcome back, {user.name}! 📚
          </h2>
          <p className="text-forest-green">
            Ready to continue your learning journey? Book a session with one of our tutors or review your progress.
          </p>
        </div>
      )}

      {/* Learning Progress Stats - Focus on achievements, not spending */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <div className="flex items-center">
            <div className="p-2 bg-sage-green-light rounded-md">📅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-sage-green">Total Sessions</p>
              <p className="text-2xl font-bold text-forest-green">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <div className="flex items-center">
            <div className="p-2 bg-sage-green-light rounded-md">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-sage-green">Completed</p>
              <p className="text-2xl font-bold text-forest-green">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <div className="flex items-center">
            <div className="p-2 bg-golden-yellow-light rounded-md">⭐</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Learning Hours</p>
              <p className="text-2xl font-bold text-forest-green">
                {Math.round(completedSessions.reduce((sum, s) => sum + (s.duration || 60), 0) / 60)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
          <div className="p-6 border-b border-sage-green-light">
            <h3 className="text-lg font-medium text-forest-green">Upcoming Sessions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="border border-sage-green-light rounded-lg p-4 bg-cream">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-forest-green">
                        {session.subject} with {(session.tutor as any)?.user?.name}
                      </h4>
                      <p className="text-sm text-forest-green opacity-80">
                        {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                        {new Date(session.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-forest-green opacity-60">{session.duration} minutes</p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium bg-sage-green text-cream rounded-full">
                      Scheduled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="p-6 border-b border-sage-green-light">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-forest-green">Recent Sessions</h3>
            <button
              onClick={() => setActiveTab('sessions')}
              className="text-sage-green hover:text-forest-green text-sm font-medium"
            >
              View All →
            </button>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sage-green text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-forest-green mb-2">No sessions yet</h3>
            <p className="text-forest-green opacity-80 mb-4">
              Ready to start learning? Browse our tutors and book your first session.
            </p>
            <Link
              href="/tutors"
              className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
            >
              Find a Tutor
            </Link>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="border border-sage-green-light rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-forest-green">
                        {session.subject} with {(session.tutor as any)?.user?.name}
                      </h4>
                      <p className="text-sm text-forest-green opacity-80">
                        {new Date(session.scheduled_at).toLocaleDateString()}
                      </p>
                      {session.notes && (
                        <p className="text-sm text-forest-green opacity-70 mt-1">
                          <strong>Notes:</strong> {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed' ? 'bg-sage-green text-cream' :
                        session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'no_show' ? 'No Show' : 
                         session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Contact Support Section */}
            <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
              <div className="p-6 border-b border-sage-green-light">
                <h3 className="text-lg font-medium text-forest-green">Need Help?</h3>
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-sage-green-light rounded-md">📞</div>
                  <div>
                    <h4 className="font-medium text-forest-green mb-1">Contact Support</h4>
                    <p className="text-forest-green text-sm mb-2">Have questions or need assistance? We're here to help!</p>
                    <div className="space-y-1 text-sm">
                      <p className="text-forest-green">
                        📧 Email: <a href="mailto:wzhai0516@gmail.com" className="text-sage-green hover:text-forest-green font-medium">wzhai0516@gmail.com</a>
                      </p>
                      <p className="text-forest-green">
                        📱 Phone: <a href="tel:4377751220" className="text-sage-green hover:text-forest-green font-medium">437 775 1220</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>


      {/* Payment Due Alert - Only show if there are actually unpaid amounts */}
      {unpaidAmount > 0 && (
        <div className="bg-golden-yellow-light border border-golden-yellow rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-golden-yellow text-xl mr-3">💳</div>
            <div>
              <h3 className="text-forest-green font-medium">Payment Due: ${unpaidAmount}</h3>
              <p className="text-forest-green text-sm mt-1">
                Please contact the admin to arrange payment for your completed sessions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
    const renderProfile = () => (
    <div className="max-w-2xl">
      <StudentProfileEdit
        user={user}
        onProfileUpdated={handleProfileUpdated}
        onCancel={() => setActiveTab('overview')}
      />
    </div>
)
  const renderSessions = () => {
    if (sessionsLoading) {
      return (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-sage-green-light rounded w-1/4"></div>
            <div className="h-4 bg-sage-green-light rounded"></div>
            <div className="h-4 bg-sage-green-light rounded w-5/6"></div>
          </div>
        </div>
      )
    }

    const completedSessions = allSessions.filter(s => s.status === 'completed')
    
    // Calculate totals only for sessions view (not prominent display)
    const totalSpent = completedSessions.reduce((sum, session) => sum + (session.price || 0), 0)
    const paidAmount = completedSessions
      .filter(s => s.payment?.[0]?.student_paid)
      .reduce((sum, session) => sum + (session.price || 0), 0)
    const unpaidAmount = totalSpent - paidAmount

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-forest-green">My Learning Journey</h2>
          <Link
            href="/tutors"
            className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
          >
            Book New Session
          </Link>
        </div>

        {/* Learning Progress Summary - Focus on achievements */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-sage-green-light rounded-lg p-4">
            <div className="text-2xl font-bold text-forest-green">{allSessions.length}</div>
            <div className="text-forest-green text-sm">Total Sessions</div>
          </div>
          <div className="bg-sage-green-light rounded-lg p-4">
            <div className="text-2xl font-bold text-forest-green">{completedSessions.length}</div>
            <div className="text-forest-green text-sm">Completed Sessions</div>
          </div>
          <div className="bg-golden-yellow-light rounded-lg p-4">
            <div className="text-2xl font-bold text-forest-green">
              {Math.round(completedSessions.reduce((sum, s) => sum + (s.duration || 60), 0) / 60)}
            </div>
            <div className="text-forest-green text-sm">Learning Hours</div>
          </div>
          <div className="bg-golden-yellow-light rounded-lg p-4">
            <div className="text-2xl font-bold text-forest-green">
              {new Set(completedSessions.map(s => s.subject)).size}
            </div>
            <div className="text-forest-green text-sm">Subjects Studied</div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
          <div className="p-6 border-b border-sage-green-light">
            <h3 className="text-lg font-medium text-forest-green">Session History</h3>
          </div>
          
          {allSessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-sage-green text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-forest-green mb-2">No sessions yet</h3>
              <p className="text-forest-green opacity-80 mb-4">
                Ready to start learning? Browse our tutors and book your first session.
              </p>
              <Link
                href="/tutors"
                className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
              >
                Find a Tutor
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-sage-green-light">
              {allSessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-forest-green">
                          {(session.tutor as any)?.user?.name || 'Tutor'}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.status === 'completed' ? 'bg-sage-green text-cream' :
                          session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                          session.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-sage-green-light text-forest-green'
                        }`}>
                          {session.status === 'no_show' ? 'No Show' : 
                           session.status === 'completed' ? 'Completed' :
                           session.status === 'cancelled' ? 'Cancelled' :
                           session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-forest-green opacity-80 space-y-1">
                        <p><strong>Subject:</strong> {session.subject}</p>
                        <p><strong>Date:</strong> {new Date(session.scheduled_at).toLocaleString()}</p>
                        <p><strong>Duration:</strong> {session.duration} minutes</p>
                        {session.notes && !session.notes.includes('New student:') && (
                          <p><strong>Session Notes:</strong> {session.notes}</p>
                        )}
                      </div>

                      {/* Show upcoming session info */}
                      {session.status === 'scheduled' && new Date(session.scheduled_at) > new Date() && (
                        <div className="mt-3 p-3 bg-sage-green-light rounded-lg">
                          <p className="text-sm text-forest-green">
                            <strong>Upcoming Session</strong> - Make sure to attend on time!
                          </p>
                        </div>
                      )}

                      {/* Show if student was marked as no-show */}
                      {session.status === 'no_show' && (
                        <div className="mt-3 p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-800">
                            <strong>Marked as No-Show</strong> - If this is incorrect, please contact support.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right ml-4">
                      {/* Show payment status but not prominently */}
                      {(session.status === 'completed' || session.status === 'no_show') && (
                        <div className="text-sm">
                          <div className={`${session.payment?.[0]?.student_paid ? 'text-sage-green' : 'text-red-600'}`}>
                            {session.payment?.[0]?.student_paid ? '✅ Paid' : '💳 Payment Due'}
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

        {/* Payment Instructions - Only show if there are unpaid amounts */}
        {unpaidAmount > 0 && (
          <div className="bg-golden-yellow-light border border-golden-yellow rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-golden-yellow text-xl mr-3">💳</div>
              <div>
                <h3 className="text-forest-green font-medium">Payment Due: ${unpaidAmount}</h3>
                <p className="text-forest-green text-sm mt-1">
                  Please contact the admin to arrange payment for your completed sessions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="p-6 text-forest-green">Loading your dashboard...</div>
  }

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="border-b border-sage-green-light">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              📊 Overview
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              📚 My Learning Journey
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'profile'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              ⚙️ Edit Profile
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
     {activeTab === 'sessions' && renderSessions()}
      {activeTab === 'profile' && renderProfile()}
      
    </div>
  )
}