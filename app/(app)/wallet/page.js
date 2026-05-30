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
  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('mpesa')
  const [withdrawDetails, setWithdrawDetails] = useState('')
  const [transactions, setTransactions] = useState([])

  useEffect(() => {
    loadWalletData()
  }, [])

  async function loadWalletData() {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/')
      return
    }
    setUser(user)
    
    // Get current wallet balance
    const { data: profile, error } = await supabase
      .from('users')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()
    
    if (error) {
      console.error('Error loading wallet:', error)
    }
    
    const currentBalance = profile?.wallet_balance || 0
    setWalletBalance(currentBalance)
    
    // Get transactions
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
    
    // Update wallet balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    if (updateError) {
      alert('Failed to add funds: ' + updateError.message)
      console.error('Update error:', updateError)
    } else {
      // Create POSITIVE transaction record
      const { error: txError } = await supabase.from('transactions').insert([{
        user_id: user.id,
        type: 'deposit',
        amount: addAmount,
        reference: `DEP_${Date.now()}`,
        status: 'completed'
      }])
      
      if (txError) {
        console.error('Transaction record error:', txError)
      }
      
      setWalletBalance(newBalance)
      alert(`✅ $${addAmount} added to your wallet!`)
      setShowAddFunds(false)
      await loadWalletData() // Refresh all data
    }
    setLoading(false)
  }

  async function processWithdrawal() {
  const amount = parseFloat(withdrawAmount)
  
  if (isNaN(amount) || amount < 10) {
    alert('Minimum withdrawal is $10')
    return
  }
  
  if (amount > walletBalance) {
    alert(`❌ Insufficient balance. You have ${formatCurrency(walletBalance)}`)
    return
  }
  
  if (!withdrawDetails) {
    alert(`Please enter your ${withdrawMethod === 'mpesa' ? 'M-Pesa phone number' : 'bank account details'}`)
    return
  }

  setLoading(true)
  
  const newBalance = walletBalance - amount
  
  console.log('=== Starting Withdrawal Process ===')
  console.log('User ID:', user?.id)
  console.log('Current balance:', walletBalance)
  console.log('Withdraw amount:', amount)
  console.log('New balance:', newBalance)

  try {
    // Step 1: Update wallet balance
    const { data: updateData, error: updateError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)
      .select()

    if (updateError) {
      console.error('Step 1 Error - Balance update:', updateError)
      alert('❌ Failed to update balance: ' + updateError.message)
      setLoading(false)
      return
    }
    console.log('Step 1 Success - Balance updated:', updateData)

    // Step 2: Create transaction record (NEGATIVE amount)
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: 'withdrawal',
        amount: -amount,
        reference: `WDR_${Date.now()}_${user.id}`,
        status: 'completed'
      })
      .select()

    if (txError) {
      console.error('Step 2 Error - Transaction record:', txError)
      alert('⚠️ Withdrawal processed but transaction not recorded. Contact support.')
    } else {
      console.log('Step 2 Success - Transaction recorded:', txData)
    }

    // Step 3: Create withdrawal record
    const { data: wdData, error: wdError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount: amount,
        method: withdrawMethod,
        account_details: { 
          details: withdrawDetails,
          method: withdrawMethod,
          timestamp: new Date().toISOString()
        },
        status: 'completed'
      })
      .select()

    if (wdError) {
      console.error('Step 3 Error - Withdrawal record:', wdError)
    } else {
      console.log('Step 3 Success - Withdrawal record created:', wdData)
    }
    
    // Update local state
    setWalletBalance(newBalance)
    alert(`✅ $${amount} withdrawn successfully!`)
    
    // Close modal and refresh
    setShowWithdraw(false)
    setWithdrawAmount('')
    setWithdrawDetails('')
    await loadWalletData()
    
  } catch (error) {
    console.error('Unexpected error:', error)
    alert('An unexpected error occurred. Please try again.')
  }
  
  setLoading(false)
}

  const formatCurrency = (value) => {
    if (!value || value === 0) return '$0'
    if (value < 1000) return `$${Math.round(value)}`
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`
    return `$${(value / 1000000).toFixed(1)}M`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl mb-2"></div>
          <p className="text-gray-500">Loading wallet...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold text-green-800">My Wallet</h1>
          <p className="text-xs text-gray-500">Manage your funds</p>
        </div>

        {/* Balance Card */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white rounded-xl p-5 mb-5 shadow-lg">
          <p className="text-xs opacity-90">Available Balance</p>
          <p className="text-3xl font-bold mt-1">{formatCurrency(walletBalance)}</p>
          <p className="text-[10px] opacity-80 mt-2">Invest in green projects and watch your money grow</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button 
            onClick={() => setShowAddFunds(true)}
            className="bg-green-600 text-white p-3 rounded-xl font-semibold text-sm"
          >
            ➕ Add Funds
          </button>
          <button 
            onClick={() => setShowWithdraw(true)}
            disabled={walletBalance < 10}
            className={`p-3 rounded-xl font-semibold text-sm ${
              walletBalance >= 10 
                ? 'border-2 border-green-600 text-green-600' 
                : 'border-2 border-gray-300 text-gray-400 cursor-not-allowed'
            }`}
          >
            💸 Withdraw
          </button>
        </div>

        {/* Withdraw Info */}
        {walletBalance < 10 && (
          <div className="bg-yellow-50 rounded-xl p-3 mb-4 border border-yellow-200">
            <p className="text-xs text-yellow-800">Minimum withdrawal is $10. Add funds to withdraw.</p>
          </div>
        )}

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-semibold text-sm text-gray-800 mb-3">Recent Transactions</h3>
          
          {transactions.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No transactions yet</p>
          ) : (
            <div className="space-y-2">
              {transactions.map(tx => (
                <div key={tx.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-sm capitalize">{tx.type}</p>
                    <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold text-sm ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.amount > 0 ? '+' : ''}{formatCurrency(Math.abs(tx.amount))}
                    </p>
                    {tx.status === 'pending' && (
                      <span className="text-[10px] text-yellow-600">Pending</span>
                    )}
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
                <button onClick={() => setShowAddFunds(false)} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
                <button onClick={addFunds} disabled={loading} className="flex-1 bg-green-600 text-white p-3 rounded-lg font-semibold">
                  {loading ? 'Processing...' : 'Add Funds'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawal Modal */}
        {showWithdraw && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">Withdraw Funds</h2>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Method</label>
                <select 
                  value={withdrawMethod} 
                  onChange={e => setWithdrawMethod(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                >
                  <option value="mpesa">M-Pesa (Kenya, Tanzania)</option>
                  <option value="bank">Bank Transfer</option>
                  <option value="mobile">Mobile Money (Other)</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {withdrawMethod === 'mpesa' ? 'M-Pesa Phone Number' : 
                   withdrawMethod === 'bank' ? 'Bank Account Number' : 
                   'Mobile Money Number'}
                </label>
                <input
                  type="text"
                  value={withdrawDetails}
                  onChange={e => setWithdrawDetails(e.target.value)}
                  placeholder={withdrawMethod === 'mpesa' ? '0712345678' : 'Enter account details'}
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="Min $10"
                  className="w-full p-3 border border-gray-300 rounded-xl"
                />
                <p className="text-xs text-gray-400 mt-1">Available: {formatCurrency(walletBalance)}</p>
              </div>
              
              <div className="flex gap-3">
                <button onClick={() => setShowWithdraw(false)} className="flex-1 bg-gray-200 p-3 rounded-lg">Cancel</button>
                <button onClick={processWithdrawal} disabled={loading} className="flex-1 bg-green-600 text-white p-3 rounded-lg font-semibold">
                  {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}