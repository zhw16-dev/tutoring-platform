'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User, TutorProfile } from '@/types/database'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface TutorDashboardProps {
  user: User
}

export default function TutorDashboard({ user }: TutorDashboardProps) {
  const [profile, setProfile] = useState<TutorProfile | null>(null)
  const [sessions, setSessions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showLogForm, setShowLogForm] = useState(false)
  const [showBatchComplete, setShowBatchComplete] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions'>('overview')
  const [loginCount, setLoginCount] = useState(0)
  const [editingSession, setEditingSession] = useState<any>(null)

  useEffect(() => {
    fetchTutorProfile()
    // Get login count from localStorage
    const count = parseInt(localStorage.getItem(`loginCount_${user.id}`) || '0')
    setLoginCount(count)
    // Increment login count
    localStorage.setItem(`loginCount_${user.id}`, (count + 1).toString())
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
    setEditingSession(null)
    fetchSessions()
  }

  const updateSessionStatus = async (sessionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status: newStatus })
        .eq('id', sessionId)

      if (error) throw error

      // Create payment record if marking as completed
      if (newStatus === 'completed') {
        const { error: paymentError } = await supabase
          .from('payments')
          .upsert({
            session_id: sessionId,
            amount: 50,
            student_paid: false,
            tutor_paid: false,
            created_at: new Date().toISOString()
          })

        if (paymentError) {
          console.error('Payment creation error:', paymentError)
        }
      }

      await fetchSessions()
    } catch (error) {
      console.error('Error updating session:', error)
      alert('Error updating session status')
    }
  }

  const batchCompleteToday = async () => {
    if (!profile) return

    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Get today's scheduled sessions
      const todaySessions = sessions.filter(session => {
        const sessionDate = new Date(session.scheduled_at)
        return sessionDate >= today && 
               sessionDate < tomorrow && 
               session.status === 'scheduled'
      })

      if (todaySessions.length === 0) {
        alert('No scheduled sessions for today to mark complete.')
        return
      }

      // Update all today's scheduled sessions to completed
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'completed' })
        .in('id', todaySessions.map(s => s.id))

      if (error) throw error

      // Create payment records for completed sessions
      const paymentPromises = todaySessions.map(session => 
        supabase
          .from('payments')
          .upsert({
            session_id: session.id,
            amount: 50,
            student_paid: false,
            tutor_paid: false,
            created_at: new Date().toISOString()
          })
      )

      await Promise.all(paymentPromises)

      alert(`✅ Marked ${todaySessions.length} session(s) as completed!`)
      setShowBatchComplete(false)
      await fetchSessions()
    } catch (error) {
      console.error('Error batch completing sessions:', error)
      alert('Error completing sessions. Please try again.')
    }
  }

  // Calculate earnings (only show tutor earnings, not full price)
  const completedSessions = sessions.filter(s => s.status === 'completed')
  const totalEarnings = completedSessions.length * 25 // Show only tutor earnings
  const paidEarnings = completedSessions.filter(s => s.payment?.[0]?.tutor_paid).length * 25
  const unpaidEarnings = totalEarnings - paidEarnings

  if (loading) {
    return <div className="p-6 text-forest-green">Loading your dashboard...</div>
  }

  // No profile exists - needs setup
  if (!profile) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🎓</div>
        <h2 className="text-xl font-medium text-forest-green mb-4">
          Complete Your Tutor Profile
        </h2>
        <p className="text-forest-green opacity-80 mb-6">
          Set up your subjects, pricing, and bio to start your application process.
        </p>
        <Link
          href="/profile/setup"
          className="bg-sage-green text-cream px-6 py-2 rounded-md hover:bg-forest-green transition-colors"
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
        <div className="bg-golden-yellow-light border border-golden-yellow rounded-lg p-6">
          <div className="text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-xl font-medium text-forest-green mb-2">
              Profile Submitted for Review
            </h2>
            <p className="text-forest-green mb-6">
              Your tutor profile has been submitted and is currently under review by our admin team. 
              You'll receive an email notification once your profile is approved and activated.
            </p>
            <div className="bg-cream rounded-lg p-4 mb-6 border border-sage-green-light">
              <h3 className="font-medium text-forest-green mb-2">Review typically takes:</h3>
              <p className="text-forest-green text-sm">• 24-48 hours during business days</p>
              <p className="text-forest-green text-sm">• We may contact you if additional information is needed</p>
            </div>
          </div>
        </div>

        {/* Profile Summary */}
        <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
          <div className="p-6 border-b border-sage-green-light">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-forest-green">Your Submitted Profile</h3>
              <Link
                href="/profile/edit"
                className="text-sage-green hover:text-forest-green text-sm font-medium"
              >
                Edit Profile
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-forest-green mb-2">Teaching Subjects</h4>
                {profile.subjects && profile.subjects.length > 0 ? (
                  <div className="space-y-1">
                    {profile.subjects.map((subject, index) => (
                      <div key={index} className="text-forest-green text-sm">
                        {subject}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-forest-green opacity-60 text-sm">No subjects set</p>
                )}
              </div>

              <div>
                <h4 className="font-medium text-forest-green mb-2">Bio</h4>
                <p className="text-forest-green text-sm">
                  {profile.bio || 'No bio provided'}
                </p>
                
                {profile.calendar_link && (
                  <div className="mt-4">
                    <h4 className="font-medium text-forest-green mb-1">Calendar Link</h4>
                    <a 
                      href={profile.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-green hover:text-forest-green text-sm"
                    >
                      View Calendar →
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
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
                <p className="text-forest-green text-sm mb-2">Have questions about your application or need assistance?</p>
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

        {/* Next Steps */}
        <div className="bg-sage-green-light border border-sage-green rounded-lg p-6">
          <h3 className="font-medium text-forest-green mb-3">While You Wait</h3>
          <div className="space-y-2 text-forest-green text-sm">
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
      {/* Welcome Section - Only show for first 5 logins */}
      {loginCount <= 5 && (
        <div className="bg-sage-green-light border border-sage-green rounded-lg p-6">
          <div className="flex items-center">
            <div className="text-sage-green text-4xl mr-4">🎉</div>
            <div>
              <h2 className="text-xl font-bold text-forest-green mb-1">
                Welcome to the team, {user.name}!
              </h2>
              <p className="text-forest-green">
                Your tutor profile is active and students can now book sessions with you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats - Focus on earnings only */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <div className="flex items-center">
            <div className="p-2 bg-sage-green-light rounded-md">💰</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-sage-green">Your Earnings</p>
              <p className="text-2xl font-bold text-forest-green">${totalEarnings}</p>
            </div>
          </div>
        </div>

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
            <div className="p-2 bg-golden-yellow-light rounded-md">✅</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Completed</p>
              <p className="text-2xl font-bold text-forest-green">{completedSessions.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <div className="flex items-center">
            <div className="p-2 bg-golden-yellow-light rounded-md">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Pending Payout</p>
              <p className="text-2xl font-bold text-forest-green">${unpaidEarnings}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Sessions */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="p-6 border-b border-sage-green-light">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-forest-green">Recent Sessions</h3>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('sessions')}
                className="text-sage-green hover:text-forest-green text-sm font-medium"
              >
                View All →
              </button>
              <button
                onClick={() => setShowBatchComplete(true)}
                className="bg-golden-yellow text-forest-green px-3 py-1 rounded-md hover:bg-golden-yellow-dark text-sm transition-colors"
              >
                Complete Today's Sessions
              </button>
              <button
                onClick={() => setShowLogForm(true)}
                className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green text-sm transition-colors"
              >
                Log New Session
              </button>
            </div>
          </div>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sage-green text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-forest-green mb-2">No sessions logged yet</h3>
            <p className="text-forest-green opacity-80 mb-4">
              Start by logging your first tutoring session.
            </p>
            <button
              onClick={() => setShowLogForm(true)}
              className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
            >
              Log Your First Session
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="space-y-4">
              {sessions.slice(0, 3).map((session) => (
                <div key={session.id} className="border border-sage-green-light rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-forest-green">
                        {session.student?.user?.name || session.student_notes?.replace('Student name: ', '') || 'Unknown Student'}
                      </h4>
                      <p className="text-sm text-forest-green opacity-80">{session.subject}</p>
                      <p className="text-sm text-forest-green opacity-60">
                        {new Date(session.scheduled_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed' ? 'bg-sage-green text-cream' :
                        session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'no_show' ? 'No Show' : 
                         session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      <p className="text-sm font-medium mt-1 text-forest-green">
                        You earn: ${session.status === 'completed' ? '25' : session.status === 'scheduled' ? '25' : '0'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Profile Summary with Edit Button */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="p-6 border-b border-sage-green-light">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-forest-green">Your Active Profile</h3>
            <Link
              href="/profile/edit"
              className="bg-sage-green text-cream px-4 py-2 rounded-md text-sm hover:bg-forest-green transition-colors"
            >
              Edit Profile
            </Link>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-forest-green mb-2">Teaching Subjects</h4>
              {profile.subjects && profile.subjects.length > 0 ? (
                <div className="space-y-1">
                  {profile.subjects.map((subject, index) => (
                    <div key={index} className="text-forest-green text-sm">
                      {subject}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-forest-green opacity-60 text-sm">No subjects set</p>
              )}
            </div>

            <div>
              <h4 className="font-medium text-forest-green mb-2">Bio</h4>
              <p className="text-forest-green text-sm mb-4">
                {profile.bio || 'No bio provided'}
              </p>
              
              {profile.calendar_link && (
                <div>
                  <h4 className="font-medium text-forest-green mb-1">Calendar</h4>
                  <a 
                    href={profile.calendar_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sage-green hover:text-forest-green text-sm"
                  >
                    View Booking Calendar →
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
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

      {/* Getting Started */}
      <div className="bg-sage-green-light border border-sage-green rounded-lg p-6">
        <h3 className="font-medium text-forest-green mb-3">Ready to Start Teaching!</h3>
        <div className="space-y-2 text-forest-green text-sm">
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
      {/* Header with Actions */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-forest-green">My Sessions</h2>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowBatchComplete(true)}
            className="bg-golden-yellow text-forest-green px-4 py-2 rounded-md hover:bg-golden-yellow-dark transition-colors"
          >
            Complete Today's Sessions
          </button>
          <button
            onClick={() => setShowLogForm(true)}
            className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
          >
            Log New Session
          </button>
        </div>
      </div>

      {/* Earnings Summary - Focus on tutor earnings only */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-sage-green-light rounded-lg p-4">
          <div className="text-2xl font-bold text-forest-green">{completedSessions.length}</div>
          <div className="text-forest-green text-sm">Completed Sessions</div>
        </div>
        <div className="bg-sage-green-light rounded-lg p-4">
          <div className="text-2xl font-bold text-forest-green">${totalEarnings}</div>
          <div className="text-forest-green text-sm">Your Total Earnings</div>
        </div>
        <div className="bg-sage-green-light rounded-lg p-4">
          <div className="text-2xl font-bold text-forest-green">${paidEarnings}</div>
          <div className="text-forest-green text-sm">Paid Out</div>
        </div>
        <div className="bg-golden-yellow-light rounded-lg p-4">
          <div className="text-2xl font-bold text-forest-green">${unpaidEarnings}</div>
          <div className="text-forest-green text-sm">Pending Payout</div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="p-6 border-b border-sage-green-light">
          <h3 className="text-lg font-medium text-forest-green">Session History</h3>
        </div>
        
        {sessions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-sage-green text-4xl mb-4">📚</div>
            <h3 className="text-lg font-medium text-forest-green mb-2">No sessions logged yet</h3>
            <p className="text-forest-green opacity-80 mb-4">
              Start by logging your first tutoring session.
            </p>
            <button
              onClick={() => setShowLogForm(true)}
              className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
            >
              Log Your First Session
            </button>
          </div>
        ) : (
          <div className="divide-y divide-sage-green-light">
            {sessions.map((session) => (
              <div key={session.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-forest-green">
                        {session.student?.user?.name || session.student_notes?.replace('Student name: ', '') || 'Unknown Student'}
                      </h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.status === 'completed' ? 'bg-sage-green text-cream' :
                        session.status === 'no_show' ? 'bg-red-100 text-red-800' :
                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {session.status === 'no_show' ? 'No Show' : 
                         session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                      </span>
                      {session.status !== 'completed' && (
                        <button
                          onClick={() => setEditingSession(session)}
                          className="text-sage-green hover:text-forest-green text-xs"
                        >
                          Edit Status
                        </button>
                      )}
                    </div>
                    
                    <div className="text-sm text-forest-green opacity-80 space-y-1">
                      <p><strong>Subject:</strong> {session.subject}</p>
                      <p><strong>Date:</strong> {new Date(session.scheduled_at).toLocaleString()}</p>
                      <p><strong>Duration:</strong> {session.duration} minutes</p>
                      {session.notes && (
                        <p><strong>Notes:</strong> {session.notes}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    <div className="text-lg font-bold text-forest-green">
                      You earn: ${session.status === 'completed' ? '25' : session.status === 'scheduled' ? '25' : '0'}
                    </div>
                    {session.status === 'completed' && (
                      <div className="text-sm">
                        <div className={`${session.payment?.[0]?.tutor_paid ? 'text-sage-green' : 'text-golden-yellow'}`}>
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
              📚 My Sessions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'sessions' && renderSessions()}

      {/* Batch Complete Modal */}
      {showBatchComplete && (
        <BatchCompleteModal
          onComplete={batchCompleteToday}
          onCancel={() => setShowBatchComplete(false)}
          todaySessions={sessions.filter(session => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const tomorrow = new Date(today)
            tomorrow.setDate(tomorrow.getDate() + 1)
            const sessionDate = new Date(session.scheduled_at)
            return sessionDate >= today && 
                   sessionDate < tomorrow && 
                   session.status === 'scheduled'
          })}
        />
      )}

      {/* Log/Edit Session Modal */}
      {(showLogForm || editingSession) && (
        <LogSessionForm
          tutorProfile={profile}
          editingSession={editingSession}
          onSessionLogged={handleSessionLogged}
          onCancel={() => {
            setShowLogForm(false)
            setEditingSession(null)
          }}
        />
      )}
    </div>
  )
}

// Batch Complete Modal Component
function BatchCompleteModal({ 
  onComplete, 
  onCancel, 
  todaySessions 
}: { 
  onComplete: () => void
  onCancel: () => void
  todaySessions: any[]
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-cream rounded-lg shadow-xl max-w-md w-full border border-sage-green-light">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-forest-green mb-4">
            Complete Today's Sessions
          </h2>
          
          {todaySessions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-forest-green mb-4">No scheduled sessions for today to mark complete.</p>
              <button
                onClick={onCancel}
                className="bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <>
              <p className="text-forest-green mb-4">
                This will mark <strong>{todaySessions.length} session(s)</strong> as completed:
              </p>
              
              <div className="bg-sage-green-light rounded-lg p-3 mb-4 max-h-32 overflow-y-auto">
                {todaySessions.map((session, index) => (
                  <div key={session.id} className="text-sm text-forest-green">
                    {index + 1}. {session.student?.user?.name || 'Unknown'} - {session.subject}
                  </div>
                ))}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={onComplete}
                  className="flex-1 bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-colors"
                >
                  Complete All
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// Enhanced Log Session Form Component
function LogSessionForm({ 
  tutorProfile, 
  editingSession,
  onSessionLogged, 
  onCancel 
}: { 
  tutorProfile: TutorProfile
  editingSession?: any
  onSessionLogged: () => void
  onCancel: () => void 
}) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [formData, setFormData] = useState({
    student_id: editingSession?.student_id || '',
    scheduled_at: editingSession?.scheduled_at ? new Date(editingSession.scheduled_at).toISOString().slice(0, 16) : '',
    duration: editingSession?.duration || 60,
    subject: editingSession?.subject || '',
    status: editingSession?.status || 'scheduled' as 'scheduled' | 'completed' | 'no_show' | 'cancelled',
    notes: editingSession?.notes || ''
  })

  useEffect(() => {
    fetchStudents()
    
    if (!editingSession) {
      // Set default date/time to now with 15-minute intervals
      const now = new Date()
      const minutes = now.getMinutes()
      const roundedMinutes = Math.round(minutes / 15) * 15
      now.setMinutes(roundedMinutes, 0, 0)
      
      const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      setFormData(prev => ({ ...prev, scheduled_at: localDateTime }))
    }
  }, [editingSession])

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          user:users!inner(name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching students:', error)
      } else {
        setStudents(data || [])
      }
    } catch (error) {
      console.error('Unexpected error fetching students:', error)
    }
  }

  // Extract subjects from tutor profile
  const tutorSubjects = tutorProfile?.subjects?.map(subjectString => {
    const match = subjectString.match(/^(.+) \(/)
    return match ? match[1].trim() : subjectString
  }) || []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !tutorProfile) return

    setLoading(true)

    try {
      if (!formData.student_id) {
        alert('Please select a student')
        setLoading(false)
        return
      }

      const sessionData = {
        student_id: formData.student_id,
        tutor_id: tutorProfile.id,
        scheduled_at: formData.scheduled_at,
        duration: formData.duration,
        subject: formData.subject,
        status: formData.status,
        price: 50,
        notes: formData.notes,
        created_at: editingSession ? editingSession.created_at : new Date().toISOString()
      }

      if (editingSession) {
        // Update existing session
        const { error: sessionError } = await supabase
          .from('sessions')
          .update(sessionData)
          .eq('id', editingSession.id)

        if (sessionError) throw sessionError
      } else {
        // Create new session
        const { data: session, error: sessionError } = await supabase
          .from('sessions')
          .insert(sessionData)
          .select()
          .single()

        if (sessionError) throw sessionError
      }

      // Create/update payment record if session is completed
      if (formData.status === 'completed') {
        const sessionId = editingSession?.id || (await supabase
          .from('sessions')
          .select('id')
          .eq('tutor_id', tutorProfile.id)
          .eq('scheduled_at', formData.scheduled_at)
          .single()).data?.id

        if (sessionId) {
          await supabase
            .from('payments')
            .upsert({
              session_id: sessionId,
              amount: 50,
              student_paid: false,
              tutor_paid: false,
              created_at: new Date().toISOString()
            })
        }
      }

      alert(editingSession ? 'Session updated successfully!' : 'Session logged successfully!')
      onSessionLogged()

    } catch (error) {
      console.error('Error saving session:', error)
      alert('Error saving session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-cream rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-sage-green-light">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-forest-green mb-4">
            {editingSession ? 'Edit Session' : 'Log Session'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Student *
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                required
                disabled={!!editingSession}
              >
                <option value="">Select student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.user?.name || 'Unknown'} ({student.user?.email || 'No email'})
                  </option>
                ))}
              </select>
              
              {students.length === 0 && (
                <p className="text-xs text-forest-green opacity-60 mt-1">
                  No registered students found.
                </p>
              )}
            </div>

            {/* Date & Time - 15 minute intervals */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Session Date & Time *
              </label>
              <input
                type="datetime-local"
                value={formData.scheduled_at}
                onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                step="900" // 15 minutes in seconds
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                required
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Duration (minutes) *
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* Subject - Only show tutor's subjects */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Subject *
              </label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                required
              >
                <option value="">Select subject...</option>
                {tutorSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Status - Include all options */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Session Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
              >
                <option value="scheduled">📅 Scheduled</option>
                <option value="completed">✅ Completed</option>
                <option value="no_show">❌ Student No-Show</option>
                <option value="cancelled">🚫 Cancelled</option>
              </select>
            </div>

            {/* Notes - With student visibility warning */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Session Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                placeholder="Notes about the session, homework assigned, etc..."
              />
              <p className="text-xs text-forest-green opacity-60 mt-1">
                ⚠️ Note: Students can see these notes in their session history
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-sage-green-light text-forest-green rounded-md hover:bg-sage-green-light transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-sage-green text-cream py-2 px-4 rounded-md hover:bg-forest-green disabled:opacity-50 transition-colors"
              >
                {loading ? 'Saving...' : editingSession ? 'Update Session' : 'Log Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}