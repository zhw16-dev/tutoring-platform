'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Session } from '@/types/database'

interface SessionManagerProps {
  tutorId: string
}

interface ExtendedSession extends Session {
  student: {
    user: {
      name: string
      email: string
    }
  }
  payments: {
    id: string
    amount: number
    student_paid: boolean
    tutor_paid: boolean
  }[]
}

export default function SessionManager({ tutorId }: SessionManagerProps) {
  const [sessions, setSessions] = useState<ExtendedSession[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'upcoming' | 'completed'>('pending')

  useEffect(() => {
    fetchSessions()
  }, [tutorId])

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select(`
          *,
          student:students(
            user:users(name, email)
          ),
          payments(id, amount, student_paid, tutor_paid)
        `)
        .eq('tutor_id', tutorId)
        .order('scheduled_at', { ascending: true })

      if (error) throw error

      setSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateSessionStatus = async (sessionId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ status })
        .eq('id', sessionId)

      if (error) throw error

      // Refresh sessions
      await fetchSessions()
    } catch (error) {
      console.error('Error updating session status:', error)
      alert('Failed to update session status')
    }
  }

  const addTutorNotes = async (sessionId: string, notes: string) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ tutor_notes: notes })
        .eq('id', sessionId)

      if (error) throw error

      await fetchSessions()
    } catch (error) {
      console.error('Error adding notes:', error)
      alert('Failed to save notes')
    }
  }

  const filteredSessions = sessions.filter(session => {
    const now = new Date()
    const sessionDate = new Date(session.scheduled_at)

    switch (activeTab) {
      case 'pending':
        return session.status === 'pending_confirmation'
      case 'upcoming':
        return (session.status === 'confirmed' || session.status === 'scheduled') && sessionDate > now
      case 'completed':
        return session.status === 'completed' || session.status === 'cancelled' || session.status === 'no_show' || sessionDate < now
      default:
        return false
    }
  })

  const PendingSessionCard = ({ session }: { session: ExtendedSession }) => {
    const [responding, setResponding] = useState(false)

    const handleResponse = async (accept: boolean) => {
      setResponding(true)
      await updateSessionStatus(session.id, accept ? 'confirmed' : 'cancelled')
      setResponding(false)
    }

    return (
      <div className="bg-white border border-yellow-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{session.subject}</h3>
            <p className="text-gray-600">
              Student: {session.student.user.name} ({session.student.user.email})
            </p>
            <p className="text-gray-600">
              {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
              {new Date(session.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })} ({session.duration} min)
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Pending Approval
            </span>
            <p className="text-lg font-semibold text-green-600 mt-1">
              ${session.price}
            </p>
          </div>
        </div>

        {session.student_notes && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Student's Notes:</p>
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{session.student_notes}</p>
          </div>
        )}

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Session Type:</strong> {session.meeting_location}
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => handleResponse(true)}
            disabled={responding}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {responding ? 'Accepting...' : 'Accept'}
          </button>
          <button
            onClick={() => handleResponse(false)}
            disabled={responding}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {responding ? 'Declining...' : 'Decline'}
          </button>
        </div>
      </div>
    )
  }

  const UpcomingSessionCard = ({ session }: { session: ExtendedSession }) => {
    const [showNotes, setShowNotes] = useState(false)
    const [notes, setNotes] = useState(session.tutor_notes || '')
    const [savingNotes, setSavingNotes] = useState(false)

    const handleSaveNotes = async () => {
      setSavingNotes(true)
      await addTutorNotes(session.id, notes)
      setSavingNotes(false)
      setShowNotes(false)
    }

    return (
      <div className="bg-white border border-green-200 rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{session.subject}</h3>
            <p className="text-gray-600">
              Student: {session.student.user.name}
            </p>
            <p className="text-gray-600">
              {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
              {new Date(session.scheduled_at).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit'
              })} ({session.duration} min)
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Confirmed
            </span>
            <p className="text-lg font-semibold text-green-600 mt-1">
              ${session.price}
            </p>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            <strong>Contact:</strong> {session.student.user.email}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Session Type:</strong> {session.meeting_location}
          </p>
        </div>

        {session.student_notes && (
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Student's Notes:</p>
            <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{session.student_notes}</p>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex space-x-3">
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            >
              {showNotes ? 'Hide Notes' : 'Add/Edit Notes'}
            </button>
            <button
              onClick={() => updateSessionStatus(session.id, 'completed')}
              className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            >
              Mark Complete
            </button>
          </div>

          {showNotes && (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about the session (lesson plan, homework assigned, progress made, etc.)"
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-blue-600 text-white py-1 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {savingNotes ? 'Saving...' : 'Save Notes'}
                </button>
                <button
                  onClick={() => setShowNotes(false)}
                  className="bg-gray-300 text-gray-700 py-1 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const CompletedSessionCard = ({ session }: { session: ExtendedSession }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{session.subject}</h3>
          <p className="text-gray-600">
            Student: {session.student.user.name}
          </p>
          <p className="text-gray-600">
            {new Date(session.scheduled_at).toLocaleDateString()} at{' '}
            {new Date(session.scheduled_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            })} ({session.duration} min)
          </p>
        </div>
        <div className="text-right">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            session.status === 'completed' 
              ? 'bg-green-100 text-green-800'
              : session.status === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {session.status.replace('_', ' ').toUpperCase()}
          </span>
          <p className="text-lg font-semibold text-gray-600 mt-1">
            ${session.price}
          </p>
        </div>
      </div>

      {session.tutor_notes && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-1">Your Notes:</p>
          <p className="text-gray-600 text-sm bg-gray-50 p-3 rounded">{session.tutor_notes}</p>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          <strong>Payment Status:</strong> {
            session.payments[0]?.tutor_paid 
              ? '✅ Paid'
              : session.payments[0]?.student_paid
              ? '⏳ Payment Processing'
              : '⏳ Awaiting Payment'
          }
        </p>
      </div>
    </div>
  )

  if (loading) {
    return <div className="p-6 text-center">Loading sessions...</div>
  }

  const pendingCount = sessions.filter(s => s.status === 'pending_confirmation').length
  const upcomingCount = sessions.filter(s => (s.status === 'confirmed' || s.status === 'scheduled') && new Date(s.scheduled_at) > new Date()).length
  const completedCount = sessions.filter(s => s.status === 'completed' || s.status === 'cancelled' || s.status === 'no_show' || new Date(s.scheduled_at) < new Date()).length

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Session Management</h2>
        
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'pending'
                  ? 'border-yellow-500 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upcoming'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Upcoming ({upcomingCount})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'completed'
                  ? 'border-gray-500 text-gray-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Completed ({completedCount})
            </button>
          </nav>
        </div>
      </div>

      {/* Session Cards */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-4xl mb-4">
              {activeTab === 'pending' && '⏳'}
              {activeTab === 'upcoming' && '📅'}
              {activeTab === 'completed' && '✅'}
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No {activeTab} sessions
            </h3>
            <p className="text-gray-600">
              {activeTab === 'pending' && 'New booking requests will appear here.'}
              {activeTab === 'upcoming' && 'Your confirmed sessions will appear here.'}
              {activeTab === 'completed' && 'Your past sessions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div key={session.id}>
                {activeTab === 'pending' && <PendingSessionCard session={session} />}
                {activeTab === 'upcoming' && <UpcomingSessionCard session={session} />}
                {activeTab === 'completed' && <CompletedSessionCard session={session} />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}