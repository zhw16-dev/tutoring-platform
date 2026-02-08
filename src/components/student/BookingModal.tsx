'use client'

import { useState } from 'react'
import { Tutor } from '@/types'
import { useApp } from '@/context/AppContext'
import { useToast } from '@/components/shared/Toast'
import Modal from '@/components/shared/Modal'

interface BookingModalProps {
  tutor: Tutor
  isOpen: boolean
  onClose: () => void
}

export default function BookingModal({ tutor, isOpen, onClose }: BookingModalProps) {
  const { dispatch } = useApp()
  const { showToast } = useToast()
  const [subject, setSubject] = useState(tutor.subjects[0]?.name ?? '')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject || !date || !time) return

    const dateTime = `${date}T${time}:00`
    dispatch({
      type: 'BOOK_SESSION',
      payload: {
        tutorId: tutor.id,
        subject,
        date: dateTime,
        notes,
      },
    })
    showToast('Session booked successfully')
    onClose()
    setSubject(tutor.subjects[0]?.name ?? '')
    setDate('')
    setTime('')
    setNotes('')
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">Book a Session</h2>
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Tutor: {tutor.name}
        </p>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Rate: $50 / hour
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
            Subject
          </label>
          <select
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
          >
            {tutor.subjects.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            min={today}
            required
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
            Time
          </label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            min="09:00"
            max="20:00"
            required
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
            Note to tutor (optional)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)] resize-none"
            placeholder="Any topics you'd like to focus on?"
          />
        </div>

        <div className="pt-2 border-t border-[var(--color-border)]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-[var(--color-text-secondary)]">Session fee</span>
            <span className="text-sm font-medium text-[var(--color-text-primary)]">$50.00</span>
          </div>
          <p className="text-xs text-[var(--color-text-tertiary)]">Payment due after session.</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-[var(--color-text-secondary)] text-sm font-medium px-3 py-2 rounded-lg hover:bg-[var(--color-bg)] hover:text-[var(--color-text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Confirm Booking
          </button>
        </div>
      </form>
    </Modal>
  )
}
