'use client'

import { Tutor } from '@/types'
import Avatar from '@/components/shared/Avatar'

interface TutorCardProps {
  tutor: Tutor
  onBook: (tutor: Tutor) => void
}

export default function TutorCard({ tutor, onBook }: TutorCardProps) {
  return (
    <div className="bg-white rounded-lg border border-[var(--color-border)] p-6 hover:border-[var(--color-border-hover)] transition-colors">
      <div className="flex items-start gap-3 mb-3">
        <Avatar name={tutor.name} />
        <div>
          <h3 className="text-base font-medium text-[var(--color-text-primary)]">{tutor.name}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            ★ {tutor.rating} · {tutor.totalSessions} sessions
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {tutor.subjects.map(subject => (
          <span
            key={subject.name}
            className="bg-[var(--color-accent-light)] text-[var(--color-accent)] text-xs px-2 py-1 rounded-full"
          >
            {subject.name} ({subject.grades.join(', ')})
          </span>
        ))}
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2">
        {tutor.bio}
      </p>

      <div className="flex items-center gap-3">
        <a
          href={tutor.calendlyLink}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-white text-[var(--color-accent)] text-sm font-medium px-4 py-2.5 rounded-lg border border-[var(--color-accent)] hover:bg-[var(--color-accent-light)] transition-colors"
        >
          View Availability
        </a>
        <button
          onClick={() => onBook(tutor)}
          className="bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
        >
          Book Session
        </button>
      </div>
    </div>
  )
}
