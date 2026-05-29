'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function WalletPage() {
  const [user, setUser] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [loading, setLoading] = useState(true)
  const [addAmount, setAddAmount] = useState(100)
  const [showAddFunds, setShowAddFunds] = useState(false)
  const [transactions, setTransactions] = useState([])
  const router = useRouter()

  useEffect(() => {
    loadWalletData()
  }, [])

  async function loadWalletData() {
    setLoading(true)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }
    
    setUser(user)
    
    // Get or create user profile with wallet balance
    let { data: profile, error } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()
    
    // If no profile exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newProfile, error: insertError } = await supabase
        .from('users')
        .insert([{
          id: user.id,
          email: user.email,
          wallet_balance: 0,
          kyc_status: 'not_submitted',
          green_points: 0
        }])
        .select()
        .single()
      
      if (!insertError && newProfile) {
        profile = newProfile
      }
    }
    
    setWalletBalance(profile?.wallet_balance || 0)
    
    // Fetch transactions
    const { data: txData } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setTransactions(txData || [])
    setLoading(false)
  }

  async function addFunds() {
    if (addAmount < 10) {
      alert('Minimum deposit is $10')
      return
    }

    setLoading(true)
    
    const newBalance = walletBalance + addAmount
    
    // Update wallet balance in database
    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    if (updateError) {
      alert('Failed to add funds: ' + updateError.message)
      console.error('Update error:', updateError)
    } else {
      // Create transaction record
      const { error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          type: 'deposit',
          amount: addAmount,
          reference: `DEP_${Date.now()}`,
          status: 'completed'
        }])
      
      if (txError) {
        console.error('Transaction error:', txError)
      }
      
      setWalletBalance(newBalance)
      alert(`$${addAmount} added to your wallet!`)
      setShowAddFunds(false)
      
      // Refresh transactions
      const { data: txData } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      setTransactions(txData || [])
    }
    
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl mb-2">👛</div>
          <p className="text-gray-500">Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800">👛 My Wallet</h1>
          <p className="text-sm text-gray-500">Manage your funds</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-2xl p-6 mb-4 shadow-lg">
          <p className="text-sm opacity-90">Available Balance</p>
          <p className="text-4xl font-bold mt-1">${walletBalance.toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-2">Invest in green projects and watch your money grow</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => setShowAddFunds(true)}
            className="bg-green-600 text-white p-3 rounded-xl font-semibold"
          >
            ➕ Add Funds
          </button>
          <button 
            onClick={() => alert('Withdrawal coming soon. Contact support for now.')}
            className="border-2 border-green-600 text-green-600 p-3 rounded-xl font-semibold"
          >
            💸 Withdraw
          </button>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No transactions yet</p>
          ) : (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-sm capitalize">{tx.type}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className={`font-semibold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Funds Modal */}
        {showAddFunds && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Add Funds</h2>
              <p className="text-sm text-gray-500 mb-4">Enter amount to deposit</p>
              
              <input
                type="number"
                value={addAmount}
                onChange={e => setAddAmount(Number(e.target.value))}
                placeholder="Amount"
                className="w-full p-3 border border-gray-300 rounded-xl mb-4 text-lg"
              />
              
              <p className="text-xs text-gray-400 mb-4">Minimum: $10</p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowAddFunds(false)}
                  className="flex-1 bg-gray-200 p-3 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={addFunds}
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white p-3 rounded-lg font-semibold"
                >
                  {loading ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}