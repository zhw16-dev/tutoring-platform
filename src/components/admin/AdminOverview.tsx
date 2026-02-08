'use client'

import { useApp } from '@/context/AppContext'
import { DEMO_TODAY, isSameMonth, isWithinDays, formatDate, getWeekStart, formatWeekRange } from '@/utils/dates'
import MetricCard from '@/components/shared/MetricCard'

export default function AdminOverview() {
  const { state } = useApp()
  const { sessions, payments, tutors, students } = state

  // Metrics
  const sessionsThisMonth = sessions.filter(s => isSameMonth(s.date, DEMO_TODAY))
  const revenueThisMonth = payments
    .filter(p => {
      const session = sessions.find(s => s.id === p.sessionId)
      return session && session.status === 'completed' && isSameMonth(session.date, DEMO_TODAY)
    })
    .reduce((sum, p) => sum + p.amount, 0)
  const activeTutors = new Set(
    sessions
      .filter(s => isWithinDays(s.date, 30) && s.status !== 'cancelled')
      .map(s => s.tutorId)
  ).size
  const outstandingPayments = payments
    .filter(p => {
      const session = sessions.find(s => s.id === p.sessionId)
      return session?.status === 'completed' && !p.studentPaid && p.amount > 0
    })
    .reduce((sum, p) => sum + p.amount, 0)

  // Attention items
  const unloggedSessions = sessions.filter(s => {
    const d = new Date(s.date)
    return s.status === 'scheduled' && d <= DEMO_TODAY
  })
  const overduePayments = payments.filter(p => {
    const session = sessions.find(s => s.id === p.sessionId)
    if (!session || session.status !== 'completed' || p.studentPaid) return false
    const sessionDate = new Date(session.date)
    const threshold = new Date(DEMO_TODAY)
    threshold.setDate(threshold.getDate() - 7)
    return sessionDate <= threshold && p.amount > 0
  })
  const recentNoShows = sessions.filter(s => s.status === 'no-show' && isWithinDays(s.date, 14))

  const hasAttention = unloggedSessions.length > 0 || overduePayments.length > 0 || recentNoShows.length > 0

  // Sessions per week (last 8 weeks)
  const weeklyData: { label: string; count: number }[] = []
  for (let i = 7; i >= 0; i--) {
    const d = new Date(DEMO_TODAY)
    d.setDate(d.getDate() - i * 7)
    const ws = getWeekStart(d)
    const we = new Date(ws)
    we.setDate(we.getDate() + 7)
    const count = sessions.filter(s => {
      const sd = new Date(s.date)
      return (s.status === 'completed' || s.status === 'no-show') && sd >= ws && sd < we
    }).length
    weeklyData.push({ label: formatWeekRange(ws.toISOString()), count })
  }
  const maxWeekCount = Math.max(...weeklyData.map(w => w.count), 1)

  // Revenue per month (last 3 months)
  const monthlyRevenue: { month: string; revenue: number; count: number }[] = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(DEMO_TODAY)
    d.setMonth(d.getMonth() - i)
    const monthName = d.toLocaleString('en-CA', { month: 'long', year: 'numeric' })
    const monthSessions = sessions.filter(s => {
      const sd = new Date(s.date)
      return s.status === 'completed' && sd.getMonth() === d.getMonth() && sd.getFullYear() === d.getFullYear()
    })
    const revenue = monthSessions.length * 50
    monthlyRevenue.push({ month: monthName, revenue, count: monthSessions.length })
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Admin Overview</h1>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <MetricCard label="Sessions This Month" value={sessionsThisMonth.length} />
        <MetricCard label="Revenue (Month)" value={`$${revenueThisMonth}`} accent="success" />
        <MetricCard label="Active Tutors" value={activeTutors} />
        <MetricCard
          label="Outstanding Payments"
          value={`$${outstandingPayments}`}
          accent={outstandingPayments > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Attention items */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Needs Attention</h2>
        <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
          {!hasAttention ? (
            <p className="text-sm text-[var(--color-text-tertiary)]">All clear — nothing needs attention right now.</p>
          ) : (
            <div className="space-y-3">
              {unloggedSessions.map(s => {
                const student = students.find(st => st.id === s.studentId)
                const tutor = tutors.find(t => t.id === s.tutorId)
                return (
                  <div key={s.id} className="flex items-start gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-warning)] mt-1.5 shrink-0" />
                    <span className="text-[var(--color-text-primary)]">
                      {student?.name} × {tutor?.name} — {formatDate(s.date)} — <span className="text-[var(--color-warning)] font-medium">Not yet logged</span>
                    </span>
                  </div>
                )
              })}
              {overduePayments.map(p => {
                const session = sessions.find(s => s.id === p.sessionId)
                const student = students.find(s => s.id === session?.studentId)
                return (
                  <div key={p.id} className="flex items-start gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-error)] mt-1.5 shrink-0" />
                    <span className="text-[var(--color-text-primary)]">
                      {student?.name} owes ${p.amount} for {session?.subject} on {formatDate(session?.date ?? '')}
                    </span>
                  </div>
                )
              })}
              {recentNoShows.map(s => {
                const student = students.find(st => st.id === s.studentId)
                const tutor = tutors.find(t => t.id === s.tutorId)
                return (
                  <div key={s.id} className="flex items-start gap-2 text-sm">
                    <span className="w-2 h-2 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                    <span className="text-[var(--color-text-primary)]">
                      {student?.name} no-show with {tutor?.name} on {formatDate(s.date)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sessions per week chart */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Sessions per Week</h2>
        <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
          <div className="space-y-3">
            {weeklyData.map((week, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-[var(--color-text-secondary)] w-28 shrink-0">{week.label}</span>
                <div className="flex-1 flex items-center gap-2">
                  <div
                    className="h-5 bg-[var(--color-accent-light)] rounded"
                    style={{ width: `${(week.count / maxWeekCount) * 100}%`, minWidth: week.count > 0 ? '8px' : '0' }}
                  />
                  <span className="text-xs font-medium text-[var(--color-text-primary)]">{week.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue per month */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Revenue by Month</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {monthlyRevenue.map((m, i) => (
            <div
              key={i}
              className={`bg-white rounded-lg border p-6 ${
                i === monthlyRevenue.length - 1
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]/30'
                  : 'border-[var(--color-border)]'
              }`}
            >
              <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">{m.month}</p>
              <p className="text-2xl font-semibold text-[var(--color-text-primary)] mt-1">${m.revenue}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">{m.count} sessions</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
