'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminProjects() {
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  const [form, setForm] = useState({
    name: '',
    category: 'e-mobility',
    location: '',
    owner: '',
    description: '',
    target_amount: '',
    annual_return: '',
    duration_months: '',
    min_investment: 10,
    impact_tons_co2: '',
    status: 'pending'
  })

  useEffect(() => {
    checkAdminAndFetch()
  }, [])

  async function checkAdminAndFetch() {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      router.push('/')
      return
    }
    
    // Check if user is admin (you can change this email)
    if (session.user.email !== 'admin@gain.africa') {
      alert('Admin access only. This area is restricted to Gain administrators.')
      router.push('/dashboard')
      return
    }
    
    setIsAdmin(true)
    await fetchProjects()
  }

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    
    setProjects(data || [])
    setLoading(false)
  }

  async function saveProject(e) {
    e.preventDefault()
    setLoading(true)
    
    const projectData = {
      ...form,
      target_amount: parseFloat(form.target_amount),
      annual_return: parseFloat(form.annual_return),
      duration_months: parseInt(form.duration_months),
      min_investment: parseFloat(form.min_investment),
      impact_tons_co2: parseInt(form.impact_tons_co2) || 0,
      funded_amount: editingProject?.funded_amount || 0
    }

    if (editingProject) {
      const { error } = await supabase
        .from('projects')
        .update(projectData)
        .eq('id', editingProject.id)
      
      if (error) alert('Error updating: ' + error.message)
      else alert('Project updated successfully!')
    } else {
      const { error } = await supabase
        .from('projects')
        .insert([projectData])
      
      if (error) alert('Error creating: ' + error.message)
      else alert('Project created successfully!')
    }
    
    setShowForm(false)
    setEditingProject(null)
    resetForm()
    await fetchProjects()
    setLoading(false)
  }

  async function updateProjectStatus(id, newStatus) {
    const { error } = await supabase
      .from('projects')
      .update({ status: newStatus })
      .eq('id', id)
    
    if (error) alert('Error updating status: ' + error.message)
    else {
      alert(`Project status updated to ${newStatus}`)
      await fetchProjects()
    }
  }

  async function deleteProject(id) {
    if (confirm('⚠️ Are you sure you want to delete this project? This action cannot be undone.')) {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)
      
      if (error) alert('Error deleting: ' + error.message)
      else {
        alert('Project deleted successfully')
        await fetchProjects()
      }
    }
  }

  function resetForm() {
    setForm({
      name: '',
      category: 'e-mobility',
      location: '',
      owner: '',
      description: '',
      target_amount: '',
      annual_return: '',
      duration_months: '',
      min_investment: 10,
      impact_tons_co2: '',
      status: 'pending'
    })
  }

  function editProject(project) {
    setEditingProject(project)
    setForm({
      name: project.name,
      category: project.category,
      location: project.location || '',
      owner: project.owner || '',
      description: project.description || '',
      target_amount: project.target_amount,
      annual_return: project.annual_return,
      duration_months: project.duration_months,
      min_investment: project.min_investment,
      impact_tons_co2: project.impact_tons_co2 || '',
      status: project.status
    })
    setShowForm(true)
  }

  if (!isAdmin && !loading) return null
  if (loading && projects.length === 0) return <div className="p-8 text-center">Loading admin portal...</div>

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'text-green-600 bg-green-50'
      case 'pending': return 'text-yellow-600 bg-yellow-50'
      case 'completed': return 'text-blue-600 bg-blue-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-green-800">👨‍💼 Admin Portal</h1>
            <p className="text-sm text-gray-500">Manage green investment projects</p>
          </div>
          <button 
            onClick={() => { resetForm(); setEditingProject(null); setShowForm(true) }}
            className="bg-green-600 text-white px-4 py-2 rounded-xl font-semibold text-sm"
          >
            + Add New Project
          </button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-green-600">{projects.length}</div>
            <div className="text-xs text-gray-500">Total Projects</div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-green-600">{projects.filter(p => p.status === 'active').length}</div>
            <div className="text-xs text-gray-500">Active</div>
          </div>
          <div className="bg-white p-3 rounded-xl shadow-sm">
            <div className="text-2xl font-bold text-yellow-600">{projects.filter(p => p.status === 'pending').length}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </div>

        {/* Projects List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-700">All Projects</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-gray-500">
              No projects yet. Click "Add New Project" to get started.
            </div>
          ) : (
            projects.map(project => (
              <div key={project.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-800">{project.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{project.category} • {project.location}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Target: ${project.target_amount?.toLocaleString()} • {project.annual_return}% p.a. • {project.duration_months} months
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      value={project.status}
                      onChange={(e) => updateProjectStatus(project.id, e.target.value)}
                      className="text-xs border rounded-lg px-2 py-1"
                    >
                      <option value="pending">Pending</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                    <button 
                      onClick={() => editProject(project)}
                      className="text-blue-600 text-sm px-2 py-1"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteProject(project.id)}
                      className="text-red-600 text-sm px-2 py-1"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">{editingProject ? 'Edit Project' : 'Add New Project'}</h2>
              
              <form onSubmit={saveProject} className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Project Name *" 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full p-2 border rounded-lg" 
                  required 
                />
                
                <select 
                  value={form.category} 
                  onChange={e => setForm({...form, category: e.target.value})} 
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="e-mobility">E-Mobility</option>
                  <option value="waste">Waste Management</option>
                  <option value="biofuel">Biofuel</option>
                  <option value="circular">Circular Economy</option>
                  <option value="green_hydrogen">Green Hydrogen</option>
                  <option value="minigrid">Mini-Grids</option>
                </select>
                
                <input 
                  type="text" 
                  placeholder="Location (e.g., Kigali, Rwanda)" 
                  value={form.location} 
                  onChange={e => setForm({...form, location: e.target.value})} 
                  className="w-full p-2 border rounded-lg" 
                  required 
                />
                
                <input 
                  type="text" 
                  placeholder="Owner/Company" 
                  value={form.owner} 
                  onChange={e => setForm({...form, owner: e.target.value})} 
                  className="w-full p-2 border rounded-lg" 
                  required 
                />
                
                <textarea 
                  placeholder="Project Description" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full p-2 border rounded-lg" 
                  rows="3" 
                  required 
                />
                
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="number" 
                    placeholder="Target Amount ($)" 
                    value={form.target_amount} 
                    onChange={e => setForm({...form, target_amount: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Annual Return (%)" 
                    value={form.annual_return} 
                    onChange={e => setForm({...form, annual_return: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Duration (months)" 
                    value={form.duration_months} 
                    onChange={e => setForm({...form, duration_months: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    required 
                  />
                  <input 
                    type="number" 
                    placeholder="Min Investment ($)" 
                    value={form.min_investment} 
                    onChange={e => setForm({...form, min_investment: e.target.value})} 
                    className="w-full p-2 border rounded-lg" 
                    required 
                  />
                </div>
                
                <input 
                  type="number" 
                  placeholder="Impact (tons CO₂ saved)" 
                  value={form.impact_tons_co2} 
                  onChange={e => setForm({...form, impact_tons_co2: e.target.value})} 
                  className="w-full p-2 border rounded-lg" 
                />
                
                <select 
                  value={form.status} 
                  onChange={e => setForm({...form, status: e.target.value})} 
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="pending">Pending (not visible to investors)</option>
                  <option value="active">Active (visible to investors)</option>
                  <option value="completed">Completed (closed)</option>
                </select>
                
                <div className="flex gap-3 pt-3">
                  <button 
                    type="button" 
                    onClick={() => { setShowForm(false); setEditingProject(null); resetForm(); }} 
                    className="flex-1 bg-gray-200 p-2 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex-1 bg-green-600 text-white p-2 rounded-lg"
                  >
                    {loading ? 'Saving...' : (editingProject ? 'Update Project' : 'Create Project')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}