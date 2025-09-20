'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

const APPROVED_SUBJECTS = [
  'English',
  'Mathematics', 
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'History',
  'Geography',
  'Computer Science',
  'French',
  'SAT',
  'ACT',
  'Economics',
  'University Admissions'
]

const GRADE_LEVELS = ['G9', 'G10', 'G11', 'G12']
const STANDARD_HOURLY_RATE = 50

export default function ProfileSetup() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    subjects: {} as { [subject: string]: string[] }, // subject -> grades array
    bio: '',
    calendar_link: '',
    etransfer_email: '',
    is_active: false // Default to inactive until admin approval
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    checkTutorRole()
  }, [user, router])

  const checkTutorRole = async () => {
    if (!user) return

    const { data } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (data?.role !== 'tutor') {
      router.push('/dashboard')
    }
  }

  const handleSubjectGradeToggle = (subject: string, grade: string) => {
    const currentGrades = formData.subjects[subject] || []
    const newGrades = currentGrades.includes(grade)
      ? currentGrades.filter(g => g !== grade)
      : [...currentGrades, grade].sort()

    const newSubjects = { ...formData.subjects }
    
    if (newGrades.length === 0) {
      delete newSubjects[subject]
    } else {
      newSubjects[subject] = newGrades
    }

    setFormData({ ...formData, subjects: newSubjects })
  }

  const isSubjectSelected = (subject: string) => {
    return formData.subjects[subject] && formData.subjects[subject].length > 0
  }

  const getSelectedSubjectsCount = () => {
    return Object.keys(formData.subjects).length
  }

  const generatePricing = () => {
    const pricing: { [key: string]: number } = {}
    Object.keys(formData.subjects).forEach(subject => {
      pricing[subject] = STANDARD_HOURLY_RATE
    })
    return pricing
  }

  const generateSubjectsArray = () => {
    const subjects: string[] = []
    Object.entries(formData.subjects).forEach(([subject, grades]) => {
      if (grades.length > 0) {
        subjects.push(`${subject} (${grades.join(', ')})`)
      }
    })
    return subjects
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoading(true)

    try {
      // Get tutor profile
      const { data: existingProfile } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      const subjectsArray = generateSubjectsArray()
      const pricing = generatePricing()

      if (existingProfile) {
        // Update existing profile
        const { error } = await supabase
          .from('tutor_profiles')
          .update({
            subjects: subjectsArray,
            pricing: pricing,
            bio: formData.bio,
            calendar_link: formData.calendar_link,
            etransfer_email: formData.etransfer_email,
            is_active: false // Always require admin approval
          })
          .eq('id', existingProfile.id)

        if (error) throw error
      } else {
        // Create new profile
        const { error } = await supabase
          .from('tutor_profiles')
          .insert({
            user_id: user.id,
            subjects: subjectsArray,
            pricing: pricing,
            bio: formData.bio,
            calendar_link: formData.calendar_link,
            etransfer_email: formData.etransfer_email,
            is_active: false // Always require admin approval
          })

        if (error) throw error
      }

      // Show success message and redirect
      alert('Profile submitted for approval! An admin will review your profile and activate it within 24 hours.')
      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error submitting profile. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Tutor Profile
            </h1>
            <p className="text-gray-600">
              Submit your profile for admin approval to start teaching students
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Important Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-blue-400 text-xl mr-3">ℹ️</div>
                  <div>
                    <h3 className="text-blue-800 font-medium">Profile Approval Required</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      All tutor profiles must be approved by an admin before becoming active. 
                      You'll receive an email notification once your profile is approved.
                    </p>
                  </div>
                </div>
              </div>

              {/* Subjects & Grades Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  What subjects and grade levels do you teach? *
                </h2>
                <p className="text-gray-600 text-sm mb-4">
                  Select subjects and specify which high school grades you can teach.
                </p>
                
                <div className="space-y-4">
                  {APPROVED_SUBJECTS.map((subject) => (
                    <div key={subject} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{subject}</h3>
                        <span className="text-sm text-gray-500">
                          ${STANDARD_HOURLY_RATE}/hour
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {GRADE_LEVELS.map((grade) => (
                          <button
                            key={`${subject}-${grade}`}
                            type="button"
                            onClick={() => handleSubjectGradeToggle(subject, grade)}
                            className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                              formData.subjects[subject]?.includes(grade)
                                ? 'bg-blue-100 border-blue-300 text-blue-800'
                                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            {grade}
                          </button>
                        ))}
                      </div>
                      
                      {isSubjectSelected(subject) && (
                        <div className="mt-2 text-sm text-green-600">
                          ✓ Teaching {subject} for grades: {formData.subjects[subject].join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {getSelectedSubjectsCount() === 0 && (
                  <p className="text-red-500 text-sm mt-2">Please select at least one subject and grade level</p>
                )}

                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Selected subjects:</strong> {getSelectedSubjectsCount()} 
                    {getSelectedSubjectsCount() > 0 && (
                      <span className="ml-2 text-green-600">
                        (All subjects are priced at ${STANDARD_HOURLY_RATE}/hour)
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {/* Bio Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tell students about yourself *
                </h2>
                <textarea
                  placeholder="Share your teaching experience, education background, teaching methodology, and what makes you an excellent tutor. This helps students and parents understand your qualifications and approach."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Minimum 100 characters. Include your qualifications, experience, and teaching approach.
                </p>
              </div>

              {/* E-transfer Email Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Payment Information *
                </h2>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.etransfer_email}
                  onChange={(e) => setFormData({ ...formData, etransfer_email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="text-sm text-gray-500 mt-2">
                  <p className="mb-1">
                    <strong>Required:</strong> Email address for e-transfer payments
                  </p>
                  <p className="text-blue-600">
                    🔒 Only visible to admin for payment processing
                  </p>
                </div>
              </div>

              {/* Calendar Link */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Calendar Booking Link *
                </h2>
                <input
                  type="url"
                  placeholder="https://calendly.com/your-username"
                  value={formData.calendar_link}
                  onChange={(e) => setFormData({ ...formData, calendar_link: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <div className="text-sm text-gray-500 mt-2">
                  <p className="mb-1">
                    <strong>Required:</strong> Provide a link to your calendar booking system (Calendly, Cal.com, etc.)
                  </p>
                  <p>
                    Students will use this to book sessions with you directly.
                  </p>
                </div>
              </div>

              {/* Payment Information */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Payment Structure</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>• Standard rate: <strong>${STANDARD_HOURLY_RATE}/hour</strong> for all subjects</p>
                  <p>• Platform fee: <strong>50%</strong> (You receive ${STANDARD_HOURLY_RATE/2}/hour)</p>
                  <p>• Payment processed after session completion</p>
                  <p>• Monthly payouts via etransfer</p>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || getSelectedSubjectsCount() === 0 || !formData.bio || !formData.calendar_link || !formData.etransfer_email}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Submitting...' : 'Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}