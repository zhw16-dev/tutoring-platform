'use client'

import { useApp } from '@/context/AppContext'
import { DEMO_TUTOR_ID } from '@/data/seed'
import { formatDate, formatTime, isUpcoming, isSameMonth, DEMO_TODAY, getWeekStart, formatWeekRange } from '@/utils/dates'
import { sortSessionsByDate } from '@/utils/filters'
import MetricCard from '@/components/shared/MetricCard'
import Avatar from '@/components/shared/Avatar'
import EmptyState from '@/components/shared/EmptyState'

interface TutorDashboardProps {
  onNavigate: (tab: string) => void
}

export default function TutorDashboard({ onNavigate }: TutorDashboardProps) {
  const { state } = useApp()

  const mySessions = state.sessions.filter(s => s.tutorId === DEMO_TUTOR_ID)
  const upcoming = sortSessionsByDate(
    mySessions.filter(s => s.status === 'scheduled' && isUpcoming(s.date)),
    true
  )
  const completedThisMonth = mySessions.filter(
    s => s.status === 'completed' && isSameMonth(s.date, DEMO_TODAY)
  )

  const myPayments = state.payments.filter(p => {
    const session = state.sessions.find(s => s.id === p.sessionId)
    return session?.tutorId === DEMO_TUTOR_ID
  })
  const totalEarnings = myPayments
    .filter(p => p.tutorPaid && p.tutorAmount > 0)
    .reduce((sum, p) => sum + p.tutorAmount, 0)
  const pendingPayout = myPayments
    .filter(p => !p.tutorPaid && p.tutorAmount > 0 && p.amount > 0)
    .reduce((sum, p) => sum + p.tutorAmount, 0)

  // Weekly sessions chart data (last 4 weeks)
  const weeklyData: { label: string; count: number }[] = []
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(DEMO_TODAY)
    weekStart.setDate(weekStart.getDate() - i * 7)
    const ws = getWeekStart(weekStart)
    const we = new Date(ws)
    we.setDate(we.getDate() + 7)

    const count = mySessions.filter(s => {
      const d = new Date(s.date)
      return s.status === 'completed' && d >= ws && d < we
    }).length

    weeklyData.push({ label: formatWeekRange(ws.toISOString()), count })
  }
  const maxCount = Math.max(...weeklyData.map(w => w.count), 1)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Tutor Dashboard</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">Welcome back, Sarah</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <MetricCard label="Upcoming Sessions" value={upcoming.length} />
        <MetricCard label="Completed This Month" value={completedThisMonth.length} />
        <MetricCard label="Total Earnings" value={`$${totalEarnings}`} accent="success" />
        <MetricCard
          label="Pending Payout"
          value={`$${pendingPayout}`}
          accent={pendingPayout > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Upcoming sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Upcoming Sessions</h2>
          <button
            onClick={() => onNavigate('sessions')}
            className="text-sm font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
          >
            View all →
          </button>
        </div>
        {upcoming.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
            <EmptyState message="No upcoming sessions." />
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-[var(--color-border)] divide-y divide-[var(--color-border)]">
            {upcoming.slice(0, 5).map(session => {
              const student = state.students.find(s => s.id === session.studentId)
              return (
                <div key={session.id} className="flex items-center gap-3 p-4 hover:bg-[var(--color-bg)] transition-colors">
                  <Avatar name={student?.name ?? ''} size="sm" />
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)]">{student?.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {session.subject} · {formatDate(session.date)} at {formatTime(session.date)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Weekly chart */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Sessions per Week</h2>
        <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
          <div className="space-y-3">
            {weeklyData.map((week, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-secondary)] w-28 shrink-0">{week.label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div
                    className="h-6 bg-[var(--color-accent-light)] rounded"
                    style={{ width: `${(week.count / maxCount) * 100}%`, minWidth: week.count > 0 ? '8px' : '0' }}
                  />
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{week.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
