'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-sage-green-light flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-forest-green mb-2 font-serif">
            Will's Tutoring
          </h1>
          <h2 className="text-xl font-semibold text-forest-green font-serif">
            Sign in to your account
          </h2>
          <p className="mt-2 text-forest-green opacity-80">
            Welcome back! Please enter your details.
          </p>
        </div>

        <div className="card p-8">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
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
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {message && (
              <div className="p-3 rounded-md bg-red-50 border border-red-200">
                <div className="text-red-600 text-sm text-center">{message}</div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>

            <div className="text-center">
              <Link href="/register" className="text-sage-green hover:text-forest-green font-medium transition-colors">
                Don't have an account? Sign up
              </Link>
            </div>
          </form>
        </div>

        {/* Decorative elements */}
        <div className="text-center text-3xl opacity-40 space-x-4">
          <span>📖</span>
          <span>🏛️</span>
          <span>🎯</span>
        </div>
      </div>
    </div>
  )
}