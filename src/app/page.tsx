'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
      
      if (error) {
        console.error('Error:', error)
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      console.error('Unexpected error:', err)
    }
  }

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Tutoring Platform</h1>
      <div className="bg-green-100 p-4 rounded-lg">
        <h2 className="text-xl font-semibold mb-2">✅ Setup Complete!</h2>
        <p>Your app is connected to Supabase.</p>
        <p>Users in database: {users.length}</p>
      </div>
    </main>
  )
}