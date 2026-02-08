'use client'

import { useState } from 'react'
import { useApp } from '@/context/AppContext'
import { formatDate, formatTime, DEMO_TODAY, isWithinDays } from '@/utils/dates'
import { sortSessionsByDate } from '@/utils/filters'
import StatusBadge from '@/components/shared/StatusBadge'
import EmptyState from '@/components/shared/EmptyState'

type DateRange = 'week' | 'month' | 'all'

export default function AdminSessions() {
  const { state } = useApp()
  const [statusFilter, setStatusFilter] = useState('all')
  const [tutorFilter, setTutorFilter] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange>('all')

  let filtered = state.sessions

  if (statusFilter !== 'all') {
    filtered = filtered.filter(s => s.status === statusFilter)
  }
  if (tutorFilter !== 'all') {
    filtered = filtered.filter(s => s.tutorId === tutorFilter)
  }
  if (dateRange === 'week') {
    filtered = filtered.filter(s => isWithinDays(s.date, 7) || new Date(s.date) > DEMO_TODAY)
  } else if (dateRange === 'month') {
    filtered = filtered.filter(s => isWithinDays(s.date, 30) || new Date(s.date) > DEMO_TODAY)
  }

  filtered = sortSessionsByDate(filtered)

  function getPaymentStatus(sessionId: string, sessionStatus: string): string {
    if (sessionStatus === 'scheduled') return 'pending'
    if (sessionStatus === 'cancelled' || sessionStatus === 'no-show') return 'n/a'
    const payment = state.payments.find(p => p.sessionId === sessionId)
    if (!payment) return 'pending'
    if (payment.studentPaid) return 'paid'
    return 'owing'
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">All Sessions</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
        >
          <option value="all">All Statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No-Show</option>
        </select>
        <select
          value={tutorFilter}
          onChange={e => setTutorFilter(e.target.value)}
          className="text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
        >
          <option value="all">All Tutors</option>
          {state.tutors.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <div className="flex gap-1">
          {([['week', 'This Week'], ['month', 'This Month'], ['all', 'All Time']] as [DateRange, string][]).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setDateRange(key)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                dateRange === key
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-white text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-bg)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState message="No sessions match your filters." />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <table className="w-full">
              <thead>
                <tr>
                  {['Date & Time', 'Student', 'Tutor', 'Subject', 'Status', 'Amount', 'Payment'].map(col => (
                    <th key={col} className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(session => {
                  const student = state.students.find(s => s.id === session.studentId)
                  const tutor = state.tutors.find(t => t.id === session.tutorId)
                  const paymentStatus = getPaymentStatus(session.id, session.status)
                  return (
                    <tr key={session.id} className="hover:bg-[var(--color-bg)] transition-colors">
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">
                        {formatDate(session.date)}
                        <span className="text-[var(--color-text-tertiary)] ml-1">{formatTime(session.date)}</span>
                      </td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{student?.name}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{tutor?.name}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{session.subject}</td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4"><StatusBadge status={session.status} /></td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">
                        {session.status === 'completed' ? `$${session.price}` : '—'}
                      </td>
                      <td className="py-4 border-b border-[var(--color-border)] pr-4">
                        {paymentStatus === 'n/a' ? (
                          <span className="text-xs text-[var(--color-text-tertiary)]">N/A</span>
                        ) : (
                          <StatusBadge status={paymentStatus} />
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
            {filtered.map(session => {
              const student = state.students.find(s => s.id === session.studentId)
              const tutor = state.tutors.find(t => t.id === session.tutorId)
              const paymentStatus = getPaymentStatus(session.id, session.status)
              return (
                <div key={session.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{session.subject}</span>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                    <p>{formatDate(session.date)} at {formatTime(session.date)}</p>
                    <p>{student?.name} × {tutor?.name}</p>
                    <div className="flex items-center gap-2 pt-1">
                      {session.status === 'completed' && <span className="font-medium">${session.price}</span>}
                      {paymentStatus !== 'n/a' && <StatusBadge status={paymentStatus} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
