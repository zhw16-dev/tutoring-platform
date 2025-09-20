'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

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

const GRADE_LEVELS = ['G9', 'G10', 'G11', 'G12']
const STANDARD_HOURLY_RATE = 50
const TUTOR_TAKE_HOME = 25

export default function ProfileEdit() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    subjects: {} as { [subject: string]: string[] },
    bio: '',
    calendar_link: '',
    etransfer_email: '',
    is_active: true
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    fetchProfile()
  }, [user, router])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        router.push('/profile/setup')
        return
      }

      if (data) {
        // Parse the subjects back into the grade format
        const subjectsObj: { [subject: string]: string[] } = {}
        
        if (data.subjects && Array.isArray(data.subjects)) {
          data.subjects.forEach((subjectString: string) => {
            // Parse "Mathematics (G9, G10)" format
            const match = subjectString.match(/^(.+) \((.+)\)$/)
            if (match) {
              const subject = match[1].trim()
              const grades = match[2].split(',').map(g => g.trim())
              subjectsObj[subject] = grades
            }
          })
        }

        setFormData({
          subjects: subjectsObj,
          bio: data.bio || '',
          calendar_link: data.calendar_link || '',
          etransfer_email: data.etransfer_email || '',
          is_active: data.is_active ?? true
        })
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      router.push('/profile/setup')
    } finally {
      setLoading(false)
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

  const isFormValid = () => {
    return (
      getSelectedSubjectsCount() > 0 &&
      formData.bio.trim().length >= 100 &&
      formData.calendar_link.trim().length > 0 &&
      formData.calendar_link.includes('http') &&
      formData.etransfer_email.trim().length > 0
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !isFormValid()) return

    setSaving(true)

    try {
      const subjectsArray = generateSubjectsArray()
      const pricing = generatePricing()

      const { error } = await supabase
        .from('tutor_profiles')
        .update({
          subjects: subjectsArray,
          pricing: pricing,
          bio: formData.bio.trim(),
          calendar_link: formData.calendar_link.trim(),
          etransfer_email: formData.etransfer_email.trim(),
          is_active: formData.is_active
        })
        .eq('user_id', user.id)

      if (error) throw error

      router.push('/dashboard')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Error updating profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Edit Your Tutor Profile
            </h1>
            <p className="text-gray-600">
              Update your subjects, pricing, and profile information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg">
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Status Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Profile Status</h3>
                  <p className="text-sm text-gray-500">
                    {formData.is_active 
                      ? 'Your profile is active and visible to students' 
                      : 'Your profile is hidden from students'
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    formData.is_active ? 'bg-green-600' : 'bg-gray-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Subjects & Grades Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  What subjects and grade levels do you teach? *
                </h2>
                
                <div className="space-y-4">
                  {APPROVED_SUBJECTS.map((subject) => (
                    <div key={subject} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900">{subject}</h3>
                        <span className="text-sm text-gray-500">
                          ${STANDARD_HOURLY_RATE}/hour (you earn ${TUTOR_TAKE_HOME}/hour)
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
              </div>

              {/* Bio Section */}
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Tell students about yourself *
                </h2>
                <textarea
                  placeholder="Share your teaching experience, education background, teaching methodology, and what makes you an excellent tutor..."
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="flex justify-between text-sm mt-2">
                  <span className={formData.bio.length >= 100 ? "text-green-600" : "text-red-500"}>
                    {formData.bio.length >= 100 ? "✓" : "✗"} Minimum 100 characters required
                  </span>
                  <span className="text-gray-500">
                    {formData.bio.length}/100
                  </span>
                </div>
              </div>

              {/* E-transfer Email */}
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
                  <p>🔒 Only visible to admin for payment processing</p>
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
                  <p>Required: Students use this to book sessions with you directly.</p>
                  {formData.calendar_link && !formData.calendar_link.includes('http') && (
                    <p className="text-red-500 mt-1">⚠️ Please include http:// or https://</p>
                  )}
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
                  disabled={saving || !isFormValid()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>

              {/* Form Validation Summary */}
              {!isFormValid() && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-medium text-yellow-800 mb-2">Complete these requirements:</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    {getSelectedSubjectsCount() === 0 && (
                      <li>• Select at least one subject and grade level</li>
                    )}
                    {formData.bio.length < 100 && (
                      <li>• Write at least 100 characters in your bio</li>
                    )}
                    {!formData.calendar_link.trim() && (
                      <li>• Add your calendar booking link</li>
                    )}
                    {formData.calendar_link.trim() && !formData.calendar_link.includes('http') && (
                      <li>• Calendar link must start with http:// or https://</li>
                    )}
                    {!formData.etransfer_email.trim() && (
                      <li>• Add your e-transfer email for payments</li>
                    )}
                  </ul>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}