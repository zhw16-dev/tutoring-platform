'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'

interface AdminDashboardProps {
  user: User
}

interface PendingTutor {
  id: string
  user_id: string
  subjects: string[]
  bio: string
  calendar_link: string
  is_active: boolean
  created_at: string
  user_name: string
  user_email: string
}

interface AdminStats {
  totalUsers: number
  totalTutors: number
  activeTutors: number
  pendingTutors: number
  totalStudents: number
  totalSessions: number
  scheduledSessions: number
  completedSessions: number
  cancelledNoShowSessions: number
  pendingPayments: number
}

interface UserWithProfile {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  created_at: string
  tutor_profile?: {
    subjects: string[]
    is_active: boolean
  }
}

interface PaymentRecord {
  id: string
  session_id: string
  amount: number
  student_paid: boolean
  tutor_paid: boolean
  payment_date: string | null
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

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingTutors, setPendingTutors] = useState<PendingTutor[]>([])
  const [allUsers, setAllUsers] = useState<UserWithProfile[]>([])
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tutors' | 'users' | 'payments'>('overview')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'student' | 'tutor'>('all')
  const [selectedUser, setSelectedUser] = useState<string>('')

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      // Get user counts
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })

      const { count: totalTutors } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'tutor')

      const { count: totalStudents } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'student')

      // Get tutor profile counts
      const { count: activeTutors } = await supabase
        .from('tutor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)

      const { count: pendingTutorCount } = await supabase
        .from('tutor_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', false)

      // Get session counts with new breakdown
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })

      const { count: scheduledSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'scheduled')

      const { count: completedSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get cancelled and no-show sessions
      const { count: cancelledSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'cancelled')

      const { count: noShowSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'no_show')

      const cancelledNoShowSessions = (cancelledSessions || 0) + (noShowSessions || 0)

      // Get pending payments count
      const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .or('student_paid.eq.false,tutor_paid.eq.false')

      // Get pending tutors
      const { data: pendingProfiles } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: true })

      let tutorsWithUserData: PendingTutor[] = []

      if (pendingProfiles && pendingProfiles.length > 0) {
        const userIds = pendingProfiles.map(p => p.user_id)
        const { data: userData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        if (userData && userData.length > 0) {
          tutorsWithUserData = pendingProfiles.map(profile => {
            const user = userData.find(u => u.id === profile.user_id)
            return {
              id: profile.id,
              user_id: profile.user_id,
              subjects: profile.subjects || [],
              bio: profile.bio || '',
              calendar_link: profile.calendar_link || '',
              is_active: profile.is_active,
              created_at: profile.created_at,
              user_name: user?.name || `Missing name for ID: ${profile.user_id}`,
              user_email: user?.email || `Missing email for ID: ${profile.user_id}`
            }
          })
        }
      }

      setStats({
        totalUsers: totalUsers || 0,
        totalTutors: totalTutors || 0,
        activeTutors: activeTutors || 0,
        pendingTutors: pendingTutorCount || 0,
        totalStudents: totalStudents || 0,
        totalSessions: totalSessions || 0,
        scheduledSessions: scheduledSessions || 0,
        completedSessions: completedSessions || 0,
        cancelledNoShowSessions: cancelledNoShowSessions,
        pendingPayments: pendingPayments || 0,
      })

      setPendingTutors(tutorsWithUserData)

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const { data: users } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          role,
          created_at,
          tutor_profiles(subjects, is_active)
        `)
        .order('created_at', { ascending: false })

      const formattedUsers: UserWithProfile[] = (users || []).map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        created_at: user.created_at,
        tutor_profile: (user as any).tutor_profiles?.[0] || undefined
      }))

      setAllUsers(formattedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchPayments = async () => {
    try {
      // Get all payments first
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })

      if (paymentsError) {
        console.error('Error fetching payments:', paymentsError)
        return
      }

      if (!paymentsData || paymentsData.length === 0) {
        setPayments([])
        return
      }

      // Get all sessions for these payments
      const sessionIds = paymentsData.map(p => p.session_id)
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('sessions')
        .select('id, scheduled_at, subject, student_id, tutor_id')
        .in('id', sessionIds)

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError)
        return
      }

      // Get all users we need (both students and tutors)
      const studentIds = sessionsData?.map(s => s.student_id).filter(Boolean) || []
      const tutorIds = sessionsData?.map(s => s.tutor_id).filter(Boolean) || []

      // Get student data
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, user_id')
        .in('id', studentIds)

      // Get tutor data  
      const { data: tutorsData } = await supabase
        .from('tutor_profiles')
        .select('id, user_id')
        .in('id', tutorIds)

      // Get all user IDs we need
      const studentUserIds = studentsData?.map(s => s.user_id) || []
      const tutorUserIds = tutorsData?.map(t => t.user_id) || []
      const allUserIds = [...studentUserIds, ...tutorUserIds]

      // Get user data
      const { data: usersData } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', allUserIds)

      // Now build the final data structure
      const transformedPayments: PaymentRecord[] = paymentsData.map(payment => {
        const session = sessionsData?.find(s => s.id === payment.session_id)
        const student = studentsData?.find(s => s.id === session?.student_id)
        const tutor = tutorsData?.find(t => t.id === session?.tutor_id)
        const studentUser = usersData?.find(u => u.id === student?.user_id)
        const tutorUser = usersData?.find(u => u.id === tutor?.user_id)

        return {
          id: payment.id,
          session_id: payment.session_id,
          amount: payment.amount,
          student_paid: payment.student_paid,
          tutor_paid: payment.tutor_paid,
          payment_date: payment.payment_date,
          session: {
            id: session?.id || '',
            scheduled_at: session?.scheduled_at || '',
            subject: session?.subject || '',
            student: {
              user: {
                name: studentUser?.name || 'Unknown Student',
                email: studentUser?.email || ''
              }
            },
            tutor: {
              user: {
                name: tutorUser?.name || 'Unknown Tutor',
                email: tutorUser?.email || ''
              }
            }
          }
        }
      })

      setPayments(transformedPayments)
    } catch (error) {
      console.error('Error fetching payments:', error)
      setPayments([])
    }
  }

  const handleTutorApproval = async (tutorId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('tutor_profiles')
        .update({ is_active: approve })
        .eq('id', tutorId)

      if (error) throw error

      const message = approve ? 'Tutor approved successfully!' : 'Tutor rejected successfully!'
      alert(message)
      await fetchAdminData()
    } catch (error) {
      console.error('Error updating tutor approval:', error)
      alert('Error updating tutor status. Please try again.')
    }
  }

  const togglePaymentStatus = async (paymentId: string, field: 'student_paid' | 'tutor_paid', value: boolean) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ [field]: value })
        .eq('id', paymentId)

      if (error) throw error

      await fetchPayments()
    } catch (error) {
      console.error('Error updating payment status:', error)
      alert('Error updating payment status.')
    }
  }

  if (loading) {
    return <div className="p-6 text-forest-green">Loading admin dashboard...</div>
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {stats && stats.pendingTutors > 0 && (
        <div className="bg-golden-yellow-light border border-golden-yellow rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-golden-yellow text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-forest-green font-medium">
                {stats.pendingTutors} tutor{stats.pendingTutors !== 1 ? 's' : ''} waiting for approval
              </h3>
              <p className="text-forest-green text-sm mt-1">
                Review pending tutor applications to activate their profiles.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('tutors')}
              className="ml-auto bg-golden-yellow text-forest-green px-4 py-2 rounded-md hover:bg-golden-yellow-dark text-sm font-medium"
            >
              Review Applications
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-sage-green-light rounded-lg p-6 border border-sage-green">
          <div className="flex items-center">
            <div className="p-2 bg-sage-green rounded-md">👥</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Total Users</p>
              <p className="text-2xl font-bold text-forest-green">{stats?.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-sage-green-light rounded-lg p-6 border border-sage-green">
          <div className="flex items-center">
            <div className="p-2 bg-sage-green rounded-md">🎓</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Active Tutors</p>
              <p className="text-2xl font-bold text-forest-green">{stats?.activeTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-golden-yellow-light rounded-lg p-6 border border-golden-yellow cursor-pointer" onClick={() => setActiveTab('tutors')}>
          <div className="flex items-center">
            <div className="p-2 bg-golden-yellow rounded-md">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Pending Approval</p>
              <p className="text-2xl font-bold text-forest-green">{stats?.pendingTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-sage-green-light rounded-lg p-6 border border-sage-green">
          <div className="flex items-center">
            <div className="p-2 bg-sage-green rounded-md">📚</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-forest-green">Students</p>
              <p className="text-2xl font-bold text-forest-green">{stats?.totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Session Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <h3 className="text-lg font-medium text-forest-green mb-4">Session Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-forest-green">Total Sessions</span>
              <span className="font-medium text-forest-green">{stats?.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Scheduled</span>
              <span className="font-medium text-sage-green">{stats?.scheduledSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Completed</span>
              <span className="font-medium text-sage-green">{stats?.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Cancelled/No-Show</span>
              <span className="font-medium text-red-600">{stats?.cancelledNoShowSessions}</span>
            </div>
          </div>
        </div>

        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <h3 className="text-lg font-medium text-forest-green mb-4">Revenue Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-forest-green">Completed Sessions</span>
              <span className="font-medium text-forest-green">{stats?.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Platform Revenue</span>
              <span className="font-medium text-sage-green">
                ${((stats?.completedSessions || 0) * 25).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Tutor Earnings</span>
              <span className="font-medium text-forest-green">
                ${((stats?.completedSessions || 0) * 25).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <h3 className="text-lg font-medium text-forest-green mb-4">Platform Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-forest-green">Status</span>
              <span className="font-medium text-sage-green">✅ Operational</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Pending Payments</span>
              <span className="font-medium text-golden-yellow">{stats?.pendingPayments}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-forest-green">Active Tutors</span>
              <span className="font-medium text-forest-green">{stats?.activeTutors}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderUserManagement = () => {
    if (allUsers.length === 0) {
      fetchAllUsers()
    }

    return (
      <div className="space-y-6">
        <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
          <div className="p-6 border-b border-sage-green-light">
            <h3 className="text-lg font-medium text-forest-green">All Users & Contact Information</h3>
            <p className="text-forest-green text-sm mt-1">
              Complete directory of all platform users with contact details
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-sage-green-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Subjects</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Joined</th>
                </tr>
              </thead>
              <tbody className="bg-cream divide-y divide-sage-green-light">
                {allUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-sage-green-light">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-forest-green">
                      {user.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-green">
                      {user.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-green">
                      {user.phone || 'Not provided'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === 'admin' 
                          ? 'bg-red-100 text-red-800'
                          : user.role === 'tutor' 
                          ? 'bg-sage-green text-cream' 
                          : 'bg-golden-yellow-light text-forest-green'
                      }`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-forest-green">
                      {user.role === 'tutor' && user.tutor_profile?.subjects ? (
                        <div className="max-w-xs">
                          {user.tutor_profile.subjects.slice(0, 2).map((subject, idx) => (
                            <div key={idx} className="text-xs">{subject}</div>
                          ))}
                          {user.tutor_profile.subjects.length > 2 && (
                            <div className="text-xs text-forest-green opacity-60">
                              +{user.tutor_profile.subjects.length - 2} more
                            </div>
                          )}
                        </div>
                      ) : user.role === 'tutor' ? (
                        <span className="text-forest-green opacity-60">Profile incomplete</span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.role === 'tutor' ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.tutor_profile?.is_active 
                            ? 'bg-sage-green text-cream'
                            : 'bg-golden-yellow-light text-forest-green'
                        }`}>
                          {user.tutor_profile?.is_active ? 'Active' : 'Pending'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-green text-cream">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-forest-green">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderPaymentManagement = () => {
    if (payments.length === 0) {
      fetchPayments()
    }

    // Filter payments based on selection
    const filteredPayments = payments.filter(payment => {
      if (paymentFilter === 'all') return true
      if (paymentFilter === 'student') return !payment.student_paid
      if (paymentFilter === 'tutor') return !payment.tutor_paid
      return true
    }).filter(payment => {
      if (!selectedUser) return true
      const studentName = payment.session?.student?.user?.name || ''
      const tutorName = payment.session?.tutor?.user?.name || ''
      return studentName.includes(selectedUser) || tutorName.includes(selectedUser)
    })

    // Get unique users for filter dropdown
    const allPaymentUsers = Array.from(new Set([
      ...payments.map(p => p.session?.student?.user?.name).filter(name => name && name.length > 0),
      ...payments.map(p => p.session?.tutor?.user?.name).filter(name => name && name.length > 0)
    ])).sort()

    return (
      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-cream rounded-lg shadow-soft p-6 border border-sage-green-light">
          <h3 className="text-lg font-medium text-forest-green mb-4">Payment Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Payment Type
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
              >
                <option value="all">All Payments</option>
                <option value="student">Unpaid by Students</option>
                <option value="tutor">Unpaid to Tutors</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-forest-green mb-2">
                Filter by User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
              >
                <option value="">All Users</option>
                {allPaymentUsers.map((user) => (
                  <option key={user} value={user}>{user}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setPaymentFilter('all')
                  setSelectedUser('')
                }}
                className="px-4 py-2 border border-sage-green-light text-forest-green rounded-md hover:bg-sage-green-light transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
          <div className="p-6 border-b border-sage-green-light">
            <h3 className="text-lg font-medium text-forest-green">
              Payment Records ({filteredPayments.length})
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-sage-green-light">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Tutor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Student Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Tutor Paid</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-forest-green uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-cream divide-y divide-sage-green-light">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-sage-green-light">
                    <td className="px-6 py-4 text-sm text-forest-green">
                      <div>
                        <div className="font-medium">{payment.session?.subject || 'N/A'}</div>
                        <div className="text-xs opacity-80">
                          {payment.session?.scheduled_at ? new Date(payment.session.scheduled_at).toLocaleDateString() : 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-forest-green">
                      <div>
                        <div className="font-medium">{payment.session?.student?.user?.name || 'N/A'}</div>
                        <div className="text-xs opacity-80">{payment.session?.student?.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-forest-green">
                      <div>
                        <div className="font-medium">{payment.session?.tutor?.user?.name || 'N/A'}</div>
                        <div className="text-xs opacity-80">{payment.session?.tutor?.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-forest-green">
                      ${payment.amount}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePaymentStatus(payment.id, 'student_paid', !payment.student_paid)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.student_paid 
                            ? 'bg-sage-green text-cream' 
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {payment.student_paid ? '✅ Paid' : '❌ Unpaid'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePaymentStatus(payment.id, 'tutor_paid', !payment.tutor_paid)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.tutor_paid 
                            ? 'bg-sage-green text-cream' 
                            : 'bg-golden-yellow-light text-forest-green'
                        }`}
                      >
                        {payment.tutor_paid ? '✅ Paid' : '⏳ Pending'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex space-x-2">
                        {!payment.student_paid && (
                          <button
                            onClick={() => togglePaymentStatus(payment.id, 'student_paid', true)}
                            className="text-sage-green hover:text-forest-green text-xs"
                          >
                            Mark Student Paid
                          </button>
                        )}
                        {!payment.tutor_paid && (
                          <button
                            onClick={() => togglePaymentStatus(payment.id, 'tutor_paid', true)}
                            className="text-sage-green hover:text-forest-green text-xs"
                          >
                            Mark Tutor Paid
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderTutorManagement = () => (
    <div className="space-y-6">
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="p-6 border-b border-sage-green-light">
          <h3 className="text-lg font-medium text-forest-green">
            Pending Tutor Approvals ({pendingTutors.length})
          </h3>
          <p className="text-forest-green text-sm mt-1">
            Review and approve tutor applications to activate their profiles
          </p>
        </div>
        
        <div className="p-6">
          {pendingTutors.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-sage-green text-4xl mb-4">✅</div>
              <h3 className="text-lg font-medium text-forest-green mb-2">All caught up!</h3>
              <p className="text-forest-green">No tutor applications pending approval.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingTutors.map((tutor) => (
                <div key={tutor.id} className="border border-sage-green-light rounded-lg p-6 bg-cream">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-forest-green">
                        {tutor.user_name}
                      </h4>
                      <p className="text-forest-green">{tutor.user_email}</p>
                      <p className="text-sm text-forest-green opacity-60">
                        Applied: {new Date(tutor.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-golden-yellow-light text-forest-green">
                      Pending Review
                    </span>
                  </div>

                  {/* Subjects */}
                  <div className="mb-4">
                    <h5 className="font-medium text-forest-green mb-2">Teaching Subjects</h5>
                    <div className="flex flex-wrap gap-2">
                      {tutor.subjects.map((subject, index) => (
                        <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-green-light text-forest-green">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="mb-4">
                    <h5 className="font-medium text-forest-green mb-2">Bio</h5>
                    <p className="text-forest-green text-sm">{tutor.bio}</p>
                  </div>

                  {/* Calendar Link */}
                  <div className="mb-4">
                    <h5 className="font-medium text-forest-green mb-2">Calendar Link</h5>
                    <a 
                      href={tutor.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sage-green hover:text-forest-green text-sm"
                    >
                      {tutor.calendar_link}
                    </a>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-sage-green-light">
                    <button
                      onClick={() => handleTutorApproval(tutor.id, true)}
                      className="flex-1 bg-sage-green text-cream py-2 px-4 rounded-md hover:bg-forest-green transition-colors"
                    >
                      ✅ Approve Tutor
                    </button>
                    <button
                      onClick={() => handleTutorApproval(tutor.id, false)}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 transition-colors"
                    >
                      ❌ Reject Application
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-cream rounded-lg shadow-soft border border-sage-green-light">
        <div className="border-b border-sage-green-light">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              📊 Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('tutors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tutors'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              🎓 Tutor Management
              {stats && stats.pendingTutors > 0 && (
                <span className="ml-2 bg-golden-yellow text-forest-green text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingTutors}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              👥 User Directory
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-sage-green text-sage-green'
                  : 'border-transparent text-forest-green opacity-60 hover:text-forest-green hover:border-sage-green-light'
              }`}
            >
              💰 Payment Management
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'tutors' && renderTutorManagement()}
      {activeTab === 'users' && renderUserManagement()}
      {activeTab === 'payments' && renderPaymentManagement()}
    </div>
  )
}