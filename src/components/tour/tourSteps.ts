import { Role } from '@/types'

export interface TourStep {
  id: string
  phase: 'student' | 'tutor' | 'admin'
  targetSelector: string
  title: string
  body: string
  position: 'top' | 'bottom' | 'left' | 'right'
  autoAction?: {
    role?: Role
    tab?: string
  }
}

export const TOUR_STEPS: TourStep[] = [
  // Student Tour (5 steps)
  {
    id: 'student-metrics',
    phase: 'student',
    targetSelector: '[data-tour="student-metrics"]',
    title: 'Your Dashboard at a Glance',
    body: 'Students see upcoming sessions, completed count, and any outstanding balance \u2014 no spreadsheets, no chasing emails.',
    position: 'bottom',
    autoAction: { role: 'student', tab: 'dashboard' },
  },
  {
    id: 'student-browse-grid',
    phase: 'student',
    targetSelector: '[data-tour="student-browse-grid"]',
    title: 'Browse & Filter Tutors',
    body: 'Students can filter by subject and grade, see ratings and bios, and book directly \u2014 like an internal marketplace for tutoring.',
    position: 'bottom',
    autoAction: { tab: 'browse' },
  },
  {
    id: 'student-book-button',
    phase: 'student',
    targetSelector: '[data-tour="student-book-button"]',
    title: 'One-Click Booking',
    body: 'Clicking here opens a booking modal \u2014 select a subject, pick a date and time, add notes. The session is instantly scheduled.',
    position: 'left',
    autoAction: { tab: 'browse' },
  },
  {
    id: 'student-sessions-list',
    phase: 'student',
    targetSelector: '[data-tour="student-sessions-list"]',
    title: 'Manage Your Sessions',
    body: 'All upcoming and past sessions in one place. Students can cancel anytime \u2014 no need to text or email.',
    position: 'bottom',
    autoAction: { tab: 'sessions' },
  },
  {
    id: 'role-switcher-student',
    phase: 'student',
    targetSelector: '[data-tour="role-switcher"]',
    title: 'Switch Roles Anytime',
    body: "This role switcher lets you see the platform from any perspective. Let\u2019s switch to the Tutor view next.",
    position: 'bottom',
  },

  // Tutor Tour (4 steps)
  {
    id: 'tutor-metrics',
    phase: 'tutor',
    targetSelector: '[data-tour="tutor-metrics"]',
    title: 'Tutor Dashboard',
    body: 'Tutors see upcoming sessions, completed count this month, total earnings, and pending payout \u2014 everything they need at a glance.',
    position: 'bottom',
    autoAction: { role: 'tutor', tab: 'dashboard' },
  },
  {
    id: 'tutor-sessions-list',
    phase: 'tutor',
    targetSelector: '[data-tour="tutor-sessions-list"]',
    title: 'Session Logging',
    body: 'After each session, tutors mark it as completed or no-show. This triggers the payment flow automatically \u2014 no manual invoicing.',
    position: 'bottom',
    autoAction: { tab: 'sessions' },
  },
  {
    id: 'tutor-profile',
    phase: 'tutor',
    targetSelector: '[data-tour="tutor-profile"]',
    title: 'Easy Profile Setup',
    body: 'Tutors manage their bio, subjects, grade levels, and Calendly link. Students see this info when browsing.',
    position: 'bottom',
    autoAction: { tab: 'profile' },
  },
  {
    id: 'role-switcher-tutor',
    phase: 'tutor',
    targetSelector: '[data-tour="role-switcher"]',
    title: "Now Let\u2019s See the Admin View",
    body: "The admin view is where the real operational magic happens. Let\u2019s take a look.",
    position: 'bottom',
  },

  // Admin Tour (5 steps)
  {
    id: 'admin-metrics',
    phase: 'admin',
    targetSelector: '[data-tour="admin-metrics"]',
    title: "Bird\u2019s-Eye View",
    body: 'Sessions this month, monthly revenue, active tutors, and outstanding payments \u2014 the topline health of the business in four numbers.',
    position: 'bottom',
    autoAction: { role: 'admin', tab: 'overview' },
  },
  {
    id: 'admin-attention',
    phase: 'admin',
    targetSelector: '[data-tour="admin-attention"]',
    title: 'Proactive Alerts',
    body: 'Unlogged sessions, overdue payments, and recent no-shows surface automatically. No more checking spreadsheets row by row.',
    position: 'bottom',
    autoAction: { tab: 'overview' },
  },
  {
    id: 'admin-sessions-table',
    phase: 'admin',
    targetSelector: '[data-tour="admin-sessions-table"]',
    title: 'Full Session Ledger',
    body: 'Every session across all tutors and students, filterable by status. This replaced a Google Sheet that took 20+ minutes to update weekly.',
    position: 'bottom',
    autoAction: { tab: 'sessions' },
  },
  {
    id: 'admin-collections',
    phase: 'admin',
    targetSelector: '[data-tour="admin-collections"]',
    title: 'Collections Made Easy',
    body: 'This is the killer feature. See exactly who owes what, for which session, and mark it paid with one click. This alone saved hours of e-transfer tracking per week.',
    position: 'bottom',
    autoAction: { tab: 'financials' },
  },
  {
    id: 'admin-payouts',
    phase: 'admin',
    targetSelector: '[data-tour="admin-payouts"]',
    title: 'Tutor Payouts',
    body: 'Once a student pays, the tutor payout appears here. Mark it sent when you e-transfer them. Complete money-in / money-out visibility.',
    position: 'bottom',
    autoAction: { tab: 'financials' },
  },
]

export const TOTAL_STEPS = TOUR_STEPS.length

export function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'student': return 'Student View'
    case 'tutor': return 'Tutor View'
    case 'admin': return 'Admin View'
    default: return ''
  }
}

export function getStepInPhase(index: number): { current: number; total: number } {
  const step = TOUR_STEPS[index]
  if (!step) return { current: 0, total: 0 }
  const phaseSteps = TOUR_STEPS.filter(s => s.phase === step.phase)
  const current = phaseSteps.indexOf(step) + 1
  return { current, total: phaseSteps.length }
}
