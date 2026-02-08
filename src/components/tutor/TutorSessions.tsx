'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast'
import { DEMO_TUTOR_ID } from '@/data/seed'
import { formatDate, formatTime, isUpcoming, isPast } from '@/utils/dates'
import { sortSessionsByDate } from '@/utils/filters'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'

type SubTab = 'upcoming' | 'past' | 'all'

export default function TutorSessions() {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const [subTab, setSubTab] = useState<SubTab>('upcoming')
  const [loggingId, setLoggingId] = useState<string | null>(null)

  const mySessions = state.sessions.filter(s => s.tutorId === DEMO_TUTOR_ID)
  const upcoming = sortSessionsByDate(
    mySessions.filter(s => s.status === 'scheduled' && isUpcoming(s.date)),
    true
  )
  const past = sortSessionsByDate(
    mySessions.filter(s => s.status !== 'scheduled' || isPast(s.date))
  )
  const all = sortSessionsByDate(mySessions)

  const sessions = subTab === 'upcoming' ? upcoming : subTab === 'past' ? past : all

  function handleLog(sessionId: string, status: 'completed' | 'no-show') {
    dispatch({ type: 'LOG_SESSION', payload: { sessionId, status } })
    setLoggingId(null)
    showToast(status === 'completed' ? 'Session marked as completed' : 'Session marked as no-show')
  }

  const subTabs: { key: SubTab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
    { key: 'all', label: 'All' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">My Sessions</h1>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {subTabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setSubTab(tab.key); setLoggingId(null) }}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              subTab === tab.key
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {sessions.length === 0 ? (
        <EmptyState message={`No ${subTab} sessions.`} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Date & Time</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Student</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Subject</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => {
                  const student = state.students.find(s => s.id === session.studentId)
                  const needsLogging = session.status === 'scheduled' && isPast(session.date)
                  return (
                    <tr key={session.id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">
                        {formatDate(session.date)}
                        <span className="text-[var(--color-text-tertiary)] ml-1">{formatTime(session.date)}</span>
                      </td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{student?.name}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{session.subject}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4"><StatusBadge status={session.status} /></td>
                      <td className="py-4 border-b border-[var(--color-border)]">
                        {needsLogging && (
                          loggingId === session.id ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleLog(session.id, 'completed')}
                                className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                              >
                                Mark Completed
                              </button>
                              <button
                                onClick={() => handleLog(session.id, 'no-show')}
                                className="bg-white text-[var(--color-error)] text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-error)]/30 hover:bg-[var(--color-error-bg)] transition-colors"
                              >
                                Mark No-Show
                              </button>
                              <button
                                onClick={() => setLoggingId(null)}
                                className="text-[var(--color-text-tertiary)] text-xs hover:text-[var(--color-text-secondary)]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setLoggingId(session.id)}
                              className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                            >
                              Log Session
                            </button>
                          )
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {sessions.map(session => {
              const student = state.students.find(s => s.id === session.studentId)
              const needsLogging = session.status === 'scheduled' && isPast(session.date)
              return (
                <div key={session.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{session.subject}</span>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                    <p>{formatDate(session.date)} at {formatTime(session.date)}</p>
                    <p>Student: {student?.name}</p>
                  </div>
                  {needsLogging && (
                    <div className="pt-2 flex gap-2">
                      <button
                        onClick={() => handleLog(session.id, 'completed')}
                        className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                      >
                        Completed
                      </button>
                      <button
                        onClick={() => handleLog(session.id, 'no-show')}
                        className="bg-white text-[var(--color-error)] text-xs font-medium px-3 py-1.5 rounded-lg border border-[var(--color-error)]/30 hover:bg-[var(--color-error-bg)] transition-colors"
                      >
                        No-Show
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
