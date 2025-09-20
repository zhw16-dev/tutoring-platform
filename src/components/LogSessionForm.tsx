'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface StudentOption {
  id: string
  user_id: string
  users?: {
    name: string
    email: string
  }
}

interface LogSessionFormProps {
  onSessionLogged: () => void
  onCancel: () => void
}

export default function LogSessionForm({ onSessionLogged, onCancel }: LogSessionFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<StudentOption[]>([])
  const [tutorProfile, setTutorProfile] = useState<any>(null)
  const [tutorSubjects, setTutorSubjects] = useState<string[]>([])
  const [formData, setFormData] = useState({
    student_id: '',
    scheduled_at: '',
    duration: 60,
    subject: '',
    status: 'scheduled' as 'scheduled' | 'completed' | 'no_show' | 'cancelled',
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
      console.log('🔍 Fetching students for dropdown...')
      
      // ✅ Query users table directly to avoid duplicates
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          students!inner (
            id
          )
        `)
        .eq('role', 'student')
        .order('name')

      console.log('📊 Students query result:', { data, error, count: data?.length })

      if (error) {
        console.error('❌ Error fetching students:', error)
        setStudents([])
      } else {
        console.log('✅ Students fetched successfully:', data?.length || 0, 'students')
        
        // ✅ Transform to expected format and avoid duplicates
        const transformedStudents: StudentOption[] = (data || []).map((user: any) => ({
          id: user.students[0]?.id || user.id, // Use student profile ID for sessions
          user_id: user.id,
          users: {
            name: user.name,
            email: user.email
          }
        }))
        
        console.log('✅ Transformed students:', transformedStudents)
        setStudents(transformedStudents)
      }
    } catch (error) {
      console.error('💥 Unexpected error fetching students:', error)
      setStudents([])
    }
  }

  const fetchTutorProfile = async () => {
    if (!user) return

    try {
      console.log('🔍 Fetching tutor profile and subjects...')
      
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('id, subjects')
        .eq('user_id', user.id)
        .single()

      console.log('📊 Tutor profile result:', { data, error })

      if (data) {
        setTutorProfile(data)
        
        // ✅ Extract subjects from the tutor's profile 
        if (data.subjects && Array.isArray(data.subjects)) {
          const subjects = data.subjects.map((subjectStr: string) => {
            // Parse "Mathematics (G9, G10)" to just "Mathematics"
            const match = subjectStr.match(/^(.+?) \(/)
            return match ? match[1] : subjectStr
          })
          
          // Remove duplicates and sort
          const uniqueSubjects = [...new Set(subjects)].sort()
          console.log('✅ Extracted tutor subjects:', uniqueSubjects)
          setTutorSubjects(uniqueSubjects)
        } else {
          console.log('⚠️ No subjects found in tutor profile')
          setTutorSubjects([])
        }
      } else {
        console.error('❌ Tutor profile not found')
      }
    } catch (error) {
      console.error('💥 Error fetching tutor profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !tutorProfile) {
      alert('Missing user or tutor profile information')
      return
    }

    setLoading(true)

    try {
      const studentId = formData.student_id

      if (!studentId) {
        alert('Please select a student')
        setLoading(false)
        return
      }

      if (!formData.subject) {
        alert('Please select a subject')
        setLoading(false)
        return
      }

      console.log('📝 Creating session with data:', {
        student_id: studentId,
        tutor_id: tutorProfile.id,
        scheduled_at: formData.scheduled_at,
        duration: formData.duration,
        subject: formData.subject,
        status: formData.status,
        price: 50,
        notes: formData.notes
      })

      // ✅ Create session record
      const sessionData = {
        student_id: studentId,
        tutor_id: tutorProfile.id,
        scheduled_at: formData.scheduled_at,
        duration: formData.duration,
        subject: formData.subject,
        status: formData.status,
        price: 50,
        notes: formData.notes,
        created_at: new Date().toISOString()
      }

      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert(sessionData)
        .select()
        .single()

      console.log('📊 Session creation result:', { session, sessionError })

      if (sessionError) {
        console.error('❌ Session creation error details:', sessionError)
        throw new Error(`Failed to create session: ${sessionError.message}`)
      }

      // ✅ Create payment record if session was completed
      if (formData.status === 'completed' && session) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert({
            session_id: session.id,
            amount: 50,
            student_paid: false,
            tutor_paid: false,
            created_at: new Date().toISOString()
          })

        if (paymentError) {
          console.error('❌ Payment creation error:', paymentError)
          // Don't fail the whole operation for payment errors
        }
      }

      alert('✅ Session logged successfully!')
      onSessionLogged()

    } catch (error) {
      console.error('💥 Error logging session:', error)
      alert(`❌ Error logging session: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Log Session</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Student *
              </label>
              <select
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a student...</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.users?.name || 'Unknown Name'} ({student.users?.email || 'No email'})
                  </option>
                ))}
              </select>
              
              {students.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No students found in the system yet.
                </p>
              )}
            </div>

            {/* Date and Time */}
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
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
                <option value={90}>90 minutes</option>
                <option value={120}>120 minutes</option>
              </select>
            </div>

            {/* Subject - ✅ Only shows tutor's subjects */}
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
                {tutorSubjects.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              
              {tutorSubjects.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No subjects configured in your tutor profile.
                </p>
              )}
            </div>

            {/* Status - ✅ Includes "scheduled" option */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Session Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="scheduled">📅 Scheduled</option>
                <option value="completed">✅ Completed</option>
                <option value="no_show">❌ Student No-Show</option>
                <option value="cancelled">🚫 Cancelled</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="Add any notes about the session..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Log Session'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}