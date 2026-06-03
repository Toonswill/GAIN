'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function InvestPage() {
  const [spvs, setSpvs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchActiveSPVs()
  }, [])

  async function fetchActiveSPVs() {
    const { data } = await supabase
      .from('spvs')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    setSpvs(data || [])
    setLoading(false)
  }

  if (loading) return <div className="p-8 text-center">Loading investment opportunities...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-green-800 mb-1">📈 Investment Opportunities</h1>
        <p className="text-xs text-gray-500 mb-4">Greenlit by GAIN Tank • Verified by Gain</p>

        {spvs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">🏗</div>
            <p className="text-gray-500">No active SPVs at the moment</p>
            <p className="text-xs text-gray-400 mt-1">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {spvs.map(spv => (
              <div key={spv.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{spv.unique_name}</h3>
                    <p className="text-xs text-gray-500">Token: {spv.token_symbol}</p>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Open</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Unit Price</p>
                    <p className="font-semibold">KES {spv.unit_price?.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Available Units</p>
                    <p className="font-semibold">{spv.total_units?.toLocaleString()}</p>
                  </div>
                  {spv.target_return && (
                    <div>
                      <p className="text-xs text-gray-500">Target Return</p>
                      <p className="font-semibold text-green-600">{spv.target_return}% p.a.</p>
                    </div>
                  )}
                  {spv.duration_months && (
                    <div>
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-semibold">{spv.duration_months} months</p>
                    </div>
                  )}
                </div>

                <Link
                  href={`/invest/${spv.id}`}
                  className="block w-full bg-green-600 text-white text-center py-2 rounded-xl text-sm font-semibold"
                >
                  Buy Tokens →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}