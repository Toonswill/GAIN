'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ProjectDetail() {
  const { id } = useParams()
  const router = useRouter()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [investAmount, setInvestAmount] = useState(100)
  const [investing, setInvesting] = useState(false)
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [walletBalance, setWalletBalance] = useState(0)

  useEffect(() => {
    getUser()
    fetchProject()
  }, [id])
  // Refresh wallet balance when page gets focus (after returning from wallet)
useEffect(() => {
  const refreshBalance = async () => {
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('wallet_balance')
        .eq('id', user.id)
        .single()
      setWalletBalance(profile?.wallet_balance || 0)
    }
  }
  
  window.addEventListener('focus', refreshBalance)
  return () => window.removeEventListener('focus', refreshBalance)
}, [user])


  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
      setWalletBalance(profile?.wallet_balance || 0)
    }
  }

  async function fetchProject() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()
    
    setProject(data)
    setLoading(false)
  }

  const calculateReturns = () => {
    if (!project) return 0
    const monthlyReturn = (project.annual_return / 100) / 12
    const totalReturn = investAmount * (1 + monthlyReturn * project.duration_months)
    return totalReturn.toFixed(2)
  }

  const handleInvest = async () => {
    if (!user) {
      alert('Please login to invest')
      router.push('/')
      return
    }

    if (userProfile?.kyc_status !== 'approved' && userProfile?.kyc_status !== 'not_submitted') {
      alert('Please complete KYC verification before investing')
      router.push('/profile')
      return
    }

    if (investAmount < project.min_investment) {
      alert(`Minimum investment is $${project.min_investment}`)
      return
    }

    if (investAmount > walletBalance) {
      alert(`Insufficient balance. You have $${walletBalance.toLocaleString()} in your wallet. Please add funds.`)
      router.push('/wallet')
      return
    }

    setInvesting(true)

    // Deduct from wallet balance
    const newBalance = walletBalance - investAmount
    const { error: walletError } = await supabase
      .from('users')
      .update({ wallet_balance: newBalance })
      .eq('id', user.id)

    if (walletError) {
      alert('Wallet update failed: ' + walletError.message)
      setInvesting(false)
      return
    }

    // Create investment record
    const { data: investment, error: investError } = await supabase
      .from('investments')
      .insert([{
        user_id: user.id,
        project_id: project.id,
        amount: investAmount,
        expected_return: parseFloat(calculateReturns()),
        status: 'active'
      }])
      .select()
      .single()

    if (investError) {
      // Refund wallet if investment fails
      await supabase
        .from('users')
        .update({ wallet_balance: walletBalance })
        .eq('id', user.id)
      
      alert('Investment failed: ' + investError.message)
      setInvesting(false)
      return
    }

    // Update project funded amount
    const newFundedAmount = (project.funded_amount || 0) + investAmount
    await supabase
      .from('projects')
      .update({ funded_amount: newFundedAmount })
      .eq('id', project.id)

    // Create transaction record
    await supabase
      .from('transactions')
      .insert([{
        user_id: user.id,
        type: 'investment',
        amount: -investAmount,
        reference: investment.id,
        status: 'completed'
      }])

    // Update local balance
    setWalletBalance(newBalance)

    alert(`✅ Success! You invested $${investAmount} in ${project.name}`)
    router.push('/portfolio')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="text-2xl mb-2">🌍</div>
          <p className="text-gray-500">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <p className="text-gray-500">Project not found</p>
          <button onClick={() => router.back()} className="mt-4 text-green-600">Go Back</button>
        </div>
      </div>
    )
  }

  const percentFunded = ((project.funded_amount || 0) / project.target_amount) * 100
  const remainingAmount = project.target_amount - (project.funded_amount || 0)
  const maxInvest = Math.min(remainingAmount, walletBalance)

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-700 to-green-500 text-white px-4 py-8">
        <button onClick={() => router.back()} className="mb-4 text-white/80 text-sm">
          ← Back to Projects
        </button>
        <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
        <p className="text-green-100 text-sm">{project.location} • {project.owner}</p>
      </div>

      <div className="px-4 -mt-6">
        {/* Wallet Balance Alert */}
        <div className="bg-blue-50 rounded-2xl p-4 mb-4 border border-blue-100">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-xs text-blue-600">Your Wallet Balance</p>
              <p className="text-2xl font-bold text-blue-700">${walletBalance.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => router.push('/wallet')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              Add Funds →
            </button>
          </div>
          {walletBalance < project.min_investment && (
            <p className="text-xs text-red-500 mt-2">
              ⚠️ Insufficient balance. Minimum investment is ${project.min_investment}
            </p>
          )}
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <p className="text-gray-600 text-sm leading-relaxed mb-4">{project.description}</p>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{project.annual_return}%</div>
              <div className="text-xs text-gray-500">Annual Return</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{project.duration_months}m</div>
              <div className="text-xs text-gray-500">Duration</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">${project.min_investment}</div>
              <div className="text-xs text-gray-500">Min Investment</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600">{project.impact_tons_co2?.toLocaleString()}</div>
              <div className="text-xs text-gray-500">Tons CO₂ Saved</div>
            </div>
          </div>

          {/* Funding Progress */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Funding Progress</span>
              <span className="font-semibold text-green-600">{percentFunded.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div className="bg-green-600 h-3 rounded-full" style={{ width: `${Math.min(percentFunded, 100)}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>${(project.funded_amount || 0).toLocaleString()} raised</span>
              <span>${remainingAmount.toLocaleString()} remaining</span>
            </div>
          </div>
        </div>

        {/* Investment Calculator */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4">
          <h3 className="font-bold text-gray-800 mb-3">📊 Calculate Your Investment</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Investment Amount ($)
            </label>
            <input
              type="number"
              value={investAmount}
              onChange={(e) => setInvestAmount(Number(e.target.value))}
              min={project.min_investment}
              max={maxInvest}
              className="w-full p-3 border border-gray-300 rounded-xl text-lg font-semibold"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Min: ${project.min_investment}</span>
              <span>Max: ${maxInvest.toLocaleString()}</span>
              <span>Balance: ${walletBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-xl p-4 mb-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Expected Return after {project.duration_months} months:</span>
              <span className="text-2xl font-bold text-green-600">${calculateReturns()}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              *Returns paid monthly to your Gain wallet
            </p>
          </div>

          <button
            onClick={handleInvest}
            disabled={investing || !user || investAmount < project.min_investment || investAmount > walletBalance}
            className="w-full bg-green-600 text-white p-4 rounded-xl font-bold text-lg disabled:bg-gray-300 disabled:cursor-not-allowed transition-all"
          >
            {investing ? 'Processing...' : `Invest $${investAmount}`}
          </button>

          {investAmount > walletBalance && (
            <p className="text-xs text-center text-red-500 mt-3">
              Insufficient balance. Please add funds to your wallet.
            </p>
          )}

          {!user && (
            <p className="text-xs text-center text-gray-500 mt-3">
              Please login to invest in this project
            </p>
          )}
        </div>

        {/* Impact Message */}
        <div className="bg-white rounded-2xl shadow-lg p-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🌱</span>
            <div>
              <p className="font-semibold text-gray-800">Your impact matters</p>
              <p className="text-xs text-gray-500">
                By investing ${investAmount}, you'll help save ~{(investAmount / project.target_amount * project.impact_tons_co2).toFixed(1)} tons of CO₂
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}