'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'
import Link from 'next/link'

interface StudentDashboardProps {
  user: User
}

export default function StudentDashboard({ user }: StudentDashboardProps) {
  const [sessions, setSessions] = useState<any[]>([])
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview')

  useEffect(() => {
    fetchStudentProfile()
  }, [user.id])

  useEffect(() => {
    if (studentProfile) {
      fetchSessions()
    }
  }, [studentProfile])

  const fetchStudentProfile = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single()

      setStudentProfile(data)
    } catch (error) {
      console.error('Error fetching student profile:', error)
    }
  }

  const fetchSessions = async () => {
    if (!studentProfile) {
      // If no student profile, still finish loading
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
        .limit(5) // Get recent 5 for overview

      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllSessions = async () => {
    if (!studentProfile) return []

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

      return data || []
    } catch (error) {
      console.error('Error fetching all sessions:', error)
      return []
    }
  }

  // Calculate metrics
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduled_at) > new Date()
  )
  const totalSpent = completedSessions.reduce((sum, session) => sum + (session.price || 0), 0)
  const unpaidAmount = completedSessions
    .filter(s => !s.payment?.[0]?.student_paid)
    .reduce((sum, session) => sum + (session.price || 0), 0)

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-blue-800 mb-2">
          Welcome back, {user.name}! 📚
        </h2>
        <p className="text-blue-700">
          Ready to continue your learning journey? Book a session with one of our tutors or review your progress.
        </p>
      </div>

      {/* Payment Due Alert */}
      {unpaidAmount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="text-red-400 text-xl mr-3">💳</div>
            <div>
              <h3 className="text-red-800 font-medium">Payment Due: ${unpaidAmount}</h3>
              <p className="text-red-700 text-sm mt-1">
                You have outstanding payments for completed tutoring sessions. Please contact admin to arrange payment.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">📅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Total Sessions</p>
              <p className="text-2xl font-bold text-green-900">{sessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Completed</p>
              <p className="text-2xl font-bold text-blue-900">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">💰</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Total Spent</p>
              <p className="text-2xl font-bold text-purple-900">${totalSpent}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Amount Due</p>
              <p className="text-2xl font-bold text-red-900">${unpaidAmount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Information Section */}
      {(unpaidAmount > 0 || completedSessions.length > 0) && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
          </div>
          <div className="p-6">
            {unpaidAmount > 0 ? (
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-2">Outstanding Balance: ${unpaidAmount}</h4>
                  <p className="text-sm text-red-700 mb-3">
                    Please send payment for your completed tutoring sessions.
                  </p>
                  
                  {/* Payment Instructions */}
                  <div className="bg-white p-4 rounded border">
                    <h5 className="font-medium text-gray-900 mb-2">Payment Instructions</h5>
                    <div className="text-sm space-y-1">
                      <p><strong>Method:</strong> E-transfer</p>
                      <p><strong>Send to:</strong> <span className="font-mono bg-gray-100 px-2 py-1 rounded">payments@tutoring.com</span></p>
                      <p><strong>Message:</strong> Include your name and "tutoring payment"</p>
                      <p><strong>Amount:</strong> ${unpaidAmount}</p>
                    </div>
                  </div>
                </div>
                
                {/* Unpaid Sessions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Unpaid Sessions</h4>
                  <div className="space-y-2">
                    {completedSessions
                      .filter(s => !s.payment?.[0]?.student_paid)
                      .map(session => (
                        <div key={session.id} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                          <div>
                            <span className="text-sm font-medium">{session.subject}</span>
                            <span className="text-sm text-gray-500 ml-2">
                              {new Date(session.scheduled_at).toLocaleDateString()}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-red-600">${session.price}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="text-green-400 text-4xl mb-2">✅</div>
                <h4 className="font-medium text-green-800">All payments up to date!</h4>
                <p className="text-sm text-green-600">You have no outstanding balances.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Sessions */}
      {upcomingSessions.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Upcoming Sessions</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {upcomingSessions.map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {session.subject} with {(session.tutor as any)?.user?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
                        {new Date(session.scheduled_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-500">{session.duration} minutes</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Scheduled
                      </span>
                      <p className="text-sm font-medium mt-1">${session.price}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Recent Sessions</h3>
            <button
              onClick={() => setActiveTab('sessions')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              View All →
            </button>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
            <p className="text-gray-600 mb-4">
              Ready to start learning? Browse our tutors and book your first session.
            </p>
            <Link
              href="/tutors"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Find a Tutor
            </Link>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {session.subject} with {(session.tutor as any)?.user?.name}
                      </h4>
                      <p className="text-sm text-gray-600">
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
                      <p className="text-sm font-medium mt-1">${session.price}</p>
                      {session.status === 'completed' && (
                        <p className="text-xs mt-1">
                          {session.payment?.[0]?.student_paid ? 
                            <span className="text-green-600">✅ Paid</span> : 
                            <span className="text-red-600">💳 Payment Due</span>
                          }
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/tutors"
          className="bg-blue-600 text-white p-6 rounded-lg hover:bg-blue-700 transition-colors text-center"
        >
          <div className="text-2xl mb-2">🔍</div>
          <h3 className="font-semibold mb-1">Find a Tutor</h3>
          <p className="text-blue-100 text-sm">Browse our qualified tutors and book a session</p>
        </Link>

        <button
          onClick={() => setActiveTab('sessions')}
          className="bg-green-600 text-white p-6 rounded-lg hover:bg-green-700 transition-colors text-center"
        >
          <div className="text-2xl mb-2">📚</div>
          <h3 className="font-semibold mb-1">View My Sessions</h3>
          <p className="text-green-100 text-sm">See your session history and upcoming bookings</p>
        </button>
      </div>
    </div>
  )

  const renderSessions = () => {
    const [allSessions, setAllSessions] = useState<any[]>([])
    const [sessionsLoading, setSessionsLoading] = useState(true)

    useEffect(() => {
      const loadAllSessions = async () => {
        const data = await fetchAllSessions()
        setAllSessions(data)
        setSessionsLoading(false)
      }
      loadAllSessions()
    }, [])

    if (sessionsLoading) {
      return (
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      )
    }

    const completedSessions = allSessions.filter(s => s.status === 'completed')
    const totalSpent = completedSessions.reduce((sum, session) => sum + (session.price || 0), 0)
    const paidAmount = completedSessions
      .filter(s => s.payment?.[0]?.student_paid)
      .reduce((sum, session) => sum + (session.price || 0), 0)
    const unpaidAmount = totalSpent - paidAmount

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">My Sessions</h2>
          <Link
            href="/tutors"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Book New Session
          </Link>
        </div>

        {/* Payment Alert */}
        {unpaidAmount > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="text-red-400 text-xl mr-3">💳</div>
              <div className="flex-1">
                <h3 className="text-red-800 font-medium">Outstanding Balance: ${unpaidAmount}</h3>
                <p className="text-red-700 text-sm mt-1">
                  Please send e-transfer payment to: <span className="font-mono bg-white px-2 py-1 rounded">payments@tutoring.com</span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Spending Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-900">{allSessions.length}</div>
            <div className="text-blue-700 text-sm">Total Sessions</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-900">{completedSessions.length}</div>
            <div className="text-green-700 text-sm">Completed Sessions</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-900">${totalSpent}</div>
            <div className="text-purple-700 text-sm">Total Spent</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-900">${unpaidAmount}</div>
            <div className="text-red-700 text-sm">Amount Due</div>
          </div>
        </div>

        {/* Sessions List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Session History</h3>
          </div>
          
          {allSessions.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-4xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-4">
                Ready to start learning? Browse our tutors and book your first session.
              </p>
              <Link
                href="/tutors"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Find a Tutor
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {allSessions.map((session) => (
                <div key={session.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-lg font-medium text-gray-900">
                          {(session.tutor as any)?.user?.name || 'Tutor'}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.status === 'completed' ? 'bg-green-100 text-green-800' :
                          session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                          session.status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {session.status === 'no_show' ? 'No Show' : 
                           session.status === 'completed' ? 'Completed' :
                           session.status === 'cancelled' ? 'Cancelled' :
                           session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Subject:</strong> {session.subject}</p>
                        <p><strong>Date:</strong> {new Date(session.scheduled_at).toLocaleString()}</p>
                        <p><strong>Duration:</strong> {session.duration} minutes</p>
                        {session.notes && !session.notes.includes('New student:') && (
                          <p><strong>Notes:</strong> {session.notes}</p>
                        )}
                      </div>

                      {/* Show upcoming session info */}
                      {session.status === 'scheduled' && new Date(session.scheduled_at) > new Date() && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
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
                      <div className="text-lg font-bold text-gray-900">${session.price || 50}</div>
                      {(session.status === 'completed' || session.status === 'no_show') && (
                        <div className="text-sm">
                          <div className={`${session.payment?.[0]?.student_paid ? 'text-green-600' : 'text-red-600'}`}>
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

        {/* Payment Instructions */}
        {unpaidAmount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Payment Instructions</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. Send e-transfer for ${unpaidAmount} to: <span className="font-mono bg-white px-2 py-1 rounded">payments@tutoring.com</span></p>
              <p>2. Include your name and "tutoring payment" in the message</p>
              <p>3. Payment will be marked as received within 24 hours</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return <div className="p-6">Loading your dashboard...</div>
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
              {unpaidAmount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Due
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'sessions' && renderSessions()}
    </div>
  )
}