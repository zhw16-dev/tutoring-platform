'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast'
import { DEMO_TUTOR_ID } from '@/data/seed'
import { Subject } from '@/types'
import { ALL_SUBJECTS, ALL_GRADES } from '@/utils/filters'
import { formatDate } from '@/utils/dates'
import Avatar from '@/components/shared/Avatar'

export default function TutorProfile() {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const tutor = state.tutors.find(t => t.id === DEMO_TUTOR_ID)!

  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState(tutor.bio)
  const [calendlyLink, setCalendlyLink] = useState(tutor.calendlyLink)
  const [subjects, setSubjects] = useState<Subject[]>(tutor.subjects)

  function handleSave() {
    dispatch({
      type: 'UPDATE_TUTOR_PROFILE',
      payload: { bio, subjects, calendlyLink },
    })
    setEditing(false)
    showToast('Profile updated successfully', 'info')
  }

  function handleCancel() {
    setBio(tutor.bio)
    setCalendlyLink(tutor.calendlyLink)
    setSubjects(tutor.subjects)
    setEditing(false)
  }

  function toggleSubject(subjectName: string) {
    const existing = subjects.find(s => s.name === subjectName)
    if (existing) {
      setSubjects(subjects.filter(s => s.name !== subjectName))
    } else {
      setSubjects([...subjects, { name: subjectName, grades: ['G11', 'G12'] }])
    }
  }

  function toggleGrade(subjectName: string, grade: string) {
    setSubjects(subjects.map(s => {
      if (s.name !== subjectName) return s
      const hasGrade = s.grades.includes(grade)
      return {
        ...s,
        grades: hasGrade
          ? s.grades.filter(g => g !== grade)
          : [...s.grades, grade],
      }
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">My Profile</h1>
        {!editing && (
          <button
            onClick={() => setEditing(true)}
            className="bg-white text-[var(--color-accent)] text-sm font-medium px-4 py-2.5 rounded-lg border border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
          >
            Edit
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border border-[var(--color-border)] p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Avatar name={tutor.name} />
          <div>
            <h2 className="text-base font-medium text-[var(--color-text-primary)]">{tutor.name}</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">{tutor.email}</p>
          </div>
        </div>

        {/* Bio */}
        <div>
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Bio</h3>
          {editing ? (
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              rows={4}
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] resize-none"
            />
          ) : (
            <p className="text-sm text-[var(--color-text-primary)]">{tutor.bio}</p>
          )}
        </div>

        {/* Subjects */}
        <div>
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Subjects</h3>
          {editing ? (
            <div className="space-y-3">
              {ALL_SUBJECTS.map(subjectName => {
                const isSelected = subjects.some(s => s.name === subjectName)
                const subject = subjects.find(s => s.name === subjectName)
                return (
                  <div key={subjectName} className="space-y-1">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSubject(subjectName)}
                        className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                      />
                      <span className="text-sm text-[var(--color-text-primary)]">{subjectName}</span>
                    </label>
                    {isSelected && subject && (
                      <div className="ml-6 flex gap-2">
                        {ALL_GRADES.map(grade => (
                          <label key={grade} className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={subject.grades.includes(grade)}
                              onChange={() => toggleGrade(subjectName, grade)}
                              className="rounded border-[var(--color-border)] text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                            />
                            <span className="text-xs text-[var(--color-text-secondary)]">{grade}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {tutor.subjects.map(s => (
                <span
                  key={s.name}
                  className="bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs px-2 py-1 rounded-full"
                >
                  {s.name} ({s.grades.join(', ')})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Calendly */}
        <div>
          <h3 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Calendly Link</h3>
          {editing ? (
            <input
              type="url"
              value={calendlyLink}
              onChange={e => setCalendlyLink(e.target.value)}
              className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
            />
          ) : (
            <a
              href={tutor.calendlyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
            >
              {tutor.calendlyLink.replace('https://', '')} ↗
            </a>
          )}
        </div>

        {/* Stats */}
        <div className="pt-4 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Member since {formatDate(tutor.joinedDate)} · {tutor.totalSessions} sessions completed · ★ {tutor.rating} rating
          </p>
        </div>

        {/* Edit actions */}
        {editing && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="text-[var(--color-text-secondary)] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
