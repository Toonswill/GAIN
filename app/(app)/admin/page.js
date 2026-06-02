'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    pendingKYC: 0,
    pendingWithdrawals: 0,
    totalUsers: 0,
    totalInvested: 0,
    pendingGreenlit: 0,
    approvedProjects: 0,
    activeSPVs: 0,
    draftSPVs: 0
  })
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session || session.user.email !== 'admin@gain.africa') {
      router.push('/')
      return
    }
    
    await loadStats()
    setLoading(false)
  }

  async function loadStats() {
    // Projects stats (legacy)
    const { data: projects } = await supabase.from('projects').select('status')
    const totalProjects = projects?.length || 0
    const activeProjects = projects?.filter(p => p.status === 'active').length || 0

    // KYC stats
    const { data: kycUsers } = await supabase.from('users').select('kyc_status').eq('kyc_status', 'pending')
    const pendingKYC = kycUsers?.length || 0

    // Withdrawal stats
    const { data: withdrawals } = await supabase.from('withdrawals').select('status').eq('status', 'pending')
    const pendingWithdrawals = withdrawals?.length || 0

    // User stats
    const { data: users } = await supabase.from('users').select('id')
    const totalUsers = users?.length || 0

    // Investment stats
    const { data: investments } = await supabase.from('investments').select('amount')
    const totalInvested = investments?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0

    // GAIN Tank stats
    const { data: gainTankProjects } = await supabase.from('gain_tank_projects').select('committee_decision')
    const pendingGreenlit = gainTankProjects?.filter(p => p.committee_decision === 'pending').length || 0
    const approvedProjects = gainTankProjects?.filter(p => p.committee_decision === 'approved').length || 0

    // SPV stats
    const { data: spvs } = await supabase.from('spvs').select('status')
    const activeSPVs = spvs?.filter(s => s.status === 'active').length || 0
    const draftSPVs = spvs?.filter(s => s.status === 'draft').length || 0

    setStats({ 
      totalProjects, 
      activeProjects, 
      pendingKYC, 
      pendingWithdrawals, 
      totalUsers, 
      totalInvested, 
      pendingGreenlit, 
      approvedProjects,
      activeSPVs,
      draftSPVs
    })
  }

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0'
    if (value < 1000) return `$${Math.round(value)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`
    return `$${(value / 1000000).toFixed(1)}M`
  }

  if (loading) return <div className="p-8 text-center">Loading admin portal...</div>

  const adminModules = [
    { 
      title: '🦈 GAIN Tank', 
      description: 'Receive & review project pitches', 
      href: '/admin/gain-tank', 
      stats: `${stats.pendingGreenlit} pending pitches`, 
      color: 'bg-purple-500', 
      alert: stats.pendingGreenlit > 0 
    },
    { 
      title: '📋 Approved Projects', 
      description: 'Signed deals ready for SPV creation', 
      href: '/admin/projects', 
      stats: `${stats.approvedProjects} ready for SPV`, 
      color: 'bg-blue-500',
      alert: stats.approvedProjects > 0
    },
    { 
      title: '🏗 SPV Management', 
      description: 'Create & activate Special Purpose Vehicles', 
      href: '/admin/spvs', 
      stats: `${stats.activeSPVs} active · ${stats.draftSPVs} draft`, 
      color: 'bg-indigo-500' 
    },
    { 
      title: '🔐 KYC Verification', 
      description: 'Verify user identities', 
      href: '/admin/kyc', 
      stats: `${stats.pendingKYC} pending`, 
      color: 'bg-yellow-500', 
      alert: stats.pendingKYC > 0 
    },
    { 
      title: '💸 Withdrawals', 
      description: 'Process withdrawal requests', 
      href: '/admin/withdrawals', 
      stats: `${stats.pendingWithdrawals} pending`, 
      color: 'bg-blue-500', 
      alert: stats.pendingWithdrawals > 0 
    },
    { 
      title: '👥 Users', 
      description: 'View all registered users', 
      href: '/admin/users', 
      stats: `${stats.totalUsers} total`, 
      color: 'bg-purple-500' 
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white rounded-2xl p-4 mb-6">
          <h1 className="text-xl font-bold">Admin Portal</h1>
          <p className="text-green-100 text-xs mt-1">Manage Gain platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs text-gray-500">Total Invested</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalInvested)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm">
            <p className="text-xs text-gray-500">Total Users</p>
            <p className="text-lg font-bold text-blue-600">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Flow Indicator */}
        <div className="bg-green-50 rounded-xl p-3 mb-4 text-center">
          <p className="text-xs text-green-700">📋 The GAIN Tank Flow:</p>
          <p className="text-xs text-green-600 mt-1">
            Pitches → Approve → Create SPV → Activate → Investors
          </p>
        </div>

        {/* Admin Modules */}
        <div className="space-y-3">
          {adminModules.map((module) => (
            <Link 
              key={module.href} 
              href={module.href} 
              className={`block bg-white rounded-xl shadow-sm border p-4 active:bg-gray-50 ${module.alert ? 'border-yellow-300 bg-yellow-50/30' : 'border-gray-100'}`}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-800 text-sm">{module.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{module.description}</p>
                  <p className={`text-xs mt-2 ${module.alert ? 'text-yellow-600 font-semibold' : 'text-gray-400'}`}>
                    {module.stats}
                  </p>
                </div>
                <div className="text-green-600">→</div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}