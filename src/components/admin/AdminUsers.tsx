'use client'

import { useApp } from '@/context/AppContext'
import { formatDate } from '@/utils/dates'
import Avatar from '@/components/shared/Avatar'

export default function AdminUsers() {
  const { state } = useApp()
  const { tutors, students, sessions } = state

  function getTutorSessionCount(tutorId: string) {
    return sessions.filter(s => s.tutorId === tutorId && s.status === 'completed').length
  }

  function getStudentSessionCount(studentId: string) {
    return sessions.filter(s => s.studentId === studentId && s.status === 'completed').length
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Users</h1>

      {/* Tutors */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Tutors ({tutors.length})</h2>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr>
                {['Name', 'Email', 'Subjects', 'Sessions', 'Rating', 'Calendly'].map(col => (
                  <th key={col} className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...tutors].sort((a, b) => a.name.localeCompare(b.name)).map(tutor => (
                <tr key={tutor.id} className="hover:bg-[var(--color-bg)] transition-colors">
                  <td className="py-4 border-b border-[var(--color-border)] pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={tutor.name} size="sm" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{tutor.name}</span>
                    </div>
                  </td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-secondary)]">{tutor.email}</td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-secondary)]">
                    {tutor.subjects.map(s => s.name).join(', ')}
                  </td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{getTutorSessionCount(tutor.id)}</td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">★ {tutor.rating}</td>
                  <td className="py-4 border-b border-[var(--color-border)]">
                    <a
                      href={tutor.calendlyLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
                    >
                      View ↗
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {[...tutors].sort((a, b) => a.name.localeCompare(b.name)).map(tutor => (
            <div key={tutor.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={tutor.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{tutor.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{tutor.email}</p>
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                <p>{tutor.subjects.map(s => s.name).join(', ')}</p>
                <p>★ {tutor.rating} · {getTutorSessionCount(tutor.id)} sessions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Students */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Students ({students.length})</h2>

        {/* Desktop table */}
        <div className="hidden md:block">
          <table className="w-full">
            <thead>
              <tr>
                {['Name', 'Email', 'Grade', 'Parent', 'Sessions', 'Joined'].map(col => (
                  <th key={col} className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
                <tr key={student.id} className="hover:bg-[var(--color-bg)] transition-colors">
                  <td className="py-4 border-b border-[var(--color-border)] pr-4">
                    <div className="flex items-center gap-2">
                      <Avatar name={student.name} size="sm" />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{student.name}</span>
                    </div>
                  </td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-secondary)]">{student.email}</td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{student.grade}</td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-secondary)]">{student.parentName}</td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{getStudentSessionCount(student.id)}</td>
                  <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-tertiary)]">{formatDate(student.joinedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-3">
          {[...students].sort((a, b) => a.name.localeCompare(b.name)).map(student => (
            <div key={student.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4">
              <div className="flex items-center gap-3 mb-2">
                <Avatar name={student.name} size="sm" />
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">{student.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{student.email}</p>
                </div>
              </div>
              <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                <p>{student.grade} · Parent: {student.parentName}</p>
                <p>{getStudentSessionCount(student.id)} sessions · Joined {formatDate(student.joinedDate)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
