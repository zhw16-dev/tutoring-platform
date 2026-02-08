'use client'

import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast'
import { formatDate } from '@/utils/dates'
import MetricCard from '@/components/shared/MetricCard'
import EmptyState from '@/components/shared/EmptyState'

export default function AdminFinancials() {
  const { state, dispatch } = useApp()
  const { showToast } = useToast()
  const { sessions, payments, students, tutors } = state

  const completedPayments = payments.filter(p => {
    const session = sessions.find(s => s.id === p.sessionId)
    return session?.status === 'completed' && p.amount > 0
  })

  const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0)
  const collectedFromStudents = completedPayments
    .filter(p => p.studentPaid)
    .reduce((sum, p) => sum + p.amount, 0)
  const owedToTutors = completedPayments
    .filter(p => p.studentPaid && !p.tutorPaid)
    .reduce((sum, p) => sum + p.tutorAmount, 0)

  // Outstanding student payments
  const outstandingStudentPayments = completedPayments.filter(p => !p.studentPaid)

  // Pending tutor payouts
  const pendingTutorPayouts = completedPayments.filter(p => p.studentPaid && !p.tutorPaid)

  function handleMarkStudentPaid(paymentId: string) {
    dispatch({ type: 'MARK_PAYMENT_STUDENT_PAID', payload: { paymentId } })
    showToast('Student payment marked as received')
  }

  function handleMarkTutorPaid(paymentId: string) {
    dispatch({ type: 'MARK_PAYMENT_TUTOR_PAID', payload: { paymentId } })
    showToast('Tutor payout marked as sent')
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Financials</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <MetricCard label="Total Revenue (All Time)" value={`$${totalRevenue}`} />
        <MetricCard label="Collected from Students" value={`$${collectedFromStudents}`} accent="success" />
        <MetricCard
          label="Owed to Tutors"
          value={`$${owedToTutors}`}
          accent={owedToTutors > 0 ? 'warning' : 'default'}
        />
      </div>

      {/* Outstanding student payments */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Outstanding Student Payments</h2>
        {outstandingStudentPayments.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
            <EmptyState message="All student payments are up to date." />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Student', 'Tutor', 'Subject', 'Date', 'Amount', 'Action'].map(col => (
                      <th key={col} className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {outstandingStudentPayments.map(payment => {
                    const session = sessions.find(s => s.id === payment.sessionId)
                    const student = students.find(s => s.id === session?.studentId)
                    const tutor = tutors.find(t => t.id === session?.tutorId)
                    return (
                      <tr key={payment.id} className="hover:bg-[var(--color-bg)] transition-colors">
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{student?.name}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{tutor?.name}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{session?.subject}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-secondary)]">{formatDate(session?.date ?? '')}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm font-medium text-[var(--color-text-primary)]">${payment.amount}</td>
                        <td className="py-4 border-b border-[var(--color-border)]">
                          <button
                            onClick={() => handleMarkStudentPaid(payment.id)}
                            className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {outstandingStudentPayments.map(payment => {
                const session = sessions.find(s => s.id === payment.sessionId)
                const student = students.find(s => s.id === session?.studentId)
                const tutor = tutors.find(t => t.id === session?.tutorId)
                return (
                  <div key={payment.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{student?.name}</span>
                      <span className="text-sm font-medium">${payment.amount}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      <p>{session?.subject} with {tutor?.name}</p>
                      <p>{formatDate(session?.date ?? '')}</p>
                    </div>
                    <button
                      onClick={() => handleMarkStudentPaid(payment.id)}
                      className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                    >
                      Mark Paid
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Pending tutor payouts */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Pending Tutor Payouts</h2>
        {pendingTutorPayouts.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--color-border)] p-6">
            <EmptyState message="All tutor payouts are up to date." />
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr>
                    {['Tutor', 'Student', 'Subject', 'Date', 'Payout', 'Action'].map(col => (
                      <th key={col} className="text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide border-b border-[var(--color-border)] pb-3 pr-4">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingTutorPayouts.map(payment => {
                    const session = sessions.find(s => s.id === payment.sessionId)
                    const student = students.find(s => s.id === session?.studentId)
                    const tutor = tutors.find(t => t.id === session?.tutorId)
                    return (
                      <tr key={payment.id} className="hover:bg-[var(--color-bg)] transition-colors">
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{tutor?.name}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{student?.name}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-primary)]">{session?.subject}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm text-[var(--color-text-secondary)]">{formatDate(session?.date ?? '')}</td>
                        <td className="py-4 border-b border-[var(--color-border)] pr-4 text-sm font-medium text-[var(--color-text-primary)]">${payment.tutorAmount}</td>
                        <td className="py-4 border-b border-[var(--color-border)]">
                          <button
                            onClick={() => handleMarkTutorPaid(payment.id)}
                            className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                          >
                            Mark Paid
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {pendingTutorPayouts.map(payment => {
                const session = sessions.find(s => s.id === payment.sessionId)
                const student = students.find(s => s.id === session?.studentId)
                const tutor = tutors.find(t => t.id === session?.tutorId)
                return (
                  <div key={payment.id} className="bg-white rounded-lg border border-[var(--color-border)] p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{tutor?.name}</span>
                      <span className="text-sm font-medium">${payment.tutorAmount}</span>
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      <p>{session?.subject} with {student?.name}</p>
                      <p>{formatDate(session?.date ?? '')}</p>
                    </div>
                    <button
                      onClick={() => handleMarkTutorPaid(payment.id)}
                      className="bg-[var(--color-accent)] text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
                    >
                      Mark Paid
                    </button>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
