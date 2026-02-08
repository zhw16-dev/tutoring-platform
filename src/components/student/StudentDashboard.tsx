'use client'

import { useApp } from '@/context/AppContext'
import { DEMO_STUDENT_ID } from '@/data/seed'
import { formatDate, formatTime, isUpcoming } from '@/utils/dates'
import { sortSessionsByDate } from '@/utils/filters'
import MetricCard from '@/components/shared/MetricCard'
import StatusBadge from '@/components/shared/StatusBadge'
import Avatar from '@/components/shared/Avatar'
import EmptyState from '@/components/shared/EmptyState'
import { useState } from 'react'
import { useToast } from '@/components/shared/Toast'
import ConfirmAction from '@/components/shared/ConfirmAction'

interface StudentDashboardProps {
  onNavigate: (tab: string) => void
}

export default function StudentDashboard({ onNavigate }: StudentDashboardProps) {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const student = state.students.find(s => s.id === DEMO_STUDENT_ID)
  const mySessions = state.sessions.filter(s => s.studentId === DEMO_STUDENT_ID)
  const upcoming = sortSessionsByDate(
    mySessions.filter(s => s.status === 'scheduled' && isUpcoming(s.date)),
    true
  )
  const completed = mySessions.filter(s => s.status === 'completed')
  const recentCompleted = sortSessionsByDate(completed).slice(0, 4)

  const myPayments = state.payments.filter(p => {
    const session = state.sessions.find(s => s.id === p.sessionId)
    return session?.studentId === DEMO_STUDENT_ID
  })
  const amountOwing = myPayments
    .filter(p => !p.studentPaid && p.amount > 0)
    .reduce((sum, p) => sum + p.amount, 0)

  function handleCancel(sessionId: string) {
    dispatch({ type: 'CANCEL_SESSION', payload: { sessionId } })
    setCancellingId(null)
    showToast('Session cancelled successfully')
  }

  return (
    <div className="space-y-8">
      {/* Student identity */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">{student?.name}</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Grade {student?.grade?.replace('G', '')}</p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <MetricCard label="Upcoming Sessions" value={upcoming.length} />
        <MetricCard label="Completed Sessions" value={completed.length} />
        <MetricCard
          label="Amount Owing"
          value={`$${amountOwing.toFixed(2)}`}
          accent={amountOwing > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Upcoming sessions */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Upcoming Sessions</h2>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
            <EmptyState
              message="No upcoming sessions. Browse tutors to book one."
              actionLabel="Browse Tutors"
              onAction={() => onNavigate('browse')}
            />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {upcoming.slice(0, 3).map(session => {
              const tutor = state.tutors.find(t => t.id === session.tutorId)
              return (
                <div key={session.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg)] transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={tutor?.name ?? ''} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{tutor?.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {session.subject} · {formatDate(session.date)} at {formatTime(session.date)}
                      </p>
                    </div>
                  </div>
                  <div>
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
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Recent Activity</h2>
        {recentCompleted.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
            <EmptyState message="No completed sessions yet." />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {recentCompleted.map(session => {
              const tutor = state.tutors.find(t => t.id === session.tutorId)
              return (
                <div key={session.id} className="flex items-center justify-between p-4 hover:bg-[var(--color-bg)] transition-colors">
                  <div className="flex items-center gap-3">
                    <Avatar name={tutor?.name ?? ''} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{tutor?.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {session.subject} · {formatDate(session.date)}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={session.status} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
