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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sage-green mx-auto"></div>
          <p className="mt-4 text-forest-green">Loading tutors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-cream shadow-soft border-b border-sage-green-light">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-forest-green font-serif">Find Your Perfect Tutor</h1>
              <p className="text-forest-green mt-2">Browse our qualified tutors and book a session • $50/hour</p>
            </div>
            <a
              href="/dashboard"
              className="btn-primary"
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
            <div className="card p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-forest-green mb-4 font-serif">Filter Tutors</h3>
              
              <div className="space-y-4">
                {/* Subject Filter */}
                <div>
                  <label className="block text-sm font-medium text-forest-green mb-2">
                    Subject
                  </label>
                  <select
                    value={filters.subject}
                    onChange={(e) => setFilters({ subject: e.target.value })}
                    className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
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
                  className="w-full px-4 py-2 text-forest-green border border-sage-green-light rounded-md hover:bg-sage-green-light transition-colors"
                >
                  Clear Filters
                </button>
              </div>

              {/* Pricing Info */}
              <div className="mt-6 p-4 bg-sage-green-light rounded-lg border border-sage-green">
                <h4 className="font-medium text-forest-green mb-2 font-serif">Standardized Pricing</h4>
                <p className="text-sm text-forest-green">All tutoring sessions are $50/hour</p>
              </div>
            </div>
          </div>

          {/* Tutors Grid */}
          <div className="lg:w-3/4">
            <div className="mb-6">
              <p className="text-forest-green">
                Showing {filteredTutors.length} of {tutors.length} tutors
                {filters.subject && ` for ${filters.subject}`}
              </p>
            </div>

            {filteredTutors.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-sage-green text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-medium text-forest-green mb-2 font-serif">No tutors found</h3>
                <p className="text-forest-green mb-4">
                  {tutors.length === 0 
                    ? "No tutors have set up their profiles yet. Check back soon!" 
                    : "Try adjusting your filters or browse all tutors"
                  }
                </p>
                {filters.subject && (
                  <button
                    onClick={() => setFilters({ subject: '' })}
                    className="btn-primary"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredTutors.map((tutor) => (
                  <div key={tutor.id} className="card overflow-hidden hover:shadow-modal transition-all duration-200">
                    <div className="p-6">
                      {/* Tutor Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-forest-green font-serif">
                            {(tutor as any).user?.name || 'Tutor'}
                          </h3>
                          <div className="flex items-center mt-2">
                            <span className="badge-active">
                              Available
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-bold text-sage-green">$50</span>
                          <span className="text-forest-green text-sm opacity-80">/hour</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-4">
                        <p className="text-forest-green text-sm leading-relaxed">
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
                      <div className="mb-6">
                        <h4 className="font-medium text-forest-green mb-2 font-serif">Subjects & Grades</h4>
                        <div className="space-y-1">
                          {(tutor.subjects || []).slice(0, 4).map((subject, index) => (
                            <div key={index} className="text-forest-green text-sm">
                              {subject}
                            </div>
                          ))}
                          {(tutor.subjects || []).length > 4 && (
                            <div className="text-sm text-forest-green opacity-60">
                              +{(tutor.subjects || []).length - 4} more subjects
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Button - Single unified button */}
                      <div>
                        <button 
                          onClick={() => handleBookSession(tutor)}
                          className="w-full btn-primary text-center"
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