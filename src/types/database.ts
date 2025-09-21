export interface User {
  id: string
  email: string
  role: 'student' | 'tutor' | 'admin'
  name: string
  phone?: string
  created_at: string
}

export interface TutorProfile {
  id: string
  user_id: string
  subjects: string[]
  pricing: {
    [subject: string]: number
  }
  bio?: string
  calendar_link?: string
  is_active: boolean
  created_at: string
  user?: User // For when we join with users table
}

export interface Student {
  id: string
  user_id: string
  grade_level?: string
  parent_contact?: string
  created_at: string
  user?: User
}

export interface Session {
  id: string
  student_id: string
  tutor_id: string
  scheduled_at: string
  duration: number
  subject: string
  status: 'scheduled' | 'completed' | 'cancelled' | 'no_show' | 'pending_confirmation' | 'confirmed'
  price?: number
  lesson_plan_url?: string
  homework_url?: string
  notes?: string
  student_notes?: string
  tutor_notes?: string
  zoom_link?: string
  meeting_location?: string
  created_at: string
}

export interface Payment {
  id: string
  session_id: string
  amount: number
  student_paid: boolean
  tutor_paid: boolean
  payment_date?: string
  created_at: string
}

// Extended interfaces for complex queries
export interface PaymentWithSession extends Payment {
  session: {
    id: string
    scheduled_at: string
    subject: string
    student: {
      user: {
        name: string
        email: string
      }
    }
    tutor: {
      user: {
        name: string
        email: string
      }
    }
  }
}

export interface UserWithProfile extends User {
  tutor_profile?: {
    subjects: string[]
    is_active: boolean
  }
}