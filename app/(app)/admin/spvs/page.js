'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminSPVs() {
  const [spvs, setSpvs] = useState([])
  const [loading, setLoading] = useState(true)
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
    await fetchSPVs()
  }

  async function fetchSPVs() {
    const { data } = await supabase
      .from('spvs')
      .select('*, gain_tank_projects(name)')
      .order('created_at', { ascending: false })
    
    setSpvs(data || [])
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('spvs')
      .update({ status: newStatus })
      .eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`SPV ${newStatus === 'active' ? 'activated and visible to investors!' : `status updated to ${newStatus}`}`)
      await fetchSPVs()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading SPVs...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-green-800 mb-1">🏗 SPV Management</h1>
        <p className="text-xs text-gray-500 mb-4">Activate SPVs for investors to see</p>

        {spvs.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <p className="text-gray-500">No SPVs created yet</p>
            <p className="text-xs text-gray-400 mt-1">Create SPVs from approved projects</p>
          </div>
        ) : (
          <div className="space-y-3">
            {spvs.map(spv => (
              <div key={spv.id} className={`bg-white rounded-xl shadow-sm p-4 ${spv.status === 'active' ? 'border border-green-300' : ''}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-800">{spv.unique_name}</h3>
                    <p className="text-xs text-gray-500">Token: {spv.token_symbol}</p>
                    {spv.gain_tank_projects && (
                      <p className="text-xs text-gray-400">Project: {spv.gain_tank_projects.name}</p>
                    )}
                    <div className="grid grid-cols-3 gap-2 mt-2 text-xs">
                      <p><span className="text-gray-500">Units:</span> {spv.total_units?.toLocaleString()}</p>
                      <p><span className="text-gray-500">Price:</span> KES {spv.unit_price?.toLocaleString()}</p>
                      <p><span className="text-gray-500">Raise:</span> KES {spv.total_raise?.toLocaleString()}</p>
                    </div>
                  </div>
                  <div>
                    {spv.status === 'draft' ? (
                      <button
                        onClick={() => updateStatus(spv.id, 'active')}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                      >
                        Activate
                      </button>
                    ) : (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        spv.status === 'active' ? 'bg-green-100 text-green-700' :
                        spv.status === 'funded' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {spv.status}
                      </span>
                    )}
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