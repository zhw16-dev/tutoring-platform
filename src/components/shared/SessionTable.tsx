'use client'

import { Session } from '@/types'
import { useApp } from '@/context/AppContext'
import { formatDate, formatTime } from '@/utils/dates'
import StatusBadge from './StatusBadge'
import EmptyState from './EmptyState'
import { ReactNode } from 'react'

interface Column {
  key: string
  label: string
  render: (session: Session) => ReactNode
}

interface SessionTableProps {
  sessions: Session[]
  columns: Column[]
  emptyMessage?: string
}

export default function SessionTable({ sessions, columns, emptyMessage = 'No sessions found.' }: SessionTableProps) {
  const { state } = useApp()

  if (sessions.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  const getTutorName = (tutorId: string) =>
    state.tutors.find(t => t.id === tutorId)?.name ?? 'Unknown'
  const getStudentName = (studentId: string) =>
    state.students.find(s => s.id === studentId)?.name ?? 'Unknown'

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr>
              {columns.map(col => (
                <th
                  key={col.key}
                  className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr
                key={session.id}
                className="hover:bg-[var(--color-bg)] transition-colors"
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className="py-4 border-b border-[var(--color-border)] last:border-0 pr-4 text-sm"
                  >
                    {col.render(session)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {sessions.map(session => (
          <div
            key={session.id}
            className="bg-white rounded-lg border border-[var(--color-border)] p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {session.subject}
              </span>
              <StatusBadge status={session.status} />
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
              <p>{formatDate(session.date)} at {formatTime(session.date)}</p>
              <p>Tutor: {getTutorName(session.tutorId)}</p>
              <p>Student: {getStudentName(session.studentId)}</p>
            </div>
            {columns.some(col => col.key === 'actions') && (
              <div className="pt-1">
                {columns.find(col => col.key === 'actions')?.render(session)}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  )
}
