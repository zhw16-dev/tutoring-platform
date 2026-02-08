'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { Tutor } from '@/types'
import { filterTutorsBySubject, filterTutorsByGrade, ALL_SUBJECTS, ALL_GRADES } from '@/utils/filters'
import TutorCard from './TutorCard'
import BookingModal from './BookingModal'
import EmptyState from '@/components/shared/EmptyState'

export default function BrowseTutors() {
  const { state } = useApp()
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [gradeFilter, setGradeFilter] = useState('all')
  const [bookingTutor, setBookingTutor] = useState<Tutor | null>(null)

  let filtered = state.tutors
  filtered = filterTutorsBySubject(filtered, subjectFilter)
  filtered = filterTutorsByGrade(filtered, gradeFilter)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Browse Tutors</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Find and book sessions with qualified tutors</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={subjectFilter}
          onChange={e => setSubjectFilter(e.target.value)}
          className="text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
        >
          <option value="all">All Subjects</option>
          {ALL_SUBJECTS.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={gradeFilter}
          onChange={e => setGradeFilter(e.target.value)}
          className="text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
        >
          <option value="all">All Grades</option>
          {ALL_GRADES.map(g => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>

      {/* Tutor grid */}
      {filtered.length === 0 ? (
        <EmptyState message="No tutors match your filters." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map(tutor => (
            <TutorCard
              key={tutor.id}
              tutor={tutor}
              onBook={setBookingTutor}
            />
          ))}
        </div>
      )}

      {/* Booking modal */}
      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          isOpen={!!bookingTutor}
          onClose={() => setBookingTutor(null)}
        />
      )}
    </div>
  )
}
