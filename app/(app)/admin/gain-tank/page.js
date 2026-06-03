'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function GainTankAdmin() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
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
    const { data } = await supabase
      .from('gain_tank_projects')
      .select('*')
      .order('created_at', { ascending: false })
    setProjects(data || [])
    setLoading(false)
  }

  async function updateStatus(id, status) {
    await supabase
      .from('gain_tank_projects')
      .update({ 
        committee_decision: status,
        greenlit_at: status === 'approved' ? new Date() : null
      })
      .eq('id', id)
    await fetchProjects()
    alert(`Project ${status === 'approved' ? 'approved! Move to Projects page to finalize deal.' : 'rejected.'}`)
  }

  if (loading) return <div className="p-8 text-center">Loading GAIN Tank...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl font-bold text-green-800">🦈 GAIN Tank</h1>
            <p className="text-xs text-gray-500">Project pitches awaiting review</p>
          </div>
          <button onClick={() => setShowForm(true)} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm">+ Add Pitch</button>
        </div>

        {projects.filter(p => p.committee_decision === 'pending').length > 0 && (
          <div className="bg-yellow-50 rounded-xl p-3 mb-4">
            <p className="text-sm font-semibold">{projects.filter(p => p.committee_decision === 'pending').length} pending pitches</p>
          </div>
        )}

        <div className="space-y-3">
          {projects.map(p => (
            <div key={p.id} className={`bg-white rounded-xl shadow-sm p-3 border-l-4 ${p.committee_decision === 'approved' ? 'border-l-green-500' : p.committee_decision === 'rejected' ? 'border-l-red-500' : 'border-l-yellow-500'}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-sm">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.founder} • {p.sector}</p>
                  <p className="text-xs text-gray-400 mt-1">Asking: KES {p.valuation_request?.toLocaleString()} for {p.equity_request}%</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                    p.committee_decision === 'approved' ? 'bg-green-100 text-green-700' :
                    p.committee_decision === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {p.committee_decision || 'pending'}
                  </span>
                </div>
                {p.committee_decision === 'pending' && (
                  <div className="flex gap-1">
                    <button onClick={() => updateStatus(p.id, 'approved')} className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Approve</button>
                    <button onClick={() => updateStatus(p.id, 'rejected')} className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs">Reject</button>
                  </div>
                )}
                {p.committee_decision === 'approved' && (
                  <div className="text-xs text-green-600">✓ Approved</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Pitch Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full">
              <h2 className="text-lg font-bold mb-3">New Pitch to GAIN Tank</h2>
              <form onSubmit={async (e) => {
                e.preventDefault()
                const formData = new FormData(e.target)
                await supabase.from('gain_tank_projects').insert([{
                  name: formData.get('name'),
                  founder: formData.get('founder'),
                  sector: formData.get('sector'),
                  valuation_request: parseFloat(formData.get('valuation')),
                  equity_request: parseFloat(formData.get('equity')),
                  description: formData.get('description'),
                  committee_decision: 'pending'
                }])
                setShowForm(false)
                await fetchProjects()
                alert('Pitch submitted to GAIN Tank!')
              }} className="space-y-3">
                <input name="name" placeholder="Project Name" className="w-full p-2 border rounded-lg text-sm" required />
                <input name="founder" placeholder="Founder Name" className="w-full p-2 border rounded-lg text-sm" required />
                <select name="sector" className="w-full p-2 border rounded-lg text-sm">
                  <option value="e-mobility">E-Mobility</option>
                  <option value="waste">Waste</option>
                  <option value="biofuel">Biofuel</option>
                  <option value="green_hydrogen">Green Hydrogen</option>
                  <option value="minigrid">Mini-Grids</option>
                </select>
                <input name="valuation" type="number" placeholder="Valuation Request (KES)" className="w-full p-2 border rounded-lg text-sm" required />
                <input name="equity" type="number" placeholder="Equity Request (%)" className="w-full p-2 border rounded-lg text-sm" required />
                <textarea name="description" placeholder="Description" className="w-full p-2 border rounded-lg text-sm" rows="2" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 bg-gray-200 p-2 rounded-lg text-sm">Cancel</button>
                  <button type="submit" className="flex-1 bg-green-600 text-white p-2 rounded-lg text-sm">Submit Pitch</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}