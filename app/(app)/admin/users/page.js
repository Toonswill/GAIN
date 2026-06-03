'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InvestorDirectory() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState({ total: 0, pendingKYC: 0, verified: 0 })
  const router = useRouter()

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session || session.user.email !== 'admin@gain.africa') {
      router.push('/')
      return
    }
    await fetchAllInvestors()
  }

  async function fetchAllInvestors() {
    try {
      // Get all users from auth.users via the RPC function
      const { data: authUsers, error: authError } = await supabase.rpc('get_all_users')
      
      let investorsList = []
      
      if (!authError && authUsers && authUsers.length > 0) {
        // Use auth users data
        investorsList = authUsers.map(user => ({
          id: user.id,
          email: user.email,
          first_name: user.first_name || user.email?.split('@')[0],
          last_name: user.last_name || '',
          kyc_status: user.kyc_status || 'not_submitted',
          wallet_balance: user.wallet_balance || 0,
          green_points: user.green_points || 0,
          country: user.country || 'Not set',
          phone: user.phone || '',
          created_at: user.created_at
        }))
      } else {
        // Fallback: Get from public.users and add auth users
        const { data: publicUsers } = await supabase.from('users').select('*')
        
        // Also get auth users via the function
        const { data: allAuthUsers } = await supabase.rpc('get_all_users_simple')
        
        if (allAuthUsers && allAuthUsers.length > 0) {
          // Merge auth users with public data
          const publicMap = new Map(publicUsers?.map(p => [p.id, p]) || [])
          investorsList = allAuthUsers.map(authUser => ({
            id: authUser.id,
            email: authUser.email,
            first_name: publicMap.get(authUser.id)?.first_name || authUser.email?.split('@')[0],
            last_name: publicMap.get(authUser.id)?.last_name || '',
            kyc_status: publicMap.get(authUser.id)?.kyc_status || 'not_submitted',
            wallet_balance: publicMap.get(authUser.id)?.wallet_balance || 0,
            green_points: publicMap.get(authUser.id)?.green_points || 0,
            country: publicMap.get(authUser.id)?.country || 'Not set',
            phone: publicMap.get(authUser.id)?.phone || '',
            created_at: authUser.created_at
          }))
        } else {
          investorsList = publicUsers || []
        }
      }
      
      // Calculate stats
      const total = investorsList.length
      const pendingKYC = investorsList.filter(i => i.kyc_status === 'pending').length
      const verified = investorsList.filter(i => i.kyc_status === 'approved').length
      
      setStats({ total, pendingKYC, verified })
      setInvestors(investorsList)
    } catch (error) {
      console.error('Error fetching investors:', error)
      // Fallback to public.users
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false })
      setInvestors(data || [])
      setStats({ total: data?.length || 0, pendingKYC: 0, verified: 0 })
    }
    setLoading(false)
  }

  async function updateKYCStatus(userId, newStatus) {
    const { error } = await supabase
      .from('users')
      .update({ kyc_status: newStatus })
      .eq('id', userId)
    
    if (error) {
      alert('Error updating KYC: ' + error.message)
    } else {
      alert(`KYC status updated to ${newStatus}`)
      await fetchAllInvestors()
    }
  }

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0'
    if (value < 1000) return `$${Math.round(value)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`
    return `$${(value / 1000000).toFixed(1)}M`
  }

  const filteredInvestors = investors.filter(investor => 
    investor.email?.toLowerCase().includes(search.toLowerCase()) ||
    investor.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    (investor.first_name + ' ' + investor.last_name).toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-center">Loading investor directory...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-green-800">👥 Investor Directory</h1>
          <p className="text-xs text-gray-500">View all registered investors on Gain</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-lg font-bold text-green-600">{stats.total}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-lg font-bold text-yellow-600">{stats.pendingKYC}</p>
            <p className="text-[10px] text-gray-500">KYC Pending</p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-lg font-bold text-green-600">{stats.verified}</p>
            <p className="text-[10px] text-gray-500">Verified</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-white"
          />
        </div>

        {/* Investors List */}
        {filteredInvestors.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">👥</div>
            <p className="text-gray-500">No investors found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredInvestors.map(investor => (
              <div key={investor.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {investor.first_name} {investor.last_name}
                    </h3>
                    <p className="text-xs text-gray-500">{investor.email}</p>
                  </div>
                  <select
                    value={investor.kyc_status || 'not_submitted'}
                    onChange={(e) => updateKYCStatus(investor.id, e.target.value)}
                    className={`text-xs px-2 py-1 rounded-full ${
                      investor.kyc_status === 'approved' ? 'bg-green-100 text-green-700' :
                      investor.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <option value="not_submitted">Not Submitted</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mt-2 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-gray-500">Wallet:</span>
                    <span className="ml-1 font-semibold">{formatCurrency(investor.wallet_balance)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Green Points:</span>
                    <span className="ml-1 font-semibold text-green-600">{investor.green_points || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Country:</span>
                    <span className="ml-1">{investor.country || 'Not set'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <span className="ml-1">{new Date(investor.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}