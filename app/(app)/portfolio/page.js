'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function PortfolioPage() {
  const [user, setUser] = useState(null)
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalInvested, setTotalInvested] = useState(0)
  const [totalReturns, setTotalReturns] = useState(0)
  const [activeProjects, setActiveProjects] = useState(0)

  useEffect(() => {
    loadPortfolio()
  }, [])

  async function loadPortfolio() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUser(user)

    // Fetch user's investments with project details
    const { data: investmentsData } = await supabase
      .from('investments')
      .select(`
        *,
        projects (
          id,
          name,
          category,
          location,
          annual_return,
          duration_months,
          impact_tons_co2
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    setInvestments(investmentsData || [])
    
    // Calculate totals
    const invested = investmentsData?.reduce((sum, inv) => sum + inv.amount, 0) || 0
    const returns = investmentsData?.reduce((sum, inv) => {
      const monthlyReturn = (inv.projects.annual_return / 100) / 12
      const monthsPassed = Math.min(
        Math.floor((new Date() - new Date(inv.invested_at)) / (1000 * 60 * 60 * 24 * 30)),
        inv.projects.duration_months
      )
      const earned = inv.amount * monthlyReturn * monthsPassed
      return sum + earned
    }, 0) || 0
    
    setTotalInvested(invested)
    setTotalReturns(returns)
    setActiveProjects(investmentsData?.length || 0)
    setLoading(false)
  }

  // Generate growth data for chart
  const generateGrowthData = () => {
    const data = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    let value = totalInvested
    
    for (let i = 0; i < months.length; i++) {
      value = value + (totalReturns / months.length)
      data.push({
        month: months[i],
        value: Math.round(value)
      })
    }
    return data
  }

  const calculateExpectedReturn = (investment) => {
    const totalReturn = investment.amount * (1 + (investment.projects.annual_return / 100) * (investment.projects.duration_months / 12))
    return totalReturn.toFixed(2)
  }

  const calculateProgress = (investment) => {
    const monthsPassed = Math.min(
      Math.floor((new Date() - new Date(investment.invested_at)) / (1000 * 60 * 60 * 24 * 30)),
      investment.projects.duration_months
    )
    return (monthsPassed / investment.projects.duration_months) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl mb-2">📈</div>
          <p className="text-gray-500">Loading portfolio...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800">📈 My Portfolio</h1>
          <p className="text-sm text-gray-500">Track your green investments</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xs text-gray-500">Invested</p>
            <p className="text-lg font-bold text-green-600">${totalInvested.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xs text-gray-500">Returns</p>
            <p className="text-lg font-bold text-blue-600">${Math.round(totalReturns).toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-xs text-gray-500">Active</p>
            <p className="text-lg font-bold text-gray-700">{activeProjects}</p>
          </div>
        </div>

        {/* Portfolio Value Card */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-5 mb-6 shadow-lg">
          <p className="text-sm opacity-90">Portfolio Value</p>
          <p className="text-3xl font-bold mt-1">${Math.round(totalInvested + totalReturns).toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-2">
            +${Math.round(totalReturns).toLocaleString()} earned
          </p>
        </div>

        {/* Growth Chart */}
        {investments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">Portfolio Growth</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={generateGrowthData()}>
                <XAxis dataKey="month" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} />
                <Tooltip />
                <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Active Investments */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-800">Active Investments</h3>
          
          {investments.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="text-4xl mb-2">🌱</div>
              <p className="text-gray-500">No investments yet</p>
              <p className="text-xs text-gray-400 mt-1">Browse projects to start investing</p>
            </div>
          ) : (
            investments.map((inv, idx) => (
              <div key={inv.id} className="bg-white rounded-2xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-gray-800">{inv.projects.name}</h4>
                    <p className="text-xs text-gray-500">{inv.projects.location}</p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                    {inv.projects.annual_return}% p.a.
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div>
                    <p className="text-xs text-gray-500">Invested</p>
                    <p className="font-semibold text-gray-800">${inv.amount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Expected</p>
                    <p className="font-semibold text-green-600">${calculateExpectedReturn(inv)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Duration</p>
                    <p className="font-semibold text-gray-800">{inv.projects.duration_months}m</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(calculateProgress(inv))}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all" 
                      style={{ width: `${calculateProgress(inv)}%` }}
                    />
                  </div>
                </div>

                {/* Impact */}
                <div className="flex items-center gap-2 text-xs text-green-600 mt-2">
                  <span>🌱</span>
                  <span>{(inv.amount / 1000 * inv.projects.impact_tons_co2).toFixed(1)} tons CO₂ saved</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Reinvest Suggestion */}
        {totalReturns > 0 && (
          <div className="mt-6 bg-green-50 rounded-2xl p-4 border border-green-100">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div className="flex-1">
                <p className="font-semibold text-green-800">Reinvest your returns</p>
                <p className="text-xs text-green-600">${Math.round(totalReturns).toLocaleString()} available to reinvest</p>
              </div>
              <button 
                onClick={() => alert('Coming soon: Auto-reinvest feature')}
                className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
              >
                Reinvest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}