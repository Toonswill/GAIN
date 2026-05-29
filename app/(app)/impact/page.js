'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function ImpactPage() {
  const [user, setUser] = useState(null)
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalGreenPoints, setTotalGreenPoints] = useState(0)
  const [totalCo2Saved, setTotalCo2Saved] = useState(0)
  const [totalInvested, setTotalInvested] = useState(0)
  const [leaderboard, setLeaderboard] = useState([])

  // Green Points Calculation:
  // 1 point = $1 invested in green projects
  // Bonus points based on project category:
  // - Green Hydrogen: 1.5x points
  // - Biofuel: 1.3x points
  // - E-Mobility: 1.2x points
  // - Mini-Grids: 1.2x points
  // - Waste: 1.1x points
  // - Circular Economy: 1.1x points

  const getPointMultiplier = (category) => {
    const multipliers = {
      'green_hydrogen': 1.5,
      'biofuel': 1.3,
      'e-mobility': 1.2,
      'minigrid': 1.2,
      'waste': 1.1,
      'circular': 1.1
    }
    return multipliers[category] || 1.0
  }

  const calculateGreenPoints = (amount, category) => {
    const multiplier = getPointMultiplier(category)
    return Math.round(amount * multiplier)
  }

  const calculateCo2Saved = (amount, projectCo2Impact, projectTarget) => {
    if (!projectCo2Impact || !projectTarget) return 0
    return (amount / projectTarget) * projectCo2Impact
  }

  useEffect(() => {
    loadImpactData()
  }, [])

  async function loadImpactData() {
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
          impact_tons_co2,
          target_amount
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')

    setInvestments(investmentsData || [])

    // Calculate totals
    let points = 0
    let co2 = 0
    let invested = 0

    investmentsData?.forEach(inv => {
      invested += inv.amount
      points += calculateGreenPoints(inv.amount, inv.projects.category)
      co2 += calculateCo2Saved(inv.amount, inv.projects.impact_tons_co2, inv.projects.target_amount)
    })

    setTotalInvested(invested)
    setTotalGreenPoints(points)
    setTotalCo2Saved(co2)

    // Update user's green points in database
    if (user && points > 0) {
      await supabase
        .from('users')
        .update({ green_points: points })
        .eq('id', user.id)
    }

    // Fetch leaderboard (top 10 investors by green points)
    const { data: leaderboardData } = await supabase
      .from('users')
      .select('first_name, last_name, green_points, country')
      .order('green_points', { ascending: false })
      .limit(10)

    setLeaderboard(leaderboardData || [])
    setLoading(false)
  }

  const getBadge = (points) => {
    if (points >= 10000) return { name: '🌍 Climate Champion', color: 'bg-purple-600' }
    if (points >= 5000) return { name: '⭐ Green Hero', color: 'bg-blue-600' }
    if (points >= 1000) return { name: '🌱 Eco Investor', color: 'bg-green-600' }
    if (points >= 100) return { name: '🌿 Seed Investor', color: 'bg-green-400' }
    return { name: '🌱 Beginner', color: 'bg-gray-400' }
  }

  const nextBadge = (points) => {
    if (points < 100) return { points: 100, name: '🌿 Seed Investor' }
    if (points < 1000) return { points: 1000, name: '🌱 Eco Investor' }
    if (points < 5000) return { points: 5000, name: '⭐ Green Hero' }
    if (points < 10000) return { points: 10000, name: '🌍 Climate Champion' }
    return null
  }

  const badge = getBadge(totalGreenPoints)
  const next = nextBadge(totalGreenPoints)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl mb-2">🌱</div>
          <p className="text-gray-500">Calculating your impact...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800">🌱 Environmental Impact</h1>
          <p className="text-sm text-gray-500">Your green footprint matters</p>
        </div>

        {/* Hero Impact Card */}
        <div className="bg-gradient-to-r from-green-700 to-green-500 text-white rounded-2xl p-6 mb-6 shadow-lg">
          <p className="text-sm opacity-90">Your Total Impact</p>
          <p className="text-3xl font-bold mt-1">{totalCo2Saved.toFixed(1)} tons</p>
          <p className="text-xs opacity-80 mt-1">CO₂ emissions avoided</p>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-xs opacity-80">Equal to planting</p>
            <p className="text-xl font-bold">{Math.round(totalCo2Saved * 45)} trees 🌳</p>
          </div>
        </div>

        {/* Green Points Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="text-sm text-gray-500">Your Green Points</p>
              <p className="text-3xl font-bold text-green-600">{totalGreenPoints.toLocaleString()}</p>
            </div>
            <div className={`${badge.color} text-white px-3 py-1 rounded-full text-xs font-semibold`}>
              {badge.name}
            </div>
          </div>

          {/* Progress to next badge */}
          {next && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress to {next.name}</span>
                <span>{totalGreenPoints} / {next.points}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all" 
                  style={{ width: `${(totalGreenPoints / next.points) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Points Explanation */}
          <div className="mt-4 p-3 bg-green-50 rounded-xl">
            <p className="text-xs text-green-800 font-semibold mb-1">💚 How Green Points work:</p>
            <p className="text-xs text-green-700">Base: 1 point = $1 invested</p>
            <p className="text-xs text-green-700 mt-1">Bonus multipliers:</p>
            <div className="grid grid-cols-2 gap-1 mt-1 text-xs">
              <span className="text-green-600">• Green Hydrogen: 1.5x</span>
              <span className="text-green-600">• Biofuel: 1.3x</span>
              <span className="text-green-600">• E-Mobility: 1.2x</span>
              <span className="text-green-600">• Mini-Grids: 1.2x</span>
              <span className="text-green-600">• Waste: 1.1x</span>
              <span className="text-green-600">• Circular Economy: 1.1x</span>
            </div>
          </div>
        </div>

        {/* Investment Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-3">Impact by Investment</h3>
          
          {investments.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500 text-sm">No investments yet</p>
              <p className="text-xs text-gray-400 mt-1">Start investing to see your impact</p>
            </div>
          ) : (
            <div className="space-y-4">
              {investments.map((inv, idx) => {
                const points = calculateGreenPoints(inv.amount, inv.projects.category)
                const co2 = calculateCo2Saved(inv.amount, inv.projects.impact_tons_co2, inv.projects.target_amount)
                const multiplier = getPointMultiplier(inv.projects.category)
                
                return (
                  <div key={inv.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-800">{inv.projects.name}</p>
                        <p className="text-xs text-gray-500 capitalize">{inv.projects.category}</p>
                      </div>
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                        {multiplier}x points
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                      <div>
                        <p className="text-xs text-gray-500">Investment</p>
                        <p className="font-semibold">${inv.amount}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Green Points</p>
                        <p className="font-semibold text-green-600">{points.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">CO₂ Saved</p>
                        <p className="font-semibold text-blue-600">{co2.toFixed(1)} tons</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Trees Equivalent</p>
                        <p className="font-semibold text-green-600">{Math.round(co2 * 45)}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-2xl shadow-sm p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl">🏆</span>
            <h3 className="font-semibold text-gray-800">Impact Leaderboard</h3>
          </div>
          
          {leaderboard.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No leaders yet. Be the first!</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((leader, idx) => (
                <div 
                  key={idx} 
                  className={`flex justify-between items-center p-2 rounded-lg ${
                    leader.email === user?.email ? 'bg-green-50 border border-green-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-bold w-6 ${
                      idx === 0 ? 'text-yellow-500' : 
                      idx === 1 ? 'text-gray-400' : 
                      idx === 2 ? 'text-orange-500' : 'text-gray-400'
                    }`}>
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-medium text-sm">
                        {leader.first_name} {leader.last_name?.charAt(0)}.
                        {leader.email === user?.email && (
                          <span className="text-xs text-green-600 ml-1">(You)</span>
                        )}
                      </p>
                      <p className="text-xs text-gray-400">{leader.country || 'Africa'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{leader.green_points?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">points</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Share Impact Button */}
        <button 
          onClick={() => {
            const text = `🌍 I've invested in Africa's green future with Gain! So far, I've saved ${totalCo2Saved.toFixed(1)} tons of CO₂ and earned ${totalGreenPoints.toLocaleString()} Green Points. Join me at gain.africa 🌱`
            navigator.clipboard.writeText(text)
            alert('Impact summary copied! Share it with your network.')
          }}
          className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold mb-4"
        >
          📤 Share Your Impact
        </button>
      </div>
    </div>
  )
}