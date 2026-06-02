'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminKYC() {
  const [pendingUsers, setPendingUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState(null)
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
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('kyc_status', 'pending')
      .order('created_at', { ascending: true })
    
    setPendingUsers(data || [])
    setLoading(false)
  }

  async function approveKYC(userId) {
    setProcessing(true)
    const { error } = await supabase
      .from('users')
      .update({ kyc_status: 'approved' })
      .eq('id', userId)
    
    if (error) {
      alert('Error approving: ' + error.message)
    } else {
      alert('✅ KYC approved! User can now invest.')
      await fetchPendingKYC()
      setSelectedUser(null)
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
      alert('Error rejecting: ' + error.message)
    } else {
      alert('❌ KYC rejected. User will need to resubmit.')
      await fetchPendingKYC()
      setSelectedUser(null)
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
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-green-800">🔐 KYC Verification</h1>
          <p className="text-xs text-gray-500">Review and verify user identities</p>
        </div>

        {/* Stats */}
        <div className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
          <p className="text-sm font-semibold text-yellow-800">{pendingUsers.length} Pending Requests</p>
          <p className="text-xs text-yellow-700">Review these identities to allow users to invest</p>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-500">No pending KYC requests</p>
            <p className="text-xs text-gray-400 mt-1">All users are verified</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingUsers.map(user => (
              <div key={user.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-gray-800">{user.first_name} {user.last_name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-1">{user.country} • {user.city}</p>
                    </div>
                    <div className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Pending</div>
                  </div>

                  <div className="space-y-2 text-sm mb-4">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-gray-500">ID Type:</span> {user.id_type?.replace('_', ' ')}</p>
                      <p><span className="text-gray-500">ID Number:</span> {user.id_number}</p>
                      <p><span className="text-gray-500">DOB:</span> {user.date_of_birth}</p>
                      <p><span className="text-gray-500">Phone:</span> {user.phone || '-'}</p>
                    </div>
                    <p><span className="text-gray-500">Address:</span> {user.address}</p>
                  </div>

                  {/* ID Images */}
                  <div className="space-y-2 mb-4">
                    {user.id_front_url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Front ID:</p>
                        <button 
                          onClick={async () => {
                            const url = await getImageUrl(user.id_front_url)
                            window.open(url, '_blank')
                          }}
                          className="text-blue-600 text-xs underline"
                        >
                          View Front ID
                        </button>
                      </div>
                    )}
                    {user.id_back_url && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Back ID:</p>
                        <button 
                          onClick={async () => {
                            const url = await getImageUrl(user.id_back_url)
                            window.open(url, '_blank')
                          }}
                          className="text-blue-600 text-xs underline"
                        >
                          View Back ID
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => approveKYC(user.id)}
                      disabled={processing}
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-semibold"
                    >
                      ✅ Approve
                    </button>
                    <button
                      onClick={() => rejectKYC(user.id)}
                      disabled={processing}
                      className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold"
                    >
                      ❌ Reject
                    </button>
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