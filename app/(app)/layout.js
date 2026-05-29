'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import BottomNav from '@/components/BottomNav'

export default function AppLayout({ children }) {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) router.push('/')
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="p-8 text-center">Loading Gain...</div>

  return (
    <div className="pb-20">
      {children}
      <BottomNav />
    </div>
  )
}
