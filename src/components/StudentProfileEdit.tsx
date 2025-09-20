'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'

interface StudentProfileEditProps {
  user: User
  onProfileUpdated: () => void
  onCancel: () => void
}

export default function StudentProfileEdit({ user, onProfileUpdated, onCancel }: StudentProfileEditProps) {
  const [loading, setLoading] = useState(false)
  const [studentProfile, setStudentProfile] = useState<any>(null)
  const [formData, setFormData] = useState({
    grade_level: '',
    school: '',
    parent_contact_email: '',
    parent_contact_phone: ''
  })

  useEffect(() => {
    fetchStudentProfile()
  }, [user.id])

  const fetchStudentProfile = async () => {
    try {
      console.log('🔍 Fetching student profile for editing...')
      
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setStudentProfile(data)
        setFormData({
          grade_level: data.grade_level || '',
          school: data.school || '',
          parent_contact_email: data.parent_contact_email || '',
          parent_contact_phone: data.parent_contact_phone || ''
        })
      } else if (error?.code === 'PGRST116') {
        // No profile exists, create one
        console.log('⚠️ No student profile found, will create one on save')
      }
    } catch (error) {
      console.error('💥 Error fetching student profile:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log('💾 Saving student profile:', formData)

      if (studentProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('students')
          .update({
            grade_level: formData.grade_level,
            school: formData.school,
            parent_contact_email: formData.parent_contact_email,
            parent_contact_phone: formData.parent_contact_phone
          })
          .eq('user_id', user.id)

        if (error) {
          console.error('❌ Error updating profile:', error)
          alert('Error updating profile. Please try again.')
          return
        }
      } else {
        // Create new profile
        const { error } = await supabase
          .from('students')
          .insert({
            user_id: user.id,
            grade_level: formData.grade_level,
            school: formData.school,
            parent_contact_email: formData.parent_contact_email,
            parent_contact_phone: formData.parent_contact_phone
          })

        if (error) {
          console.error('❌ Error creating profile:', error)
          alert('Error creating profile. Please try again.')
          return
        }
      }

      console.log('✅ Profile saved successfully')
      alert('✅ Profile updated successfully!')
      onProfileUpdated()
      
    } catch (error) {
      console.error('💥 Unexpected error saving profile:', error)
      alert('Error saving profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Edit Your Profile</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Grade Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grade Level *
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select grade level...</option>
                <option value="Elementary (K-5)">Elementary (K-5)</option>
                <option value="Grade 6">Grade 6</option>
                <option value="Grade 7">Grade 7</option>
                <option value="Grade 8">Grade 8</option>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
                <option value="University">University/College</option>
              </select>
            </div>

            {/* School */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                School/Institution
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Lincoln High School, University of Toronto"
              />
            </div>

            {/* Parent Contact Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Email *
              </label>
              <input
                type="email"
                value={formData.parent_contact_email}
                onChange={(e) => setFormData({ ...formData, parent_contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="parent@example.com"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Used for session confirmations and payment notifications
              </p>
            </div>

            {/* Parent Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Parent/Guardian Phone *
              </label>
              <input
                type="tel"
                value={formData.parent_contact_phone}
                onChange={(e) => setFormData({ ...formData, parent_contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Emergency contact and session reminders
              </p>
            </div>

            {/* Important Note */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <div className="flex">
                <div className="text-blue-400 mr-2">ℹ️</div>
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Privacy Note:</strong> Your information is only shared with your assigned tutors 
                    and is used to facilitate your learning sessions and communication.
                  </p>
                </div>
              </div>
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
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}