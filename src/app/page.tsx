'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useApp } from '@/context/AppContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { state, dispatch } = useApp()
  const router = useRouter()

  useEffect(() => {
    if (state.isLoggedIn) {
      router.push('/dashboard')
    }
  }, [state.isLoggedIn, router])

  if (state.isLoggedIn) {
    return null
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (username === 'demo' && password === 'demo123') {
      setError('')
      dispatch({ type: 'LOGIN' })
      router.push('/dashboard')
    } else {
      setError('Invalid credentials. Try demo / demo123')
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border border-[var(--color-border)] p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              Will&apos;s Tutoring
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">Product Demo</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] placeholder:text-[var(--color-text-tertiary)]"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <p className="text-[var(--color-error)] text-sm">{error}</p>
            )}

            <button
              type="submit"
              className="w-full bg-[var(--color-accent)] text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-[var(--color-accent-hover)] transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-tertiary)] mb-2">Demo credentials:</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Username: <span className="font-medium">demo</span>
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Password: <span className="font-medium">demo123</span>
            </p>
          </div>
        </div>

        <p className="text-center mt-6">
          <a
            href="https://wzhai.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            Built by Will Zhai · Portfolio ↗
          </a>
        </p>
      </div>
    </div>
  )
}
