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

    const { data: investmentsData } = await supabase
      .from('investments')
      .select(`
        *,
        projects (
          id, name, category, location,
          annual_return, duration_months, impact_tons_co2
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    setInvestments(investmentsData || [])
    
    const invested = investmentsData?.reduce((sum, inv) => sum + (Number(inv.amount) || 0), 0) || 0
    const returns = investmentsData?.reduce((sum, inv) => {
      const monthlyReturn = (Number(inv.projects.annual_return) || 0) / 100 / 12
      const monthsPassed = Math.min(
        Math.floor((new Date() - new Date(inv.invested_at)) / (1000 * 60 * 60 * 24 * 30)),
        Number(inv.projects.duration_months) || 0
      )
      const earned = (Number(inv.amount) || 0) * monthlyReturn * monthsPassed
      return sum + (isNaN(earned) ? 0 : earned)
    }, 0) || 0
    
    setTotalInvested(invested)
    setTotalReturns(returns)
    setActiveProjects(investmentsData?.length || 0)
    setLoading(false)
  }

  const generateGrowthData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    const startValue = totalInvested > 0 ? totalInvested : 100
    const step = totalReturns / 6
    return months.map((month, i) => ({
      month,
      value: Math.round(startValue + (step * i))
    }))
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
        <div className="mb-5">
          <h1 className="text-xl font-bold text-green-800">📈 My Portfolio</h1>
          <p className="text-xs text-gray-500">Track your green investments</p>
        </div>

        {/* Summary Cards - Mobile Optimized */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-gray-500">Invested</p>
            <p className="text-base font-bold text-green-600">{formatCurrency(totalInvested)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-gray-500">Returns</p>
            <p className="text-base font-bold text-blue-600">{formatCurrency(totalReturns)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 shadow-sm text-center">
            <p className="text-[10px] text-gray-500">Active</p>
            <p className="text-base font-bold text-gray-700">{activeProjects}</p>
          </div>
        </div>

        {/* Portfolio Value Card */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-xl p-4 mb-5 shadow-lg">
          <p className="text-xs opacity-90">Portfolio Value</p>
          <p className="text-2xl font-bold mt-1">{formatCurrency(totalInvested + totalReturns)}</p>
          <p className="text-[10px] opacity-80 mt-1">
            +{formatCurrency(totalReturns)} earned
          </p>
        </div>

        {/* Growth Chart - Only show if has investments */}
        {investments.length > 0 && totalInvested > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-3 mb-5">
            <h3 className="font-semibold text-sm text-gray-800 mb-2">Portfolio Growth</h3>
            <div className="h-36">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={generateGrowthData()}>
                  <XAxis dataKey="month" stroke="#888" fontSize={10} tick={{ fontSize: 10 }} />
                  <YAxis stroke="#888" fontSize={10} tick={{ fontSize: 10 }} tickFormatter={(v) => formatCurrency(v)} />
                  <Tooltip formatter={(v) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="value" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Active Investments */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-gray-800">Active Investments</h3>
          
          {investments.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center">
              <div className="text-3xl mb-2">🌱</div>
              <p className="text-gray-500 text-sm">No investments yet</p>
              <p className="text-xs text-gray-400 mt-1">Browse projects to start investing</p>
            </div>
          ) : (
            investments.map((inv) => {
              const progress = (() => {
                const monthsPassed = Math.min(
                  Math.floor((new Date() - new Date(inv.invested_at)) / (1000 * 60 * 60 * 24 * 30)),
                  Number(inv.projects.duration_months) || 1
                )
                return (monthsPassed / (Number(inv.projects.duration_months) || 1)) * 100
              })()
              
              const expectedReturn = (Number(inv.amount) || 0) * (1 + (Number(inv.projects.annual_return) || 0) / 100 * (Number(inv.projects.duration_months) || 0) / 12)
              
              return (
                <div key={inv.id} className="bg-white rounded-xl shadow-sm p-3 border border-gray-100">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-gray-800">{inv.projects.name}</h4>
                      <p className="text-[10px] text-gray-500">{inv.projects.location}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 bg-green-50 text-green-700 rounded-full">
                      {inv.projects.annual_return}% p.a.
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2 text-center">
                    <div>
                      <p className="text-[9px] text-gray-500">Invested</p>
                      <p className="font-semibold text-xs">{formatCurrency(inv.amount)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Expected</p>
                      <p className="font-semibold text-xs text-green-600">{formatCurrency(expectedReturn)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-gray-500">Duration</p>
                      <p className="font-semibold text-xs">{inv.projects.duration_months}m</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-2">
                    <div className="flex justify-between text-[9px] text-gray-500 mb-0.5">
                      <span>Progress</span>
                      <span>{Math.min(Math.round(progress), 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }} />
                    </div>
                  </div>

                  {/* Impact */}
                  <div className="flex items-center gap-1.5 text-[10px] text-green-600">
                    <span>🌱</span>
                    <span>{(Number(inv.amount) / 1000 * (inv.projects.impact_tons_co2 || 0)).toFixed(1)} tons CO₂ saved</span>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Reinvest Suggestion */}
        {totalReturns > 100 && (
          <div className="mt-5 bg-green-50 rounded-xl p-3 border border-green-100">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔄</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-green-800">Reinvest your returns</p>
                <p className="text-[10px] text-green-600">{formatCurrency(totalReturns)} available to reinvest</p>
              </div>
              <button className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold">
                Reinvest
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}