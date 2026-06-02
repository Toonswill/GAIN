'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PortfolioPage() {
  const [tokens, setTokens] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalInvested, setTotalInvested] = useState(0)

  useEffect(() => {
    loadTokens()
  }, [])

  async function loadTokens() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('tokens')
      .select(`
        *,
        spvs (
          unique_name,
          token_symbol,
          status,
          target_return,
          duration_months
        )
      `)
      .eq('user_id', user.id)
      .order('invested_at', { ascending: false })
    
    setTokens(data || [])
    const invested = data?.reduce((sum, t) => sum + (t.amount_paid || 0), 0) || 0
    setTotalInvested(invested)
    setLoading(false)
  }

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0'
    if (value < 1000) return `$${Math.round(value)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`
    return `$${(value / 1000000).toFixed(1)}M`
  }

  if (loading) return <div className="p-8 text-center">Loading portfolio...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-green-800 mb-1">📊 My Portfolio</h1>
        <p className="text-xs text-gray-500 mb-4">Your SPV token holdings</p>

        {/* Summary */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-4 mb-6">
          <p className="text-xs opacity-90">Total Invested</p>
          <p className="text-2xl font-bold">{formatCurrency(totalInvested)}</p>
          <p className="text-[10px] opacity-80 mt-1">Across {tokens.length} SPVs</p>
        </div>

        {tokens.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">🏗</div>
            <p className="text-gray-500">No investments yet</p>
            <p className="text-xs text-gray-400 mt-1">Browse the Invest page to buy tokens</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tokens.map(token => (
              <div key={token.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{token.spvs?.unique_name}</h3>
                    <p className="text-xs text-gray-500">Token: {token.spvs?.token_symbol}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    token.spvs?.status === 'active' ? 'bg-green-100 text-green-700' :
                    token.spvs?.status === 'funded' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {token.spvs?.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Units Owned</p>
                    <p className="font-semibold">{token.units}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Amount Paid</p>
                    <p className="font-semibold text-green-600">{formatCurrency(token.amount_paid)}</p>
                  </div>
                  {token.spvs?.target_return && (
                    <div>
                      <p className="text-xs text-gray-500">Target Return</p>
                      <p className="font-semibold">{token.spvs.target_return}% p.a.</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-gray-500">Invested</p>
                    <p className="font-semibold text-xs">{new Date(token.invested_at).toLocaleDateString()}</p>
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