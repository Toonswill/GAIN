'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function SPVDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [spv, setSpv] = useState(null)
  const [user, setUser] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [userProfile, setUserProfile] = useState(null)
  const [units, setUnits] = useState(1)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    setUserProfile(profile)
    setWalletBalance(profile?.wallet_balance || 0)

    const { data: spvData } = await supabase
      .from('spvs')
      .select('*')
      .eq('id', id)
      .single()
    setSpv(spvData)

    setLoading(false)
  }

  const totalCost = (units * spv?.unit_price) || 0
  const canAfford = totalCost <= walletBalance

  async function buyTokens() {
    if (!canAfford) {
      alert(`Insufficient balance. Need KES ${totalCost.toLocaleString()}`)
      return
    }

    if (userProfile?.kyc_status !== 'approved') {
      alert('Please complete KYC verification before investing')
      router.push('/kyc')
      return
    }

    setBuying(true)

    const newBalance = walletBalance - totalCost
    const { error: walletError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    if (walletError) {
      alert('Wallet update failed: ' + walletError.message)
      setBuying(false)
      return
    }

    const { error: tokenError } = await supabase
      .from('tokens')
      .insert({
        spv_id: spv.id,
        user_id: user.id,
        units: units,
        amount_paid: totalCost
      })

    if (tokenError) {
      await supabase.from('users').update({ wallet_balance: walletBalance }).eq('id', user.id)
      alert('Purchase failed: ' + tokenError.message)
    } else {
      await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'investment',
        amount: -totalCost,
        reference: `${spv.token_symbol}_${units}`,
        status: 'completed'
      })
      alert(`✅ Purchased ${units} tokens of ${spv.unique_name}!`)
      router.push('/portfolio')
    }
    setBuying(false)
  }

  const getRiskColor = (level) => {
    switch(level) {
      case 'low': return 'bg-green-100 text-green-700'
      case 'high': return 'bg-red-100 text-red-700'
      default: return 'bg-yellow-100 text-yellow-700'
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-600 text-sm mb-4">← Back</button>

        {/* SPV Header */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-4 mb-4">
          <h1 className="text-xl font-bold">{spv?.unique_name}</h1>
          <p className="text-green-100 text-sm">Token: {spv?.token_symbol}</p>
          <div className="flex gap-2 mt-2">
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{spv?.project_sector}</span>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{spv?.project_location}</span>
          </div>
        </div>

        {/* Project Description */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">📋 About the Project</h2>
          <p className="text-sm text-gray-600 leading-relaxed">{spv?.project_description}</p>
          {spv?.project_founder && (
            <p className="text-xs text-gray-500 mt-2">Founder: {spv.project_founder}</p>
          )}
        </div>

        {/* Growth Factors */}
        {spv?.growth_factors && (
          <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
            <h2 className="font-semibold text-gray-800 mb-2">📈 Growth Factors</h2>
            <p className="text-sm text-gray-600">{spv.growth_factors}</p>
          </div>
        )}

        {/* Key Metrics */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-gray-800 mb-2">📊 Key Metrics</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500">Target Return</p>
              <p className="font-bold text-green-600">{spv?.target_return || 'TBD'}% p.a.</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-bold">{spv?.duration_months || 'TBD'} months</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Unit Price</p>
              <p className="font-bold">KES {spv?.unit_price?.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Risk Level</p>
              <p className={`text-xs font-semibold inline-block px-2 py-0.5 rounded-full ${getRiskColor(spv?.risk_level)}`}>
                {spv?.risk_level || 'Medium'}
              </p>
            </div>
            {spv?.expected_exit && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Expected Exit</p>
                <p className="text-sm">{spv.expected_exit}</p>
              </div>
            )}
          </div>
        </div>

        {/* Investment Section */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <h2 className="font-semibold text-gray-800 mb-2">💰 Invest</h2>

          {/* KYC Warning */}
          {userProfile?.kyc_status !== 'approved' && (
            <div className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
              <p className="text-xs text-yellow-800">⚠️ KYC required to invest. Please complete verification first.</p>
              <button onClick={() => router.push('/kyc')} className="text-xs text-yellow-700 underline mt-1">Go to KYC</button>
            </div>
          )}

          <div className="bg-green-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Your Balance:</span>
              <span className="font-bold">KES {walletBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Number of Units</label>
            <input
              type="number"
              value={units}
              onChange={(e) => setUnits(Math.max(1, parseInt(e.target.value) || 0))}
              min="1"
              max={spv?.total_units}
              className="w-full p-3 border rounded-xl text-lg"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Min: 1 unit</span>
              <span>Max: {spv?.total_units} units</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Cost:</span>
              <span className="font-bold">KES {totalCost.toLocaleString()}</span>
            </div>
            {!canAfford && (
              <p className="text-xs text-red-500 mt-1">Insufficient balance. Add funds to wallet.</p>
            )}
          </div>

          <button
            onClick={buyTokens}
            disabled={buying || !canAfford || userProfile?.kyc_status !== 'approved'}
            className="w-full bg-green-600 text-white p-3 rounded-xl font-bold disabled:bg-gray-300"
          >
            {buying ? 'Processing...' : `Buy ${units} Tokens (KES ${totalCost.toLocaleString()})`}
          </button>
        </div>
      </div>
    </div>
  )
}