'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function CreateSPV() {
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('projectId')

  const [form, setForm] = useState({
    unique_name: '',
    token_symbol: '',
    total_units: '',
    unit_price: '',
    total_raise: '',
    equity_percentage: '',
    target_return: '',
    duration_months: '',
    // New project detail fields
    project_description: '',
    project_sector: '',
    project_location: '',
    project_founder: '',
    growth_factors: '',
    risk_level: 'medium',
    expected_exit: ''
  })

  useEffect(() => {
    fetchProject()
  }, [])

  async function fetchProject() {
    if (!projectId) {
      router.push('/admin/projects')
      return
    }

    const { data } = await supabase
      .from('gain_tank_projects')
      .select('*')
      .eq('id', projectId)
      .single()
    
    setProject(data)
    
    // Auto-calculate SPV values
    const totalRaise = data.valuation_request * (data.equity_request / 100)
    const suggestedUnitPrice = 1000
    const totalUnits = totalRaise / suggestedUnitPrice
    
    setForm({
      unique_name: `GAIN-SPV-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
      token_symbol: `G${Math.floor(Math.random() * 100)}`,
      total_units: Math.floor(totalUnits),
      unit_price: suggestedUnitPrice,
      total_raise: totalRaise,
      equity_percentage: data.equity_request,
      target_return: '',
      duration_months: '',
      project_description: data.description || '',
      project_sector: data.sector || '',
      project_location: data.country || '',
      project_founder: data.founder || '',
      growth_factors: '',
      risk_level: 'medium',
      expected_exit: ''
    })
    setLoading(false)
  }

  async function createSPV(e) {
    e.preventDefault()
    setSaving(true)

    const spvData = {
      unique_name: form.unique_name,
      token_symbol: form.token_symbol.toUpperCase(),
      gain_tank_project_id: project.id,
      total_units: parseInt(form.total_units),
      unit_price: parseFloat(form.unit_price),
      total_raise: parseFloat(form.total_raise),
      equity_percentage: parseFloat(form.equity_percentage),
      target_return: parseFloat(form.target_return) || null,
      duration_months: parseInt(form.duration_months) || null,
      project_description: form.project_description,
      project_sector: form.project_sector,
      project_location: form.project_location,
      project_founder: form.project_founder,
      growth_factors: form.growth_factors,
      risk_level: form.risk_level,
      expected_exit: form.expected_exit,
      status: 'draft'
    }

    const { error } = await supabase.from('spvs').insert([spvData])

    if (error) {
      alert('Error creating SPV: ' + error.message)
    } else {
      alert(`✅ SPV ${form.unique_name} created! Go to SPVs page to activate.`)
      router.push('/admin/spvs')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-24">
      <div className="max-w-md mx-auto">
        <button onClick={() => router.back()} className="text-green-600 text-sm mb-4">← Back to Projects</button>
        
        <div className="bg-green-50 rounded-xl p-3 mb-4">
          <p className="text-xs text-green-700">Creating SPV for:</p>
          <p className="font-bold text-green-800">{project?.name}</p>
          <p className="text-xs text-green-600">KES {project?.valuation_request?.toLocaleString()} valuation • {project?.equity_request}% equity</p>
        </div>

        <form onSubmit={createSPV} className="space-y-3 bg-white rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-bold mb-3">🏗 SPV Configuration</h2>
          
          {/* Token Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium">SPV Name</label>
              <input type="text" value={form.unique_name} onChange={e => setForm({...form, unique_name: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium">Token Symbol</label>
              <input type="text" value={form.token_symbol} onChange={e => setForm({...form, token_symbol: e.target.value.toUpperCase()})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>
          </div>

          {/* Financial Details */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium">Total Units</label>
              <input type="number" value={form.total_units} onChange={e => setForm({...form, total_units: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>
            <div>
              <label className="text-xs font-medium">Unit Price (KES)</label>
              <input type="number" value={form.unit_price} onChange={e => setForm({...form, unit_price: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-medium">Target Return (%)</label>
              <input type="number" placeholder="e.g., 15" value={form.target_return} onChange={e => setForm({...form, target_return: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium">Duration (months)</label>
              <input type="number" placeholder="e.g., 18" value={form.duration_months} onChange={e => setForm({...form, duration_months: e.target.value})} className="w-full p-2 border rounded-lg text-sm" />
            </div>
          </div>

          {/* Project Details for Investors */}
          <div className="border-t pt-3 mt-2">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">📋 Project Information (for investors)</h3>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium">Project Description</label>
                <textarea value={form.project_description} onChange={e => setForm({...form, project_description: e.target.value})} rows="3" className="w-full p-2 border rounded-lg text-sm" placeholder="Describe what this project does, its mission, and impact..." />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Sector</label>
                  <select value={form.project_sector} onChange={e => setForm({...form, project_sector: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                    <option value="e-mobility">E-Mobility</option>
                    <option value="waste">Waste Management</option>
                    <option value="biofuel">Biofuel</option>
                    <option value="circular">Circular Economy</option>
                    <option value="green_hydrogen">Green Hydrogen</option>
                    <option value="minigrid">Mini-Grids</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Location</label>
                  <input type="text" value={form.project_location} onChange={e => setForm({...form, project_location: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="Country/City" />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium">Growth Factors</label>
                <textarea value={form.growth_factors} onChange={e => setForm({...form, growth_factors: e.target.value})} rows="2" className="w-full p-2 border rounded-lg text-sm" placeholder="Market opportunity, competitive advantage, traction, partnerships..." />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-medium">Risk Level</label>
                  <select value={form.risk_level} onChange={e => setForm({...form, risk_level: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">Expected Exit</label>
                  <input type="text" value={form.expected_exit} onChange={e => setForm({...form, expected_exit: e.target.value})} className="w-full p-2 border rounded-lg text-sm" placeholder="3-5 years / Acquisition" />
                </div>
              </div>
            </div>
          </div>

          <button type="submit" disabled={saving} className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold mt-4">
            {saving ? 'Creating...' : 'Create SPV (Draft)'}
          </button>
        </form>
      </div>
    </div>
  )
}