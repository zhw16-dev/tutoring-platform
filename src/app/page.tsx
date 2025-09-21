'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="animate-pulse-sage text-forest-green">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cream to-sage-green-light flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-forest-green mb-2 font-serif">
            Will's Tutoring
          </h1>
          <p className="text-forest-green mb-8 font-sans">
            Connect students with qualified tutors
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/register"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-soft text-sm font-medium text-cream bg-sage-green hover:bg-forest-green focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-green transition-colors"
          >
            Get Started
          </Link>
          
          <Link
            href="/login"
            className="w-full flex justify-center py-3 px-4 border border-sage-green-light rounded-md shadow-soft text-sm font-medium text-forest-green bg-cream hover:bg-sage-green-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-green transition-colors"
          >
            Sign In
          </Link>
        </div>

        <div className="text-center text-sm text-forest-green opacity-80 space-y-2">
          <p><strong>Students:</strong> Find and book sessions with tutors</p>
          <p><strong>Tutors:</strong> Manage your availability and students</p>
        </div>

        {/* Decorative illustration elements */}
        <div className="text-center text-4xl opacity-60 space-x-4">
          <span>📚</span>
          <span>🎓</span>
          <span>✏️</span>
        </div>
      </div>
    </div>
  )
}