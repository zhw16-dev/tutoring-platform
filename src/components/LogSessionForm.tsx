'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const APPROVED_SUBJECTS = [
  'Mathematics',
  'English', 
  'French',
  'Computer Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Economics',
  'SAT Prep',
  'ACT Prep',
  'University Admissions'
]

interface LogSessionFormProps {
  onSessionLogged: () => void
  onCancel: () => void
}

export default function LogSessionForm({ onSessionLogged, onCancel }: LogSessionFormProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<any[]>([])
  const [tutorProfile, setTutorProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    student_id: '',
    student_name: '', // For new students not in system
    scheduled_at: '',
    duration: 60,
    subject: '',
    status: 'completed' as 'completed' | 'no_show' | 'cancelled',
    notes: ''
  })

  useEffect(() => {
    fetchStudents()
    fetchTutorProfile()
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

      // If no existing student selected but name provided, handle it
      if (!studentId && formData.student_name.trim()) {
        // For now, we'll create a note about the new student
        // In production, you might want to create a "pending student" record
        console.log('New student name provided:', formData.student_name)
      }

      if (!studentId && !formData.student_name.trim()) {
        alert('Please select a student or enter a student name')
        setLoading(false)
        return
      }

      // Create session record
      const sessionData = {
        student_id: studentId || null, // null if new student
        tutor_id: tutorProfile.id,
        scheduled_at: formData.scheduled_at,
        duration: formData.duration,
        subject: formData.subject,
        status: formData.status,
        price: 50, // Standard rate
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

  // Set default date/time to now
  useEffect(() => {
    const now = new Date()
    const localDateTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    setFormData(prev => ({ ...prev, scheduled_at: localDateTime }))
  }, [])

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
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {(student.user as any)?.name} ({(student.user as any)?.email})
                  </option>
                ))}
              </select>
              
              {!formData.student_id && (
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
              )}
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