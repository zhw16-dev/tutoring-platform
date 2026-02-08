import { Session, Tutor } from '@/types'

export function filterTutorsBySubject(tutors: Tutor[], subject: string): Tutor[] {
  if (!subject || subject === 'all') return tutors
  return tutors.filter(t => t.subjects.some(s => s.name === subject))
}

export function filterTutorsByGrade(tutors: Tutor[], grade: string): Tutor[] {
  if (!grade || grade === 'all') return tutors
  return tutors.filter(t => t.grades.includes(grade))
}

export function filterSessionsByStatus(sessions: Session[], status: string): Session[] {
  if (!status || status === 'all') return sessions
  return sessions.filter(s => s.status === status)
}

export function filterSessionsByTutor(sessions: Session[], tutorId: string): Session[] {
  if (!tutorId || tutorId === 'all') return sessions
  return sessions.filter(s => s.tutorId === tutorId)
}

export function sortSessionsByDate(sessions: Session[], ascending = false): Session[] {
  return [...sessions].sort((a, b) => {
    const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
    return ascending ? -diff : diff
  })
}

export const ALL_SUBJECTS = [
  'Mathematics',
  'English',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'French',
  'Test Prep SAT/ACT',
]

export const ALL_GRADES = ['G9', 'G10', 'G11', 'G12']
