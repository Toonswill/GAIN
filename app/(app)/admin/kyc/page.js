'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminKYC() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
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
    
    await fetchPendingKYC()
  }

  async function fetchPendingKYC() {
    setLoading(true)
    
    // Direct query for pending KYC
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('kyc_status', 'pending')
    
    if (error) {
      console.error('Error:', error)
      alert('Error fetching KYC: ' + error.message)
    } else {
      console.log('Found pending:', data?.length)
      setPendingUsers(data || [])
    }
    
    setLoading(false)
  }

  async function approveKYC(userId) {
    setProcessing(true)
    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'approved' })
      .eq('id', userId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ KYC approved!')
      await fetchPendingKYC()
    }
    setProcessing(false)
  }

  async function rejectKYC(userId) {
    setProcessing(true)
    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'rejected' })
      .eq('id', userId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('❌ KYC rejected')
      await fetchPendingKYC()
    }
    setProcessing(false)
  }

  async function getImageUrl(filePath) {
    if (!filePath) return null
    const { data } = supabase.storage.from('kyc_docs').getPublicUrl(filePath)
    return data.publicUrl
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-24">
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl mb-2">🔐</div>
          <p className="text-gray-500">Loading KYC requests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-green-800 mb-2">🔐 KYC Verification</h1>
        <p className="text-xs text-gray-500 mb-4">Review and verify investor identities</p>

        <div className={`rounded-xl p-3 mb-4 border ${pendingUsers.length > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
          <p className="text-sm font-semibold">{pendingUsers.length} Pending Requests</p>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-500">No pending KYC requests</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-gray-800">{user.first_name} {user.last_name}</h3>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Pending</div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <p><span className="text-gray-500">ID Type:</span> {user.id_type || 'N/A'}</p>
                  <p><span className="text-gray-500">ID Number:</span> {user.id_number || 'N/A'}</p>
                  <p><span className="text-gray-500">Country:</span> {user.country || 'N/A'}</p>
                </div>

                {user.id_front_url && (
                  <div className="mb-4">
                    <button 
                      onClick={async () => {
                        const url = await getImageUrl(user.id_front_url)
                        window.open(url, '_blank')
                      }}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs"
                    >
                      View ID Document
                    </button>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => approveKYC(user.id)}
                    disabled={processing}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectKYC(user.id)}
                    disabled={processing}
                    className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}