'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/database'

interface AdminDashboardProps {
  user: User
}

export default function AdminDashboard({ user }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'tutors' | 'students' | 'users' | 'sessions'>('overview')

  // Detailed view states
  const [allTutors, setAllTutors] = useState<any[]>([])
  const [allStudents, setAllStudents] = useState<any[]>([])
  const [allSessions, setAllSessions] = useState<any[]>([])
  const [allUsers, setAllUsers] = useState<any[]>([])
  
  // Filter states for sessions
  const [sessionFilters, setSessionFilters] = useState({
    tutor: '',
    student: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  })
  
  // Options for dropdowns
  const [tutorOptions, setTutorOptions] = useState<any[]>([])
  const [studentOptions, setStudentOptions] = useState<any[]>([])

  useEffect(() => {
    fetchStats()
  }, [])

  // Load detailed data when tabs are switched
  useEffect(() => {
    if (activeTab === 'tutors' && allTutors.length === 0) {
      fetchAllTutors()
    }
    if (activeTab === 'students' && allStudents.length === 0) {
      fetchAllStudents()
    }
    if (activeTab === 'users' && allUsers.length === 0) {
      fetchAllUsers()
    }
    if (activeTab === 'sessions' && allSessions.length === 0) {
      fetchAllSessions()
      fetchTutorOptions()
      fetchStudentOptions()
    }
  }, [activeTab])

  const fetchStats = async () => {
    try {
      // Get user counts
      const { data: usersData } = await supabase
        .from('users')
        .select('role')

      const totalUsers = usersData?.length || 0
      const totalTutors = usersData?.filter(u => u.role === 'tutor').length || 0
      const totalStudents = usersData?.filter(u => u.role === 'student').length || 0

      // Get session stats
      const { data: sessionsData } = await supabase
        .from('sessions')
        .select('status, price, scheduled_at, created_at, tutor_id')

      const totalSessions = sessionsData?.length || 0
      const completedSessions = sessionsData?.filter(s => s.status === 'completed').length || 0
      const totalRevenue = sessionsData?.filter(s => s.status === 'completed')
        .reduce((sum, s) => sum + (s.price || 0), 0) || 0

      // ✅ Enhanced analytics
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      // Sessions this week
      const sessionsThisWeek = sessionsData?.filter(s => 
        new Date(s.scheduled_at) >= oneWeekAgo
      ).length || 0

      // Cancellation rate
      const cancelledSessions = sessionsData?.filter(s => s.status === 'cancelled').length || 0
      const cancellationRate = totalSessions > 0 ? Math.round((cancelledSessions / totalSessions) * 100) : 0

      // Active users this month (users with sessions)
      const activeThisMonth = new Set(
        sessionsData?.filter(s => new Date(s.created_at) >= oneMonthAgo)
          .map(s => s.tutor_id)
      ).size || 0

      // Get pending tutors
      const { data: pendingTutors } = await supabase
        .from('tutor_profiles')
        .select('id')
        .eq('is_active', false)

      setStats({
        totalUsers,
        totalTutors,
        totalStudents,
        totalSessions,
        completedSessions,
        totalRevenue,
        sessionsThisWeek,
        cancellationRate,
        activeThisMonth,
        pendingTutors: pendingTutors?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAllTutors = async () => {
    try {
      const { data } = await supabase
        .from('tutor_profiles')
        .select(`
          *,
          users!inner (
            name,
            email,
            phone,
            created_at
          )
        `)
        .order('created_at', { ascending: false })

      setAllTutors(data || [])
    } catch (error) {
      console.error('Error fetching tutors:', error)
    }
  }

  const fetchAllStudents = async () => {
    try {
      console.log('🔍 Fetching all students for admin dashboard...')
      
      // ✅ Use DISTINCT to avoid duplicates and order by user creation
      const { data, error } = await supabase
        .from('users')
        .select(`
          id,
          name,
          email,
          phone,
          created_at,
          students!inner (
            id,
            grade_level,
            school,
            parent_contact,
            parent_contact_email,
            parent_contact_phone
          )
        `)
        .eq('role', 'student')
        .order('created_at', { ascending: false })

      console.log('📊 Students fetch result:', { data, error, count: data?.length })

      if (error) {
        console.error('❌ Error fetching students:', error)
        setAllStudents([])
      } else {
        console.log('✅ Students fetched successfully:', data?.length || 0)
        // Transform to match expected structure
        const transformedStudents = (data || []).map(user => ({
          id: user.students[0]?.id || user.id,
          users: {
            name: user.name,
            email: user.email,
            phone: user.phone,
            created_at: user.created_at
          },
          grade_level: user.students[0]?.grade_level,
          school: user.students[0]?.school,
          parent_contact: user.students[0]?.parent_contact,
          parent_contact_email: user.students[0]?.parent_contact_email,
          parent_contact_phone: user.students[0]?.parent_contact_phone,
          created_at: user.created_at
        }))
        setAllStudents(transformedStudents)
      }
    } catch (error) {
      console.error('💥 Error fetching students:', error)
      setAllStudents([])
    }
  }

  const fetchAllUsers = async () => {
    try {
      const { data } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      setAllUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchAllSessions = async () => {
    try {
      let query = supabase
        .from('sessions')
        .select(`
          *,
          tutor:tutor_profiles!inner (
            id,
            users!inner (
              name,
              email
            )
          ),
          student:students!inner (
            id,
            users!inner (
              name,
              email
            )
          )
        `)

      // Apply filters
      if (sessionFilters.tutor) {
        query = query.eq('tutor_id', sessionFilters.tutor)
      }
      if (sessionFilters.student) {
        query = query.eq('student_id', sessionFilters.student)
      }
      if (sessionFilters.status) {
        query = query.eq('status', sessionFilters.status)
      }
      if (sessionFilters.dateFrom) {
        query = query.gte('scheduled_at', sessionFilters.dateFrom)
      }
      if (sessionFilters.dateTo) {
        query = query.lte('scheduled_at', sessionFilters.dateTo + 'T23:59:59')
      }

      const { data } = await query.order('scheduled_at', { ascending: false })
      setAllSessions(data || [])
    } catch (error) {
      console.error('Error fetching sessions:', error)
    }
  }

  const fetchTutorOptions = async () => {
    try {
      const { data } = await supabase
        .from('tutor_profiles')
        .select(`
          id,
          users!inner (
            name
          )
        `)
        .order('users(name)')

      setTutorOptions(data || [])
    } catch (error) {
      console.error('Error fetching tutor options:', error)
    }
  }

  const fetchStudentOptions = async () => {
    try {
      // ✅ Fetch from users table to avoid duplicates
      const { data } = await supabase
        .from('users')
        .select(`
          id,
          name,
          students!inner (
            id
          )
        `)
        .eq('role', 'student')
        .order('name')

      // Transform to match expected structure
      const transformedOptions = (data || []).map(user => ({
        id: user.students[0]?.id || user.id,
        users: {
          name: user.name
        }
      }))

      setStudentOptions(transformedOptions)
    } catch (error) {
      console.error('Error fetching student options:', error)
      setStudentOptions([])
    }
  }

  // Apply filters to sessions
  useEffect(() => {
    if (activeTab === 'sessions') {
      fetchAllSessions()
    }
  }, [sessionFilters])

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div 
          onClick={() => setActiveTab('users')}
          className="bg-blue-50 rounded-lg p-6 cursor-pointer hover:bg-blue-100 transition-colors"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-3">👥</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('tutors')}
          className="bg-green-50 rounded-lg p-6 cursor-pointer hover:bg-green-100 transition-colors"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-3">🎓</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Active Tutors</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalTutors || 0}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('students')}
          className="bg-purple-50 rounded-lg p-6 cursor-pointer hover:bg-purple-100 transition-colors"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-3">📚</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Students</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
            </div>
          </div>
        </div>

        <div 
          onClick={() => setActiveTab('sessions')}
          className="bg-yellow-50 rounded-lg p-6 cursor-pointer hover:bg-yellow-100 transition-colors"
        >
          <div className="flex items-center">
            <div className="text-3xl mr-3">📝</div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sessions</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.totalSessions || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Platform Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-sm text-gray-600">Total Revenue</p>
            <p className="text-3xl font-bold text-green-600">${stats?.totalRevenue || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Sessions This Week</p>
            <p className="text-3xl font-bold text-blue-600">{stats?.sessionsThisWeek || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Cancellation Rate</p>
            <p className="text-3xl font-bold text-orange-600">{stats?.cancellationRate || 0}%</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">Active This Month</p>
            <p className="text-3xl font-bold text-purple-600">{stats?.activeThisMonth || 0}</p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderTutorManagement = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Tutors ({allTutors.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subjects</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allTutors.map((tutor) => (
                <tr key={tutor.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {tutor.users.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {tutor.users.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {tutor.subjects ? tutor.subjects.slice(0, 2).join(', ') : 'None'}
                    {tutor.subjects && tutor.subjects.length > 2 && '...'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      tutor.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {tutor.is_active ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(tutor.users.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderStudentsList = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Students ({allStudents.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grade Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">School</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parent Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {student.users?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.users?.email || 'No email'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.grade_level || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {student.school || 'Not specified'}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {student.parent_contact_email || student.parent_contact ? (
                      <div>
                        {student.parent_contact_email && (
                          <div>📧 {student.parent_contact_email}</div>
                        )}
                        {student.parent_contact_phone && (
                          <div>📞 {student.parent_contact_phone}</div>
                        )}
                        {!student.parent_contact_email && !student.parent_contact_phone && student.parent_contact && (
                          <div>{student.parent_contact}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Not provided</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(student.users?.created_at || student.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📚</div>
            <p className="text-gray-500">No students found</p>
            <p className="text-sm text-gray-400 mt-2">Students will appear here once they register</p>
          </div>
        )}
      </div>
    </div>
  )

  const renderUsersList = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Users ({allUsers.length})</h3>
          <p className="text-sm text-gray-500 mt-1">Complete user directory including students, tutors, and admins</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' 
                        ? 'bg-red-100 text-red-800'
                        : user.role === 'tutor' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.phone || 'Not provided'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

  const renderSessionsList = () => (
    <div className="space-y-6">
      {/* Session Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filter Sessions</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tutor</label>
            <select
              value={sessionFilters.tutor}
              onChange={(e) => setSessionFilters({ ...sessionFilters, tutor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Tutors</option>
              {tutorOptions.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.users.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              value={sessionFilters.student}
              onChange={(e) => setSessionFilters({ ...sessionFilters, student: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Students</option>
              {studentOptions.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.users.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={sessionFilters.status}
              onChange={(e) => setSessionFilters({ ...sessionFilters, status: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input
              type="date"
              value={sessionFilters.dateFrom}
              onChange={(e) => setSessionFilters({ ...sessionFilters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input
              type="date"
              value={sessionFilters.dateTo}
              onChange={(e) => setSessionFilters({ ...sessionFilters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div className="mt-4 flex space-x-3">
          <button
            onClick={() => setSessionFilters({ tutor: '', student: '', status: '', dateFrom: '', dateTo: '' })}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Clear Filters
          </button>
          <span className="text-sm text-gray-500 flex items-center">
            Showing {allSessions.length} sessions
          </span>
        </div>
      </div>

      {/* Sessions List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">All Sessions ({allSessions.length})</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tutor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allSessions.map((session) => (
                <tr key={session.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(session.scheduled_at).toLocaleDateString()}<br/>
                    <span className="text-gray-500">
                      {new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.tutor?.users?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.student?.users?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {session.subject}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      session.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : session.status === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {session.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                    {session.notes ? (
                      <div className="truncate" title={session.notes}>
                        {session.notes}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">No notes</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${session.price || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {allSessions.length === 0 && (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-gray-500">No sessions found</p>
            <p className="text-sm text-gray-400 mt-2">Sessions will appear here once tutors start logging them</p>
          </div>
        )}
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading admin dashboard...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
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
              onClick={() => setActiveTab('students')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'students'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📚 Students
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              👥 All Users
            </button>
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Sessions
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'tutors' && renderTutorManagement()}
      {activeTab === 'students' && renderStudentsList()}
      {activeTab === 'users' && renderUsersList()}
      {activeTab === 'sessions' && renderSessionsList()}
    </div>
  )
}