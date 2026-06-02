'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
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
    await fetchProjects()
  }

  async function fetchProjects() {
    // Fetch approved projects from GAIN Tank that don't have SPVs yet
    const { data } = await supabase
      .from('gain_tank_projects')
      .select('*')
      .eq('committee_decision', 'approved')
      .order('greenlit_at', { ascending: false })
    
    setProjects(data || [])
    setLoading(false)
  }

  async function updateProject(id, updates) {
    await supabase.from('gain_tank_projects').update(updates).eq('id', id)
    await fetchProjects()
    alert('Project updated!')
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <h1 className="text-xl font-bold text-green-800 mb-1">📋 Approved Projects</h1>
        <p className="text-xs text-gray-500 mb-4">Signed deals ready for SPV creation</p>

        {projects.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="text-4xl mb-2">🦈</div>
            <p className="text-gray-500">No approved projects yet</p>
            <p className="text-xs text-gray-400 mt-1">Approve projects in GAIN Tank first</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm p-4 border border-green-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{project.name}</h3>
                    <p className="text-xs text-gray-500">{project.founder} • {project.sector}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/admin/spv/new?projectId=${project.id}`)}
                    className="bg-green-600 text-white px-3 py-1 rounded-lg text-xs"
                  >
                    Create SPV
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div><span className="text-gray-500">Valuation:</span> KES {project.valuation_request?.toLocaleString()}</div>
                  <div><span className="text-gray-500">Equity:</span> {project.equity_request}%</div>
                </div>

                <details className="text-xs">
                  <summary className="text-gray-500 cursor-pointer">Edit deal terms</summary>
                  <div className="mt-2 space-y-2 pt-2 border-t">
                    <input 
                      type="number" 
                      defaultValue={project.valuation_request}
                      placeholder="Valuation (KES)"
                      className="w-full p-1 border rounded text-xs"
                      id={`val-${project.id}`}
                    />
                    <input 
                      type="number" 
                      defaultValue={project.equity_request}
                      placeholder="Equity (%)"
                      className="w-full p-1 border rounded text-xs"
                      id={`eq-${project.id}`}
                    />
                    <button 
                      onClick={() => {
                        const newVal = document.getElementById(`val-${project.id}`).value
                        const newEq = document.getElementById(`eq-${project.id}`).value
                        updateProject(project.id, { 
                          valuation_request: parseFloat(newVal), 
                          equity_request: parseFloat(newEq) 
                        })
                      }}
                      className="bg-blue-600 text-white px-2 py-1 rounded text-xs"
                    >
                      Save Changes
                    </button>
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}