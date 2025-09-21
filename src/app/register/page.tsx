'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    role: 'student' as 'student' | 'tutor'
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    // Sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
    })

    if (authError) {
      setMessage(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: formData.email,
          name: formData.name,
          phone: formData.phone,
          role: formData.role,
        })

      if (profileError) {
        setMessage('Account created but profile setup failed: ' + profileError.message + '. Please contact support.')
        setLoading(false)
        return
      }

      // Handle role-specific setup
      if (formData.role === 'tutor') {
        // Tutors will complete their profile later via /profile/setup
        setMessage('Registration successful! Please check your email to verify your account, then complete your tutor profile setup.')
      } else {
        // If student, create student profile
        const { error: studentError } = await supabase
          .from('students')
          .insert({
            user_id: authData.user.id,
          })

        if (studentError) {
          console.error('Student profile creation failed:', studentError)
          setMessage('Account created but student profile setup failed. Please contact support.')
        } else {
          setMessage('Registration successful! Please check your email to verify your account.')
        }
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-sage-green-light flex items-center justify-center py-12">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-forest-green mb-2 font-serif">
            Will's Tutoring
          </h1>
          <h2 className="text-xl font-semibold text-forest-green font-serif">
            Create your account
          </h2>
          <p className="mt-2 text-forest-green opacity-80">
            Join our community of learners and educators
          </p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-forest-green mb-2">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-forest-green mb-2">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-forest-green mb-2">
                  Phone number <span className="text-forest-green opacity-60">(optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-forest-green mb-2">
                  I am a...
                </label>
                <select
                  id="role"
                  className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value as 'student' | 'tutor'})}
                >
                  <option value="student">Student</option>
                  <option value="tutor">Tutor</option>
                </select>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-forest-green mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 border border-sage-green-light rounded-md focus:outline-none focus:ring-sage-green focus:border-sage-green bg-cream text-forest-green"
                  placeholder="Create a secure password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            {/* Tutor Notice */}
            {formData.role === 'tutor' && (
              <div className="bg-sage-green-light border border-sage-green rounded-lg p-4">
                <div className="flex items-start">
                  <div className="text-sage-green text-xl mr-3">ℹ️</div>
                  <div>
                    <h3 className="text-forest-green font-medium">Tutor Application Process</h3>
                    <p className="text-forest-green text-sm mt-1">
                      After registration, you'll need to complete your tutor profile with subjects, grades, bio, and calendar link. 
                      All tutor profiles require admin approval before becoming active.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {message && (
              <div className={`p-3 rounded-md border ${
                message.includes('successful') 
                  ? 'bg-sage-green-light border-sage-green text-forest-green' 
                  : 'bg-red-50 border-red-200 text-red-600'
              }`}>
                <div className="text-sm text-center">{message}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/login" className="text-sage-green hover:text-forest-green font-medium transition-colors">
                Already have an account? Sign in
              </Link>
            </div>
          </form>
        </div>

        {/* Decorative elements */}
        <div className="text-center text-3xl opacity-40 space-x-4">
          <span>🌱</span>
          <span>📚</span>
          <span>🎓</span>
        </div>
      </div>
    </div>
  )
}