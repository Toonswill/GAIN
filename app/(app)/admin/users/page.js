'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function InvestorDirectory() {
  const [investors, setInvestors] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
    await fetchInvestors()
  }

  async function fetchInvestors() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    setInvestors(data || [])
    setLoading(false)
  }

  const filteredInvestors = investors.filter(investor => 
    investor.email?.toLowerCase().includes(search.toLowerCase()) ||
    investor.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    investor.last_name?.toLowerCase().includes(search.toLowerCase())
  )

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0'
    if (value < 1000) return `$${Math.round(value)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`
    return `$${(value / 1000000).toFixed(1)}M`
  }

  if (loading) return <div className="p-8 text-center">Loading investor directory...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-green-800">👥 Investor Directory</h1>
          <p className="text-xs text-gray-500">View all registered investors on Gain</p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-lg font-bold text-green-600">{investors.length}</p>
            <p className="text-[10px] text-gray-500">Total</p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-lg font-bold text-yellow-600">{investors.filter(i => i.kyc_status === 'pending').length}</p>
            <p className="text-[10px] text-gray-500">KYC Pending</p>
          </div>
          <div className="bg-white rounded-xl p-2 text-center shadow-sm">
            <p className="text-lg font-bold text-green-600">{investors.filter(i => i.kyc_status === 'approved').length}</p>
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
                  <div className={`text-xs px-2 py-1 rounded-full ${
                    investor.kyc_status === 'approved' ? 'bg-green-100 text-green-700' :
                    investor.kyc_status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {investor.kyc_status || 'pending'}
                  </div>
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
                    <span className="ml-1">{investor.country || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <span className="ml-1">{new Date(investor.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                {investor.kyc_status === 'pending' && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={async () => {
                        await supabase.from('users').update({ kyc_status: 'approved' }).eq('id', investor.id)
                        await fetchInvestors()
                        alert(`${investor.first_name} ${investor.last_name} verified!`)
                      }}
                      className="flex-1 bg-green-600 text-white py-1 rounded-lg text-xs"
                    >
                      Approve KYC
                    </button>
                    <button
                      onClick={async () => {
                        await supabase.from('users').update({ kyc_status: 'rejected' }).eq('id', investor.id)
                        await fetchInvestors()
                        alert(`${investor.first_name} ${investor.last_name} rejected.`)
                      }}
                      className="flex-1 bg-red-600 text-white py-1 rounded-lg text-xs"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}