'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pendingPitches: 0,
    approvedProjects: 0,
    activeSPVs: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0,
    totalInvestors: 0,
    totalInvested: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkAdmin()
  }, [])

  async function checkAdmin() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/')
      return
    }
    
    if (session.user.email !== 'admin@gain.africa') {
      router.push('/dashboard')
      return
    }
    
    await loadStats()
    setLoading(false)
  }

  async function loadStats() {
    const { data: gainTank } = await supabase.from('gain_tank_projects').select('committee_decision')
    const pendingPitches = gainTank?.filter(p => p.committee_decision === 'pending').length || 0
    const approvedProjects = gainTank?.filter(p => p.committee_decision === 'approved').length || 0

    const { data: spvs } = await supabase.from('spvs').select('status')
    const activeSPVs = spvs?.filter(s => s.status === 'active').length || 0

    const { data: kycUsers } = await supabase.from('users').select('kyc_status').eq('kyc_status', 'pending')
    const pendingKYC = kycUsers?.length || 0

    const { data: withdrawals } = await supabase.from('withdrawals').select('status').eq('status', 'pending')
    const pendingWithdrawals = withdrawals?.length || 0

    // ✅ FIXED: Get accurate investor count from auth.users via RPC
    let totalInvestors = 0
    try {
      const { data: rpcResult, error: rpcError } = await supabase.rpc('get_total_users')
      if (!rpcError && rpcResult) {
        totalInvestors = rpcResult
      } else {
        const { data: users } = await supabase.from('users').select('id')
        totalInvestors = users?.length || 0
        
        const { data: tokenUsers } = await supabase.from('tokens').select('user_id')
        const uniqueFromTokens = new Set(tokenUsers?.map(t => t.user_id) || [])
        if (uniqueFromTokens.size > totalInvestors) {
          totalInvestors = uniqueFromTokens.size
        }
      }
    } catch (error) {
      console.error('Error getting investor count:', error)
      const { data: users } = await supabase.from('users').select('id')
      totalInvestors = users?.length || 0
    }

    const { data: investments } = await supabase.from('investments').select('amount')
    const totalInvested = investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

    setStats({ 
      pendingPitches, 
      approvedProjects, 
      activeSPVs, 
      pendingKYC, 
      pendingWithdrawals, 
      totalInvestors, 
      totalInvested 
    })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) return <div className="p-8 text-center">Loading Admin Portal...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold">👨‍💼 Admin Portal</h1>
              <p className="text-green-100 text-xs mt-1">Manage Gain Platform</p>
            </div>
            <button 
              onClick={handleLogout}
              className="bg-white/20 text-white px-3 py-1 rounded-lg text-xs hover:bg-white/30 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Flow Indicator */}
        <div className="bg-blue-50 rounded-xl p-3 mb-4 text-center border border-blue-200">
          <p className="text-xs font-semibold text-blue-700">📋 GAIN Tank Flow:</p>
          <p className="text-xs text-blue-600 mt-1">Pitches → Approve → Create SPV → Activate → Investors Buy</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-green-600">{stats.totalInvested > 0 ? `$${(stats.totalInvested/1000).toFixed(0)}K` : '$0'}</p>
            <p className="text-[10px] text-gray-500">Total Invested</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.totalInvestors}</p>
            <p className="text-[10px] text-gray-500">Total Investors</p>
          </div>
        </div>

        {/* Admin Modules */}
        <div className="space-y-3">
          <Link href="/admin/gain-tank" className="block bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">🦈 GAIN Tank</h3>
                <p className="text-xs text-purple-100 mt-0.5">Receive & review project pitches</p>
                <p className="text-sm font-bold mt-2">{stats.pendingPitches} pending pitches</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          <Link href="/admin/projects" className="block bg-blue-500 text-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">📋 Approved Projects</h3>
                <p className="text-xs text-blue-100 mt-0.5">Signed deals ready for SPV</p>
                <p className="text-sm font-bold mt-2">{stats.approvedProjects} ready for SPV</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          <Link href="/admin/spvs" className="block bg-indigo-500 text-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">🏗 SPV Management</h3>
                <p className="text-xs text-indigo-100 mt-0.5">Create & activate SPVs</p>
                <p className="text-sm font-bold mt-2">{stats.activeSPVs} active SPVs</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          <div className="border-t border-gray-200 my-2"></div>

          <Link href="/admin/kyc" className="block bg-yellow-500 text-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">🔐 KYC Verification</h3>
                <p className="text-xs text-yellow-100 mt-0.5">Verify investor identities</p>
                <p className="text-sm font-bold mt-2">{stats.pendingKYC} pending</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          <Link href="/admin/withdrawals" className="block bg-orange-500 text-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">💸 Withdrawals</h3>
                <p className="text-xs text-orange-100 mt-0.5">Process withdrawal requests</p>
                <p className="text-sm font-bold mt-2">{stats.pendingWithdrawals} pending</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>

          <Link href="/admin/users" className="block bg-gray-600 text-white rounded-xl p-4 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold">👥 Investor Directory</h3>
                <p className="text-xs text-gray-300 mt-0.5">View all registered investors</p>
                <p className="text-sm font-bold mt-2">{stats.totalInvestors} total</p>
              </div>
              <div className="text-2xl">→</div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}