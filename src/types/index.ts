export interface Subject {
  name: string
  grades: string[]
}

export interface Tutor {
  id: string
  name: string
  email: string
  bio: string
  subjects: Subject[]
  grades: string[]
  calendlyLink: string
  rating: number
  totalSessions: number
  joinedDate: string
  avatarInitials: string
}

export interface Student {
  id: string
  name: string
  email: string
  grade: string
  parentName: string
  parentEmail: string
  joinedDate: string
}

export interface Session {
  id: string
  studentId: string
  tutorId: string
  subject: string
  date: string
  duration: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show'
  price: number
  notes: string
}

export interface Payment {
  id: string
  sessionId: string
  amount: number
  studentPaid: boolean
  tutorPaid: boolean
  tutorAmount: number
  createdAt: string
}

export type Role = 'student' | 'tutor' | 'admin'

export interface AppState {
  currentRole: Role
  isLoggedIn: boolean
  tutors: Tutor[]
  students: Student[]
  sessions: Session[]
  payments: Payment[]
}

export type AppAction =
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'LOGIN' }
  | { type: 'LOGOUT' }
  | { type: 'BOOK_SESSION'; payload: { tutorId: string; subject: string; date: string; notes: string } }
  | { type: 'CANCEL_SESSION'; payload: { sessionId: string } }
  | { type: 'LOG_SESSION'; payload: { sessionId: string; status: 'completed' | 'no-show' } }
  | { type: 'UPDATE_TUTOR_PROFILE'; payload: { bio?: string; subjects?: Subject[]; calendlyLink?: string } }
  | { type: 'MARK_PAYMENT_STUDENT_PAID'; payload: { paymentId: string } }
  | { type: 'MARK_PAYMENT_TUTOR_PAID'; payload: { paymentId: string } }
