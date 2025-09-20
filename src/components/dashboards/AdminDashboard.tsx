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
  etransfer_email: string
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
  completedSessions: number
  pendingPayments: number
  unpaidStudentAmount: number
  unpaidTutorAmount: number
}

interface PaymentRecord {
  id: string
  session_id: string
  amount: number
  student_paid: boolean
  tutor_paid: boolean
  student_name: string
  tutor_name: string
  tutor_etransfer: string
  subject: string
  session_date: string
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [pendingTutors, setPendingTutors] = useState<PendingTutor[]>([])
  const [pendingPayments, setPendingPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tutors' | 'payments'>('overview')

  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      console.log('Fetching admin data...')
      
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

      // Get session counts
      const { count: totalSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })

      const { count: completedSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get pending payments count
      const { count: pendingPayments } = await supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('student_paid', false)

      // Get payment statistics
      const { data: paymentsData } = await supabase
        .from('payments')
        .select(`
          *,
          session:sessions(
            subject,
            scheduled_at,
            student:students(
              user:users(name)
            ),
            tutor:tutor_profiles(
              user:users(name),
              etransfer_email
            )
          )
        `)
        .order('created_at', { ascending: false })

      console.log('Payments data:', paymentsData)

      let unpaidStudentAmount = 0
      let unpaidTutorAmount = 0
      const paymentRecords: PaymentRecord[] = []

      if (paymentsData) {
        paymentsData.forEach(payment => {
          if (!payment.student_paid) {
            unpaidStudentAmount += payment.amount
          }
          if (!payment.tutor_paid && payment.student_paid) {
            unpaidTutorAmount += payment.amount / 2 // Tutors get 50%
          }

          paymentRecords.push({
            id: payment.id,
            session_id: payment.session_id,
            amount: payment.amount,
            student_paid: payment.student_paid,
            tutor_paid: payment.tutor_paid,
            student_name: payment.session?.student?.user?.name || 'Unknown',
            tutor_name: payment.session?.tutor?.user?.name || 'Unknown', 
            tutor_etransfer: payment.session?.tutor?.etransfer_email || 'Not provided',
            subject: payment.session?.subject || 'Unknown',
            session_date: payment.session?.scheduled_at ? new Date(payment.session.scheduled_at).toLocaleDateString() : 'Unknown'
          })
        })
      }

      setPendingPayments(paymentRecords)

      console.log('Fetching pending tutors...')
      
      // Get pending tutors manually
      const { data: pendingProfiles, error: profilesError } = await supabase
        .from('tutor_profiles')
        .select('*')
        .eq('is_active', false)
        .order('created_at', { ascending: true })

      console.log('Manual - Pending profiles:', pendingProfiles, 'Error:', profilesError)

      let tutorsWithUserData: PendingTutor[] = []

      if (pendingProfiles && pendingProfiles.length > 0) {
        // Get user data for each pending tutor
        const userIds = pendingProfiles.map(p => p.user_id)
        console.log('Manual - User IDs to fetch:', userIds)
        
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', userIds)

        console.log('Manual - User data fetched:', userData, 'Error:', userError)

        if (userData && userData.length > 0) {
          // Combine the data
          tutorsWithUserData = pendingProfiles.map(profile => {
            const user = userData.find(u => u.id === profile.user_id)
            console.log(`Manual - Profile ${profile.id} has user_id: ${profile.user_id}`)
            console.log(`Manual - Found matching user:`, user)
            return {
              id: profile.id,
              user_id: profile.user_id,
              subjects: profile.subjects || [],
              bio: profile.bio || '',
              calendar_link: profile.calendar_link || '',
              etransfer_email: profile.etransfer_email || '',
              is_active: profile.is_active,
              created_at: profile.created_at,
              user_name: user?.name || `Missing name for ID: ${profile.user_id}`,
              user_email: user?.email || `Missing email for ID: ${profile.user_id}`
            }
          })
        } else {
          console.log('No user data found')
          tutorsWithUserData = pendingProfiles.map(profile => ({
            id: profile.id,
            user_id: profile.user_id,
            subjects: profile.subjects || [],
            bio: profile.bio || '',
            calendar_link: profile.calendar_link || '',
            etransfer_email: profile.etransfer_email || '',
            is_active: profile.is_active,
            created_at: profile.created_at,
            user_name: `No users found - ID: ${profile.user_id}`,
            user_email: 'No users table data'
          }))
        }
      }

      console.log('Final tutors with user data:', tutorsWithUserData)

      setStats({
        totalUsers: totalUsers || 0,
        totalTutors: totalTutors || 0,
        activeTutors: activeTutors || 0,
        pendingTutors: pendingTutorCount || 0,
        totalStudents: totalStudents || 0,
        totalSessions: totalSessions || 0,
        completedSessions: completedSessions || 0,
        pendingPayments: pendingPayments || 0,
        unpaidStudentAmount: unpaidStudentAmount || 0,
        unpaidTutorAmount: unpaidTutorAmount || 0,
      })

      setPendingTutors(tutorsWithUserData)

    } catch (error) {
      console.error('Error fetching admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTutorApproval = async (tutorId: string, approve: boolean) => {
    console.log('🔄 Starting approval process...')
    console.log('Tutor ID:', tutorId)
    console.log('Approving:', approve)
    
    try {
      // Step 1: Check if the tutor exists
      console.log('📋 Checking if tutor exists...')
      const { data: existingTutor, error: fetchError } = await supabase
        .from('tutor_profiles')
        .select('id, user_id, is_active')
        .eq('id', tutorId)
        .single()

      console.log('Existing tutor:', existingTutor)
      
      if (fetchError || !existingTutor) {
        console.error('❌ Could not find tutor:', fetchError)
        alert('Error: Could not find this tutor profile.')
        return
      }

      // Step 2: Update the tutor approval status
      console.log('✏️ Updating tutor approval status...')
      const { data: updateResult, error: updateError } = await supabase
        .from('tutor_profiles')
        .update({ is_active: approve })
        .eq('id', tutorId)
        .select()

      console.log('Update result:', updateResult)
      
      if (updateError) {
        console.error('❌ Update failed:', updateError)
        alert(`Update failed: ${updateError.message}`)
        return
      }

      if (!updateResult || updateResult.length === 0) {
        console.error('❌ No rows were updated')
        alert('Error: No changes were made. Please try again.')
        return
      }

      // Step 3: Double-check the change worked
      console.log('🔍 Verifying the change worked...')
      const { data: verifyResult } = await supabase
        .from('tutor_profiles')
        .select('is_active')
        .eq('id', tutorId)
        .single()

      console.log('Verification result:', verifyResult)

      if (verifyResult?.is_active === approve) {
        console.log('✅ Success! Change confirmed in database')
        const message = approve ? 'Tutor approved successfully!' : 'Tutor rejected successfully!'
        alert(message)
        
        // Refresh the page data
        await fetchAdminData()
      } else {
        console.error('❌ Verification failed')
        alert('Error: The change did not save properly. Please try again.')
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error)
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleStudentPayment = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          student_paid: true, 
          student_payment_date: new Date().toISOString() 
        })
        .eq('id', paymentId)

      if (error) throw error
      
      alert('Student payment marked as received!')
      fetchAdminData()
    } catch (error) {
      console.error('Error updating student payment:', error)
      alert('Error updating payment status')
    }
  }

  const handleTutorPayout = async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .update({ 
          tutor_paid: true, 
          tutor_payout_date: new Date().toISOString() 
        })
        .eq('id', paymentId)

      if (error) throw error
      
      alert('Tutor payout marked as completed!')
      fetchAdminData()
    } catch (error) {
      console.error('Error updating tutor payout:', error)
      alert('Error updating payout status')
    }
  }

  if (loading) {
    return <div className="p-6">Loading admin dashboard...</div>
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Pending Approvals Alert */}
      {stats && stats.pendingTutors > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-400 text-xl mr-3">⚠️</div>
            <div>
              <h3 className="text-yellow-800 font-medium">
                {stats.pendingTutors} tutor{stats.pendingTutors !== 1 ? 's' : ''} waiting for approval
              </h3>
              <p className="text-yellow-700 text-sm mt-1">
                Review pending tutor applications to activate their profiles.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('tutors')}
              className="ml-auto bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 text-sm"
            >
              Review Applications
            </button>
          </div>
        </div>
      )}

      {/* Payment Alert */}
      {stats && (stats.unpaidStudentAmount > 0 || stats.unpaidTutorAmount > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-red-400 text-xl mr-3">💳</div>
            <div>
              <h3 className="text-red-800 font-medium">
                Payments require attention
              </h3>
              <p className="text-red-700 text-sm mt-1">
                ${stats.unpaidStudentAmount} due from students | ${stats.unpaidTutorAmount} owed to tutors
              </p>
            </div>
            <button
              onClick={() => setActiveTab('payments')}
              className="ml-auto bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 text-sm"
            >
              Manage Payments
            </button>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">👥</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Users</p>
              <p className="text-2xl font-bold text-blue-900">{stats?.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-md">🎓</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-green-600">Active Tutors</p>
              <p className="text-2xl font-bold text-green-900">{stats?.activeTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6 cursor-pointer" onClick={() => setActiveTab('tutors')}>
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">⏳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{stats?.pendingTutors}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-md">📚</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-purple-600">Students</p>
              <p className="text-2xl font-bold text-purple-900">{stats?.totalStudents}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Session Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Sessions</span>
              <span className="font-medium">{stats?.totalSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Completed</span>
              <span className="font-medium text-green-600">{stats?.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate</span>
              <span className="font-medium">
                {stats?.totalSessions 
                  ? `${Math.round((stats.completedSessions / stats.totalSessions) * 100)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Revenue Overview</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Completed Sessions</span>
              <span className="font-medium">{stats?.completedSessions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Platform Revenue</span>
              <span className="font-medium text-green-600">
                ${((stats?.completedSessions || 0) * 25).toFixed(0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tutor Earnings</span>
              <span className="font-medium">
                ${((stats?.completedSessions || 0) * 25).toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Students Owe</span>
              <span className="font-medium text-red-600">${stats?.unpaidStudentAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Tutors Owed</span>
              <span className="font-medium text-yellow-600">${stats?.unpaidTutorAmount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Pending Items</span>
              <span className="font-medium">{pendingPayments.filter(p => !p.student_paid || !p.tutor_paid).length}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTutorManagement = () => {
    console.log('Rendering tutor management, pending tutors:', pendingTutors)
    
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Pending Tutor Approvals ({pendingTutors.length})
            </h3>
            <p className="text-gray-600 text-sm mt-1">
              Review and approve tutor applications to activate their profiles
            </p>
          </div>
          
          <div className="p-6">
            {pendingTutors.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-400 text-4xl mb-4">✅</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">All caught up!</h3>
                <p className="text-gray-600">No tutor applications pending approval.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {pendingTutors.map((tutor) => {
                  console.log('Rendering tutor:', tutor)
                  return (
                    <div key={tutor.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900">
                            {tutor.user_name}
                          </h4>
                          <p className="text-gray-600">{tutor.user_email}</p>
                          <p className="text-sm text-gray-500">
                            Applied: {new Date(tutor.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          Pending Review
                        </span>
                      </div>

                      {/* Subjects */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Teaching Subjects</h5>
                        <div className="flex flex-wrap gap-2">
                          {tutor.subjects.map((subject, index) => (
                            <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {subject}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Bio</h5>
                        <p className="text-gray-700 text-sm">{tutor.bio}</p>
                      </div>

                      {/* Calendar Link */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">Calendar Link</h5>
                        <a 
                          href={tutor.calendar_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {tutor.calendar_link}
                        </a>
                      </div>

                      {/* E-transfer Email */}
                      <div className="mb-4">
                        <h5 className="font-medium text-gray-900 mb-2">E-transfer Email</h5>
                        <p className="text-gray-700 text-sm font-mono bg-gray-50 p-2 rounded">
                          {tutor.etransfer_email || 'Not provided'}
                        </p>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => handleTutorApproval(tutor.id, true)}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
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
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderPaymentManagement = () => (
    <div className="space-y-6">
      {/* Payment Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-md">💳</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-red-600">Student Payments Due</p>
              <p className="text-2xl font-bold text-red-900">${stats?.unpaidStudentAmount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-md">💰</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-yellow-600">Tutor Payouts Due</p>
              <p className="text-2xl font-bold text-yellow-900">${stats?.unpaidTutorAmount || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-md">📊</div>
            <div className="ml-4">
              <p className="text-sm font-medium text-blue-600">Total Pending</p>
              <p className="text-2xl font-bold text-blue-900">{pendingPayments.filter(p => !p.student_paid || !p.tutor_paid).length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Management Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Payment Management</h3>
          <p className="text-gray-600 text-sm mt-1">
            Track student payments and tutor payouts. Students pay via e-transfer, tutors get paid out manually.
          </p>
        </div>
        
        <div className="p-6">
          {pendingPayments.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">💰</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payments to manage</h3>
              <p className="text-gray-600">Payment records will appear here when sessions are completed.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((payment) => (
                <div key={payment.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {payment.student_name} - {payment.subject}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Session Date: {payment.session_date} | Amount: ${payment.amount}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tutor: {payment.tutor_name}
                      </p>
                      <p className="text-sm text-gray-500 font-mono bg-gray-50 p-1 rounded mt-1">
                        E-transfer: {payment.tutor_etransfer}
                      </p>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      {/* Student Payment */}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={payment.student_paid}
                          onChange={() => handleStudentPayment(payment.id)}
                          className="mr-2"
                          disabled={payment.student_paid}
                        />
                        <span className={payment.student_paid ? 'text-green-600' : 'text-red-600'}>
                          Student Paid ${payment.amount}
                          {payment.student_paid && ' ✅'}
                        </span>
                      </label>
                      
                      {/* Tutor Payout */}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={payment.tutor_paid}
                          onChange={() => handleTutorPayout(payment.id)}
                          className="mr-2"
                          disabled={payment.tutor_paid || !payment.student_paid}
                        />
                        <span className={payment.tutor_paid ? 'text-green-600' : 'text-yellow-600'}>
                          Tutor Paid ${payment.amount / 2}
                          {payment.tutor_paid && ' ✅'}
                        </span>
                      </label>
                      
                      {!payment.student_paid && (
                        <p className="text-xs text-gray-500">Waiting for student payment</p>
                      )}
                      {payment.student_paid && !payment.tutor_paid && (
                        <p className="text-xs text-yellow-600">Ready for tutor payout</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payment Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">Payment Process</h3>
        <div className="text-sm text-blue-700 space-y-1">
          <p>1. Students send e-transfer payments directly to you</p>
          <p>2. Mark "Student Paid" when you receive their payment</p>
          <p>3. Send e-transfer to tutor using their email above</p>
          <p>4. Mark "Tutor Paid" when you've sent their payout</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📊 Platform Overview
            </button>
            <button
              onClick={() => setActiveTab('tutors')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tutors'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              🎓 Tutor Management
              {stats && stats.pendingTutors > 0 && (
                <span className="ml-2 bg-yellow-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {stats.pendingTutors}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'payments'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              💰 Payment Management
              {stats && (stats.unpaidStudentAmount > 0 || stats.unpaidTutorAmount > 0) && (
                <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  !
                </span>
              )}
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'tutors' && renderTutorManagement()}
      {activeTab === 'payments' && renderPaymentManagement()}
    </div>
  )
}