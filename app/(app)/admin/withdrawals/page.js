'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([])
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
    await fetchWithdrawals()
  }

  async function fetchWithdrawals() {
    const { data } = await supabase
      .from('withdrawals')
      .select('*, users(email, first_name, last_name, phone)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
    
    setWithdrawals(data || [])
    setLoading(false)
  }

  async function processWithdrawal(id) {
    const { error } = await supabase
      .from('withdrawals')
      .update({ status: 'completed' })
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Withdrawal marked as processed')
      await fetchWithdrawals()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-green-800 mb-2">💸 Withdrawals</h1>
        <p className="text-xs text-gray-500 mb-4">Process user withdrawal requests</p>

        {withdrawals.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-gray-500">No pending withdrawals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map(w => (
              <div key={w.id} className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold">{w.users?.first_name} {w.users?.last_name}</h3>
                    <p className="text-xs text-gray-500">{w.users?.email}</p>
                  </div>
                  <p className="text-xl font-bold text-red-600">${w.amount}</p>
                </div>
                <p className="text-xs text-gray-500 mb-2">Method: {w.method}</p>
                <p className="text-xs text-gray-500 mb-3">Details: {w.account_details?.details}</p>
                <button
                  onClick={() => processWithdrawal(w.id)}
                  className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-semibold"
                >
                  ✅ Mark as Processed
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}