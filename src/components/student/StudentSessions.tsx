'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast'
import { DEMO_STUDENT_ID } from '@/data/seed'
import { formatDate, formatTime, isUpcoming } from '@/utils/dates'
import { sortSessionsByDate } from '@/utils/filters'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'
import ConfirmAction from '@/components/shared/ConfirmAction'

type SubTab = 'upcoming' | 'past' | 'all'

export default function StudentSessions() {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const [subTab, setSubTab] = useState<SubTab>('upcoming')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const mySessions = state.sessions.filter(s => s.studentId === DEMO_STUDENT_ID)
  const upcoming = sortSessionsByDate(
    mySessions.filter(s => s.status === 'scheduled' && isUpcoming(s.date)),
    true
  )
  const past = sortSessionsByDate(
    mySessions.filter(s => s.status !== 'scheduled' || !isUpcoming(s.date))
  )
  const all = sortSessionsByDate(mySessions)

  const sessions = subTab === 'upcoming' ? upcoming : subTab === 'past' ? past : all

  function handleCancel(sessionId: string) {
    dispatch({ type: 'CANCEL_SESSION', payload: { sessionId } })
    setCancellingId(null)
    showToast('Session cancelled successfully')
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
            onClick={() => { setSubTab(tab.key); setCancellingId(null) }}
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
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Tutor</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Subject</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">Status</th>
                  <th className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => {
                  const tutor = state.tutors.find(t => t.id === session.tutorId)
                  const canCancel = session.status === 'scheduled' && isUpcoming(session.date)
                  return (
                    <tr key={session.id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">
                        {formatDate(session.date)}
                        <span className="text-[var(--color-text-tertiary)] ml-1">{formatTime(session.date)}</span>
                      </td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{tutor?.name}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{session.subject}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4"><StatusBadge status={session.status} /></td>
                      <td className="py-4 border-b border-[var(--color-border)]">
                        {canCancel && (
                          cancellingId === session.id ? (
                            <ConfirmAction
                              message="Are you sure?"
                              onConfirm={() => handleCancel(session.id)}
                              onCancel={() => setCancellingId(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setCancellingId(session.id)}
                              className="text-[var(--color-error)] text-sm font-medium hover:underline"
                            >
                              Cancel
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
              const tutor = state.tutors.find(t => t.id === session.tutorId)
              const canCancel = session.status === 'scheduled' && isUpcoming(session.date)
              return (
                <div key={session.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{session.subject}</span>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                    <p>{formatDate(session.date)} at {formatTime(session.date)}</p>
                    <p>Tutor: {tutor?.name}</p>
                  </div>
                  {canCancel && (
                    <div className="pt-1">
                      {cancellingId === session.id ? (
                        <ConfirmAction
                          message="Are you sure?"
                          onConfirm={() => handleCancel(session.id)}
                          onCancel={() => setCancellingId(null)}
                        />
                      ) : (
                        <button
                          onClick={() => setCancellingId(session.id)}
                          className="text-[var(--color-error)] text-sm font-medium hover:underline"
                        >
                          Cancel
                        </button>
                      )}
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
