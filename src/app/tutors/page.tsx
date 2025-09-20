'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { TutorProfile } from '@/types/database'

export default function TutorsPage() {
  const { user } = useAuth()
  const [tutors, setTutors] = useState<TutorProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    subject: ''
  })

  useEffect(() => {
    fetchTutors()
  }, [])

  const fetchTutors = async () => {
    try {
      const { data, error } = await supabase
        .from('tutor_profiles')
        .select(`
          *,
          user:users(name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setTutors(data || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleBookSession = (tutor: TutorProfile) => {
    if (!user) {
      alert('Please sign in to book a session')
      return
    }
    
    if (tutor.calendar_link) {
      // Open tutor's calendar in new tab
      window.open(tutor.calendar_link, '_blank')
    } else {
      alert('This tutor has not set up their calendar yet.')
    }
  }

  // Get all unique subjects for filter dropdown
  const allSubjects = Array.from(
    new Set(
      tutors.flatMap(tutor => 
        (tutor.subjects || []).map(subject => {
          // Extract just the subject name from "Subject (G9, G10)" format
          const match = subject.match(/^(.+) \(/)
          return match ? match[1] : subject
        })
      )
    )
  ).sort()

  // Filter tutors based on selected subject
  const filteredTutors = tutors.filter(tutor => {
    if (!filters.subject) return true
    
    return tutor.subjects?.some(subject => 
      subject.toLowerCase().includes(filters.subject.toLowerCase())
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading tutors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Find Your Perfect Tutor</h1>
              <p className="text-gray-600">Browse our qualified tutors and book a session • $50/hour</p>
            </div>
            <a
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Tutors</h3>
              
              <div className="space-y-4">
                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters({ subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">All Subjects</option>
                    {allSubjects.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({ subject: '' })}
                  className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Clear Filters
                </button>
              </div>

              {/* Pricing Info */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Standardized Pricing</h4>
                <p className="text-sm text-blue-800">All tutoring sessions are $50/hour</p>
              </div>
            </div>
          </div>

          {/* Tutors Grid */}
          <div className="lg:w-3/4">
            <div className="mb-6">
              <p className="text-gray-600">
                Showing {filteredTutors.length} of {tutors.length} tutors
                {filters.subject && ` for ${filters.subject}`}
              </p>
            </div>

            {filteredTutors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-gray-900 mb-2">No tutors found</h3>
                <p className="text-gray-600">
                  {tutors.length === 0 
                    ? "No tutors have set up their profiles yet. Check back soon!" 
                    : "Try adjusting your filters or browse all tutors"
                  }
                </p>
                {filters.subject && (
                  <button
                    onClick={() => setFilters({ subject: '' })}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTutors.map((tutor) => (
                  <div key={tutor.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      {/* Tutor Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {(tutor as any).user?.name || 'Tutor'}
                          </h3>
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Available
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-green-600">$50</span>
                          <span className="text-gray-500 text-sm">/hour</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-4">
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {tutor.bio ? 
                            (tutor.bio.length > 150 ? 
                              `${tutor.bio.substring(0, 150)}...` : 
                              tutor.bio
                            ) : 
                            'Experienced tutor ready to help you achieve your academic goals.'
                          }
                        </p>
                      </div>

                      {/* Subjects */}
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-900 mb-2">Subjects & Grades</h4>
                        <div className="space-y-1">
                          {(tutor.subjects || []).slice(0, 4).map((subject, index) => (
                            <div key={index} className="text-gray-700 text-sm">
                              {subject}
                            </div>
                          ))}
                          {(tutor.subjects || []).length > 4 && (
                            <div className="text-sm text-gray-500">
                              +{(tutor.subjects || []).length - 4} more subjects
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Calendar Link */}
                      {tutor.calendar_link && (
                        <div className="mb-4">
                          <a
                            href={tutor.calendar_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm"
                          >
                            📅 View Available Times
                          </a>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="flex gap-3">
                        <button 
                          onClick={() => handleBookSession(tutor)}
                          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Book Session
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}