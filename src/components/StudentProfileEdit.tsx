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
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="p-6 border-b border-sage-green-light">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-semibold text-forest-green font-serif">Edit Your Profile</h2>
              <p className="text-forest-green opacity-80 text-sm mt-1">
                Update your academic information and contact details
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-forest-green opacity-60 hover:opacity-100 transition-all text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Grade Level */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Grade Level *
              </label>
              <select
                value={formData.grade_level}
                onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green transition-all"
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
              <label className="block text-sm font-medium text-forest-green mb-2">
                School/Institution
              </label>
              <input
                type="text"
                value={formData.school}
                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green transition-all"
                placeholder="e.g., Lincoln High School, University of Toronto"
              />
            </div>

            {/* Parent Contact Email */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Parent/Guardian Email *
              </label>
              <input
                type="email"
                value={formData.parent_contact_email}
                onChange={(e) => setFormData({ ...formData, parent_contact_email: e.target.value })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green transition-all"
                placeholder="parent@example.com"
                required
              />
              <p className="text-xs text-forest-green opacity-60 mt-1">
                Used for session confirmations and payment notifications
              </p>
            </div>

            {/* Parent Contact Phone */}
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Parent/Guardian Phone *
              </label>
              <input
                type="tel"
                value={formData.parent_contact_phone}
                onChange={(e) => setFormData({ ...formData, parent_contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green transition-all"
                placeholder="(555) 123-4567"
                required
              />
              <p className="text-xs text-forest-green opacity-60 mt-1">
                Emergency contact and session reminders
              </p>
            </div>

            {/* Privacy Note */}
            <div className="bg-sage-green-light border border-sage-green rounded-md p-4">
              <div className="flex items-start">
                <div className="text-sage-green text-lg mr-3">ℹ️</div>
                <div>
                  <p className="text-sm text-forest-green">
                    <strong>Privacy Note:</strong> Your information is only shared with your assigned tutors 
                    and is used to facilitate your learning sessions and communication.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex space-x-3 pt-4 border-t border-sage-green-light">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-sage-green-light text-forest-green rounded-md hover:bg-sage-green-light transition-all"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 bg-sage-green text-cream px-4 py-2 rounded-md hover:bg-forest-green transition-all disabled:opacity-50"
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