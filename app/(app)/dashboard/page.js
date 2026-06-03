'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({
    totalInvested: 0,
    activeSPVs: 0,
    greenPoints: 0,
    co2Saved: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }
    
    // Redirect admin to admin portal
    if (user.email === 'admin@gain.africa') {
      router.push('/admin')
      return
    }
    
    setUser(user)
    
    // Load user profile
    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    setProfile(profileData)
    
    // Load user stats
    const { data: tokens } = await supabase
      .from('tokens')
      .select('amount_paid, spv_id')
      .eq('user_id', user.id)
    
    const totalInvested = tokens?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0
    
    const { data: spvs } = await supabase
      .from('spvs')
      .select('id')
      .eq('status', 'active')
    
    // Calculate green points (1 point per $1 invested, plus bonuses)
    const greenPoints = Math.floor(totalInvested * 1.2) // 20% bonus for green investments
    
    // Estimate CO2 saved (rough calculation: 1 ton per $100 invested)
    const co2Saved = (totalInvested / 100).toFixed(1)
    
    setStats({
      totalInvested,
      activeSPVs: spvs?.length || 0,
      greenPoints,
      co2Saved
    })
    
    setLoading(false)
  }

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0'
    if (value < 1000) return `$${Math.round(value)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`
    return `$${(value / 1000000).toFixed(1)}M`
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-pulse text-3xl mb-2">🌍</div>
        <p className="text-gray-500 text-sm">Loading your dashboard...</p>
      </div>
    </div>
  )

  // Check if KYC is needed
  const needsKYC = profile?.kyc_status !== 'approved' && profile?.kyc_status !== 'pending'

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-md mx-auto">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white px-5 pt-8 pb-12 rounded-b-3xl">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-green-100 text-sm">Welcome back,</p>
              <h1 className="text-2xl font-bold">{profile?.first_name || user?.email?.split('@')[0]}</h1>
            </div>
            <div className="bg-white/20 rounded-full p-2">
              <span className="text-xl">🌱</span>
            </div>
          </div>
          
          {/* Main Balance Card */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-green-100 text-xs">Portfolio Value</p>
            <p className="text-3xl font-bold">{formatCurrency(stats.totalInvested)}</p>
            <p className="text-green-100 text-xs mt-2">Across {stats.activeSPVs} active SPVs</p>
          </div>
        </div>

        {/* KYC Warning Banner */}
        {needsKYC && (
          <div className="mx-4 -mt-4">
            <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-sm text-yellow-800">KYC Required</p>
                  <p className="text-xs text-yellow-700">Verify to start investing</p>
                </div>
              </div>
              <Link href="/kyc" className="bg-yellow-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                Verify Now
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 p-4">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{stats.greenPoints}</p>
            <p className="text-[10px] text-gray-500">Green Points</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.co2Saved}</p>
            <p className="text-[10px] text-gray-500">Tons CO₂ Saved</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.activeSPVs}</p>
            <p className="text-[10px] text-gray-500">Active SPVs</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 mb-1">Quick Actions</h2>
          
          <Link href="/invest" className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">
                  📈
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Browse Investments</p>
                  <p className="text-xs text-gray-500">Discover green SPVs</p>
                </div>
              </div>
              <span className="text-green-600">→</span>
            </div>
          </Link>

          <Link href="/wallet" className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                  👛
                </div>
                <div>
                  <p className="font-semibold text-gray-800">My Wallet</p>
                  <p className="text-xs text-gray-500">{formatCurrency(profile?.wallet_balance || 0)} available</p>
                </div>
              </div>
              <span className="text-green-600">→</span>
            </div>
          </Link>

          <Link href="/portfolio" className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">
                  📊
                </div>
                <div>
                  <p className="font-semibold text-gray-800">My Portfolio</p>
                  <p className="text-xs text-gray-500">Track your investments</p>
                </div>
              </div>
              <span className="text-green-600">→</span>
            </div>
          </Link>

          <Link href="/impact" className="block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">
                  🌱
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Your Impact</p>
                  <p className="text-xs text-gray-500">See your green contribution</p>
                </div>
              </div>
              <span className="text-green-600">→</span>
            </div>
          </Link>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="px-4 mt-6">
          <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🔄</span>
              <h3 className="font-semibold text-sm text-gray-800">Recent Activity</h3>
            </div>
            {stats.totalInvested === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                No investments yet. Start your green journey today!
              </p>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">
                Your investments are growing. Check your portfolio for details.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}