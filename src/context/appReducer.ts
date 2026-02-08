import { AppState, AppAction, Payment } from '@/types'

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, currentRole: action.payload }

    case 'LOGIN':
      return { ...state, isLoggedIn: true }

    case 'LOGOUT':
      return { ...state, isLoggedIn: false, currentRole: 'student' }

    case 'BOOK_SESSION': {
      const newId = `s${state.sessions.length + 1}-${Date.now()}`
      return {
        ...state,
        sessions: [
          ...state.sessions,
          {
            id: newId,
            studentId: 'st1',
            tutorId: action.payload.tutorId,
            subject: action.payload.subject,
            date: action.payload.date,
            duration: 60,
            status: 'scheduled',
            price: 50,
            notes: action.payload.notes,
          },
        ],
      }
    }

    case 'CANCEL_SESSION':
      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === action.payload.sessionId && s.status === 'scheduled'
            ? { ...s, status: 'cancelled' as const }
            : s
        ),
      }

    case 'LOG_SESSION': {
      const session = state.sessions.find(s => s.id === action.payload.sessionId)
      if (!session) return state

      const newPayment: Payment = {
        id: `p${state.payments.length + 1}-${Date.now()}`,
        sessionId: action.payload.sessionId,
        amount: action.payload.status === 'completed' ? 50 : 0,
        studentPaid: false,
        tutorPaid: false,
        tutorAmount: action.payload.status === 'completed' ? 25 : 0,
        createdAt: new Date().toISOString().split('T')[0],
      }

      return {
        ...state,
        sessions: state.sessions.map(s =>
          s.id === action.payload.sessionId
            ? { ...s, status: action.payload.status }
            : s
        ),
        payments: [...state.payments, newPayment],
      }
    }

    case 'UPDATE_TUTOR_PROFILE': {
      const { bio, subjects, calendlyLink } = action.payload
      return {
        ...state,
        tutors: state.tutors.map(t =>
          t.id === 't1'
            ? {
                ...t,
                ...(bio !== undefined && { bio }),
                ...(subjects !== undefined && {
                  subjects,
                  grades: [...new Set(subjects.flatMap(s => s.grades))],
                }),
                ...(calendlyLink !== undefined && { calendlyLink }),
              }
            : t
        ),
      }
    }

    case 'MARK_PAYMENT_STUDENT_PAID':
      return {
        ...state,
        payments: state.payments.map(p =>
          p.id === action.payload.paymentId
            ? { ...p, studentPaid: true }
            : p
        ),
      }

    case 'MARK_PAYMENT_TUTOR_PAID':
      return {
        ...state,
        payments: state.payments.map(p =>
          p.id === action.payload.paymentId
            ? { ...p, tutorPaid: true }
            : p
        ),
      }

    default:
      return state
  }
}
