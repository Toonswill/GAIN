'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [user, setUser] = useState(null)

  useEffect(() => {
    getUser()
    fetchProjects()
  }, [])

  async function getUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    
    setProjects(data || [])
    setLoading(false)
  }

  const categories = [
    { value: 'all', label: 'All', icon: '🌍' },
    { value: 'e-mobility', label: 'E-Mobility', icon: '⚡' },
    { value: 'waste', label: 'Waste', icon: '♻️' },
    { value: 'biofuel', label: 'Biofuel', icon: '🌿' },
    { value: 'circular', label: 'Circular', icon: '🔄' },
    { value: 'green_hydrogen', label: 'Green Hydrogen', icon: '💧' },
    { value: 'minigrid', label: 'Mini-Grids', icon: '⚡' },
  ]

  const filteredProjects = filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="text-2xl mb-2">🌍</div>
          <p className="text-gray-500">Loading green projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-green-800">🌍 Green Projects</h1>
          <p className="text-sm text-gray-500">Invest in Africa's sustainable future</p>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.value}
              onClick={() => setFilter(cat.value)}
              className={`flex items-center gap-1 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                filter === cat.value 
                  ? 'bg-green-600 text-white shadow-lg' 
                  : 'bg-white text-gray-700 border border-gray-200'
              }`}
            >
              <span>{cat.icon}</span>
              <span className="text-sm font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">🌱</div>
            <p className="text-gray-500">No projects in this category yet</p>
            <p className="text-xs text-gray-400 mt-1">Check back soon for new opportunities</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProjects.map(project => {
              const percentFunded = (project.funded_amount / project.target_amount) * 100
              
              return (
                <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4">
                    {/* Category Badge */}
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                        {categories.find(c => c.value === project.category)?.label || project.category}
                      </span>
                      <span className="text-xs text-gray-400">{project.location}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{project.name}</h3>
                    <p className="text-xs text-gray-500 mb-3">{project.owner}</p>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.description}</p>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">{project.annual_return}%</div>
                        <div className="text-xs text-gray-500">p.a. return</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">{project.duration_months}m</div>
                        <div className="text-xs text-gray-500">duration</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-gray-800">${project.min_investment}</div>
                        <div className="text-xs text-gray-500">min</div>
                      </div>
                    </div>

                    {/* Funding Progress */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Funded: ${project.funded_amount?.toLocaleString()}</span>
                        <span>Target: ${project.target_amount?.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full transition-all" 
                          style={{ width: `${Math.min(percentFunded, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Impact */}
                    <div className="flex items-center gap-2 mb-3 text-xs text-green-600">
                      <span>🌱</span>
                      <span>{project.impact_tons_co2?.toLocaleString()} tons CO₂ saved</span>
                    </div>

                    {/* Invest Button */}
                    <Link 
                      href={`/projects/${project.id}`}
                      className="block w-full bg-green-600 text-white text-center py-2 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                    >
                      Invest Now →
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}