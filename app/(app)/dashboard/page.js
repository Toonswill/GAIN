'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getUserAndProfile()
  }, [])

  async function getUserAndProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
    }
    setLoading(false)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) return <div className="p-8 text-center">Loading dashboard...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white p-6 rounded-2xl mb-4">
          <p className="text-sm opacity-90">Welcome back,</p>
          <p className="text-2xl font-bold">
            {userProfile?.first_name || user?.email?.split('@')[0]}
          </p>
          <p className="text-xs opacity-80 mt-2">{user?.email}</p>
        </div>

        {/* KYC Status Banner */}
        {userProfile?.kyc_status !== 'approved' && (
          <div className="bg-yellow-50 rounded-xl p-4 mb-4 border border-yellow-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-yellow-800">⚠️ KYC Required</p>
                <p className="text-xs text-yellow-700">Verify your identity to start investing</p>
              </div>
              <Link 
                href="/kyc" 
                className="bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-700"
              >
                Verify Now
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-2xl font-bold text-green-600">${userProfile?.wallet_balance?.toLocaleString() || 0}</p>
            <p className="text-xs text-gray-500">Wallet Balance</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <p className="text-2xl font-bold text-green-600">{userProfile?.green_points || 0}</p>
            <p className="text-xs text-gray-500">Green Points</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3 mb-4">
          <Link href="/projects" className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌍</span>
              <div>
                <p className="font-semibold">Browse Green Projects</p>
                <p className="text-xs text-gray-500">Start investing from just $10</p>
              </div>
            </div>
          </Link>

          <Link href="/wallet" className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👛</span>
              <div>
                <p className="font-semibold">Add Funds</p>
                <p className="text-xs text-gray-500">Deposit to your wallet</p>
              </div>
            </div>
          </Link>

          <Link href="/impact" className="block bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🌱</span>
              <div>
                <p className="font-semibold">Your Green Impact</p>
                <p className="text-xs text-gray-500">Track CO₂ saved and points</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 p-3 rounded-xl font-semibold text-sm"
        >
          Logout
        </button>
      </div>
    </div>
  )
}