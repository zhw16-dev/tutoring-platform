import { Tutor, Student, Session, Payment } from '@/types'

export const DEMO_STUDENT_ID = 'st1'
export const DEMO_TUTOR_ID = 't1'

export const seedTutors: Tutor[] = [
  {
    id: 't1',
    name: 'Sarah Mitchell',
    email: 'sarah.m@willstutoring.com',
    bio: 'Fourth-year Mathematics student at the University of Waterloo. I love making calculus click for students who think it\'s impossible. Two years of tutoring experience with a focus on building problem-solving intuition.',
    subjects: [
      { name: 'Mathematics', grades: ['G9', 'G10', 'G11', 'G12'] },
      { name: 'Physics', grades: ['G11', 'G12'] },
    ],
    grades: ['G9', 'G10', 'G11', 'G12'],
    calendlyLink: 'https://calendly.com/sarah-m-tutoring',
    rating: 4.9,
    totalSessions: 45,
    joinedDate: '2024-09-01',
    avatarInitials: 'SM',
  },
  {
    id: 't2',
    name: 'James Kim',
    email: 'james.k@willstutoring.com',
    bio: 'English Literature major at the University of Toronto. Passionate about helping students find their voice in writing and develop strong analytical reading skills.',
    subjects: [
      { name: 'English', grades: ['G9', 'G10', 'G11', 'G12'] },
      { name: 'French', grades: ['G9', 'G10', 'G11'] },
    ],
    grades: ['G9', 'G10', 'G11', 'G12'],
    calendlyLink: 'https://calendly.com/james-k-tutoring',
    rating: 4.8,
    totalSessions: 38,
    joinedDate: '2024-09-15',
    avatarInitials: 'JK',
  },
  {
    id: 't3',
    name: 'Priya Patel',
    email: 'priya.p@willstutoring.com',
    bio: 'Biochemistry student at McMaster University. I break down complex science concepts into digestible pieces and connect them to real-world applications students actually care about.',
    subjects: [
      { name: 'Chemistry', grades: ['G11', 'G12'] },
      { name: 'Biology', grades: ['G11', 'G12'] },
    ],
    grades: ['G11', 'G12'],
    calendlyLink: 'https://calendly.com/priya-p-tutoring',
    rating: 4.7,
    totalSessions: 32,
    joinedDate: '2024-10-01',
    avatarInitials: 'PP',
  },
  {
    id: 't4',
    name: 'Marcus Chen',
    email: 'marcus.c@willstutoring.com',
    bio: 'Computer Science student at the University of Waterloo with co-op experience at Shopify. I teach coding fundamentals and help students build real projects they can be proud of.',
    subjects: [
      { name: 'Computer Science', grades: ['G10', 'G11', 'G12'] },
      { name: 'Mathematics', grades: ['G9', 'G10'] },
    ],
    grades: ['G9', 'G10', 'G11', 'G12'],
    calendlyLink: 'https://calendly.com/marcus-c-tutoring',
    rating: 4.9,
    totalSessions: 41,
    joinedDate: '2024-09-10',
    avatarInitials: 'MC',
  },
  {
    id: 't5',
    name: 'Emily Rousseau',
    email: 'emily.r@willstutoring.com',
    bio: 'Bilingual French-English tutor studying Linguistics at the University of Ottawa. I make French grammar feel natural through conversation-based learning and cultural immersion.',
    subjects: [
      { name: 'French', grades: ['G9', 'G10', 'G11', 'G12'] },
      { name: 'English', grades: ['G9', 'G10'] },
    ],
    grades: ['G9', 'G10', 'G11', 'G12'],
    calendlyLink: 'https://calendly.com/emily-r-tutoring',
    rating: 4.6,
    totalSessions: 28,
    joinedDate: '2024-10-15',
    avatarInitials: 'ER',
  },
  {
    id: 't6',
    name: 'David Okonkwo',
    email: 'david.o@willstutoring.com',
    bio: 'Engineering Physics student at Queen\'s University. My approach combines rigorous problem-solving with intuitive visual explanations to make math and physics accessible.',
    subjects: [
      { name: 'Mathematics', grades: ['G11', 'G12'] },
      { name: 'Physics', grades: ['G11', 'G12'] },
    ],
    grades: ['G11', 'G12'],
    calendlyLink: 'https://calendly.com/david-o-tutoring',
    rating: 4.8,
    totalSessions: 35,
    joinedDate: '2024-09-20',
    avatarInitials: 'DO',
  },
  {
    id: 't7',
    name: 'Aisha Rahman',
    email: 'aisha.r@willstutoring.com',
    bio: 'Pre-med student at Western University with a passion for biology and chemistry. I focus on building strong foundational understanding so students can tackle any exam question with confidence.',
    subjects: [
      { name: 'Biology', grades: ['G9', 'G10', 'G11', 'G12'] },
      { name: 'Chemistry', grades: ['G11', 'G12'] },
    ],
    grades: ['G9', 'G10', 'G11', 'G12'],
    calendlyLink: 'https://calendly.com/aisha-r-tutoring',
    rating: 4.7,
    totalSessions: 30,
    joinedDate: '2024-10-05',
    avatarInitials: 'AR',
  },
  {
    id: 't8',
    name: 'Lucas Tremblay',
    email: 'lucas.t@willstutoring.com',
    bio: 'Mathematics graduate from McGill University specializing in test preparation. I\'ve helped over 50 students improve their SAT/ACT scores with structured study plans and proven strategies.',
    subjects: [
      { name: 'Test Prep SAT/ACT', grades: ['G11', 'G12'] },
      { name: 'Mathematics', grades: ['G11', 'G12'] },
    ],
    grades: ['G11', 'G12'],
    calendlyLink: 'https://calendly.com/lucas-t-tutoring',
    rating: 4.5,
    totalSessions: 52,
    joinedDate: '2024-08-15',
    avatarInitials: 'LT',
  },
]

export const seedStudents: Student[] = [
  { id: 'st1', name: 'Alex Chen', email: 'alex.chen@student.com', grade: 'G11', parentName: 'Wei Chen', parentEmail: 'wei.chen@email.com', joinedDate: '2024-09-05' },
  { id: 'st2', name: 'Emma Wilson', email: 'emma.wilson@student.com', grade: 'G10', parentName: 'Karen Wilson', parentEmail: 'karen.wilson@email.com', joinedDate: '2024-09-10' },
  { id: 'st3', name: 'Noah Sharma', email: 'noah.sharma@student.com', grade: 'G12', parentName: 'Raj Sharma', parentEmail: 'raj.sharma@email.com', joinedDate: '2024-09-12' },
  { id: 'st4', name: 'Olivia Martin', email: 'olivia.martin@student.com', grade: 'G9', parentName: 'Claire Martin', parentEmail: 'claire.martin@email.com', joinedDate: '2024-10-01' },
  { id: 'st5', name: 'Liam O\'Brien', email: 'liam.obrien@student.com', grade: 'G11', parentName: 'Sean O\'Brien', parentEmail: 'sean.obrien@email.com', joinedDate: '2024-09-18' },
  { id: 'st6', name: 'Sophia Nguyen', email: 'sophia.nguyen@student.com', grade: 'G10', parentName: 'Minh Nguyen', parentEmail: 'minh.nguyen@email.com', joinedDate: '2024-10-05' },
  { id: 'st7', name: 'Ethan Tremblay', email: 'ethan.tremblay@student.com', grade: 'G12', parentName: 'Marc Tremblay', parentEmail: 'marc.tremblay@email.com', joinedDate: '2024-09-25' },
  { id: 'st8', name: 'Isabella Santos', email: 'isabella.santos@student.com', grade: 'G9', parentName: 'Maria Santos', parentEmail: 'maria.santos@email.com', joinedDate: '2024-10-10' },
  { id: 'st9', name: 'Mason Park', email: 'mason.park@student.com', grade: 'G11', parentName: 'Jin Park', parentEmail: 'jin.park@email.com', joinedDate: '2024-09-30' },
  { id: 'st10', name: 'Ava Kowalski', email: 'ava.kowalski@student.com', grade: 'G10', parentName: 'Anna Kowalski', parentEmail: 'anna.kowalski@email.com', joinedDate: '2024-10-08' },
  { id: 'st11', name: 'Lucas Dubois', email: 'lucas.dubois@student.com', grade: 'G12', parentName: 'Pierre Dubois', parentEmail: 'pierre.dubois@email.com', joinedDate: '2024-10-12' },
  { id: 'st12', name: 'Mia Thompson', email: 'mia.thompson@student.com', grade: 'G11', parentName: 'David Thompson', parentEmail: 'david.thompson@email.com', joinedDate: '2024-09-22' },
]

export const seedSessions: Session[] = [
  // Completed sessions — past 2 months
  { id: 's1', studentId: 'st1', tutorId: 't1', subject: 'Mathematics', date: '2024-12-10T10:00:00', duration: 60, status: 'completed', price: 50, notes: 'Reviewed quadratic equations and factoring techniques.' },
  { id: 's2', studentId: 'st9', tutorId: 't1', subject: 'Mathematics', date: '2024-12-13T14:00:00', duration: 60, status: 'completed', price: 50, notes: 'Worked through trigonometric identities.' },
  { id: 's3', studentId: 'st1', tutorId: 't4', subject: 'Computer Science', date: '2024-12-15T11:00:00', duration: 60, status: 'completed', price: 50, notes: 'Intro to Python data structures — lists and dictionaries.' },
  { id: 's4', studentId: 'st10', tutorId: 't3', subject: 'Chemistry', date: '2024-12-18T15:00:00', duration: 60, status: 'completed', price: 50, notes: 'Stoichiometry practice problems and mole calculations.' },
  { id: 's5', studentId: 'st11', tutorId: 't6', subject: 'Physics', date: '2025-01-06T13:00:00', duration: 60, status: 'completed', price: 50, notes: 'Newton\'s laws of motion — problem set review.' },
  { id: 's6', studentId: 'st12', tutorId: 't2', subject: 'English', date: '2025-01-08T10:00:00', duration: 60, status: 'completed', price: 50, notes: 'Essay structure and thesis development for comparative analysis.' },
  { id: 's7', studentId: 'st8', tutorId: 't7', subject: 'Biology', date: '2025-01-10T14:00:00', duration: 60, status: 'completed', price: 50, notes: 'Cell biology review — mitosis and meiosis.' },
  { id: 's8', studentId: 'st3', tutorId: 't4', subject: 'Computer Science', date: '2025-01-13T11:00:00', duration: 60, status: 'completed', price: 50, notes: 'Java OOP concepts — classes, inheritance, and polymorphism.' },
  // Completed sessions — past 2-4 weeks
  { id: 's9', studentId: 'st1', tutorId: 't1', subject: 'Mathematics', date: '2025-01-15T10:00:00', duration: 60, status: 'completed', price: 50, notes: 'Derivatives and limits — foundational calculus review.' },
  { id: 's10', studentId: 'st5', tutorId: 't6', subject: 'Mathematics', date: '2025-01-17T16:00:00', duration: 60, status: 'completed', price: 50, notes: 'Worked through logarithmic and exponential functions.' },
  { id: 's11', studentId: 'st2', tutorId: 't2', subject: 'English', date: '2025-01-18T10:00:00', duration: 60, status: 'completed', price: 50, notes: 'Shakespeare\'s Macbeth — themes and character analysis.' },
  { id: 's12', studentId: 'st1', tutorId: 't1', subject: 'Physics', date: '2025-01-20T14:00:00', duration: 60, status: 'completed', price: 50, notes: 'Kinematics problems — velocity, acceleration, and projectile motion.' },
  { id: 's13', studentId: 'st7', tutorId: 't8', subject: 'Test Prep SAT/ACT', date: '2025-01-22T09:00:00', duration: 60, status: 'completed', price: 50, notes: 'SAT Math section — practice test review and strategies.' },
  { id: 's14', studentId: 'st6', tutorId: 't5', subject: 'French', date: '2025-01-23T15:00:00', duration: 60, status: 'completed', price: 50, notes: 'French verb conjugation — passé composé and imparfait.' },
  { id: 's15', studentId: 'st4', tutorId: 't7', subject: 'Biology', date: '2025-01-25T11:00:00', duration: 60, status: 'completed', price: 50, notes: 'Genetics fundamentals — Punnett squares and inheritance patterns.' },
  { id: 's16', studentId: 'st1', tutorId: 't1', subject: 'Mathematics', date: '2025-01-29T10:00:00', duration: 60, status: 'completed', price: 50, notes: 'Integration techniques — substitution and basic integrals.' },
  // Cancelled sessions
  { id: 's17', studentId: 'st2', tutorId: 't5', subject: 'French', date: '2025-01-24T13:00:00', duration: 60, status: 'cancelled', price: 50, notes: '' },
  { id: 's18', studentId: 'st5', tutorId: 't3', subject: 'Chemistry', date: '2025-01-26T10:00:00', duration: 60, status: 'cancelled', price: 50, notes: '' },
  // No-show sessions
  { id: 's19', studentId: 'st7', tutorId: 't6', subject: 'Mathematics', date: '2025-01-28T16:00:00', duration: 60, status: 'no-show', price: 50, notes: '' },
  { id: 's20', studentId: 'st9', tutorId: 't4', subject: 'Computer Science', date: '2025-01-30T11:00:00', duration: 60, status: 'no-show', price: 50, notes: '' },
  // Completed — most recent
  { id: 's21', studentId: 'st3', tutorId: 't8', subject: 'Mathematics', date: '2025-01-31T14:00:00', duration: 60, status: 'completed', price: 50, notes: 'Pre-calculus review for university preparation.' },
  // Scheduled / upcoming sessions
  { id: 's22', studentId: 'st1', tutorId: 't1', subject: 'Mathematics', date: '2025-02-10T10:00:00', duration: 60, status: 'scheduled', price: 50, notes: '' },
  { id: 's23', studentId: 'st3', tutorId: 't6', subject: 'Physics', date: '2025-02-11T13:00:00', duration: 60, status: 'scheduled', price: 50, notes: '' },
  { id: 's24', studentId: 'st1', tutorId: 't4', subject: 'Computer Science', date: '2025-02-12T11:00:00', duration: 60, status: 'scheduled', price: 50, notes: '' },
  { id: 's25', studentId: 'st10', tutorId: 't3', subject: 'Chemistry', date: '2025-02-13T15:00:00', duration: 60, status: 'scheduled', price: 50, notes: '' },
  { id: 's26', studentId: 'st6', tutorId: 't2', subject: 'English', date: '2025-02-14T10:00:00', duration: 60, status: 'scheduled', price: 50, notes: '' },
]

export const seedPayments: Payment[] = [
  // Completed sessions — fully settled (studentPaid: true, tutorPaid: true)
  { id: 'p1', sessionId: 's1', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2024-12-10' },
  { id: 'p2', sessionId: 's2', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2024-12-13' },
  { id: 'p3', sessionId: 's3', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2024-12-15' },
  { id: 'p5', sessionId: 's5', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2025-01-06' },
  { id: 'p6', sessionId: 's6', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2025-01-08' },
  { id: 'p7', sessionId: 's7', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2025-01-10' },
  { id: 'p9', sessionId: 's9', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2025-01-15' },
  { id: 'p10', sessionId: 's10', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2025-01-17' },
  { id: 'p15', sessionId: 's15', amount: 50, studentPaid: true, tutorPaid: true, tutorAmount: 25, createdAt: '2025-01-25' },
  // Completed sessions — student paid, tutor not yet paid
  { id: 'p4', sessionId: 's4', amount: 50, studentPaid: true, tutorPaid: false, tutorAmount: 25, createdAt: '2024-12-18' },
  { id: 'p11', sessionId: 's11', amount: 50, studentPaid: true, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-18' },
  { id: 'p14', sessionId: 's14', amount: 50, studentPaid: true, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-23' },
  { id: 'p21', sessionId: 's21', amount: 50, studentPaid: true, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-31' },
  // Completed sessions — outstanding (student hasn't paid)
  { id: 'p8', sessionId: 's8', amount: 50, studentPaid: false, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-13' },
  { id: 'p12', sessionId: 's12', amount: 50, studentPaid: false, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-20' },
  { id: 'p13', sessionId: 's13', amount: 50, studentPaid: false, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-22' },
  { id: 'p16', sessionId: 's16', amount: 50, studentPaid: false, tutorPaid: false, tutorAmount: 25, createdAt: '2025-01-29' },
  // Cancelled sessions — no charge
  { id: 'p17', sessionId: 's17', amount: 0, studentPaid: false, tutorPaid: false, tutorAmount: 0, createdAt: '2025-01-24' },
  { id: 'p18', sessionId: 's18', amount: 0, studentPaid: false, tutorPaid: false, tutorAmount: 0, createdAt: '2025-01-26' },
  // No-show sessions — no charge
  { id: 'p19', sessionId: 's19', amount: 0, studentPaid: false, tutorPaid: false, tutorAmount: 0, createdAt: '2025-01-28' },
  { id: 'p20', sessionId: 's20', amount: 0, studentPaid: false, tutorPaid: false, tutorAmount: 0, createdAt: '2025-01-30' },
]
