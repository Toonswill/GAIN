'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function KYCPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [kycStatus, setKycStatus] = useState('not_submitted')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    idType: 'national_id',
    idNumber: '',
    address: '',
    city: '',
    country: ''
  })
  const [frontFile, setFrontFile] = useState(null)
  const [backFile, setBackFile] = useState(null)
  const [frontPreview, setFrontPreview] = useState(null)
  const [backPreview, setBackPreview] = useState(null)
  const router = useRouter()

  useEffect(() => {
    checkAuthAndLoad()
  }, [])

  async function checkAuthAndLoad() {
    setLoading(true)
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('Session check:', session ? 'Logged in' : 'Not logged in')
    
    if (sessionError || !session) {
      console.log('No session, redirecting to login')
      router.push('/')
      return
    }
    
    setUser(session.user)
    await loadUserData(session.user.id)
    setLoading(false)
  }

  async function loadUserData(userId) {
    // Get user profile
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (profile) {
      setKycStatus(profile.kyc_status || 'not_submitted')
      setFormData({
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        dateOfBirth: profile.date_of_birth || '',
        idType: profile.id_type || 'national_id',
        idNumber: profile.id_number || '',
        address: profile.address || '',
        city: profile.city || '',
        country: profile.country || ''
      })
    }
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum 5MB.')
      return
    }

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      alert('Only JPEG and PNG files are allowed.')
      return
    }

    if (type === 'front') {
      setFrontFile(file)
      setFrontPreview(URL.createObjectURL(file))
    } else {
      setBackFile(file)
      setBackPreview(URL.createObjectURL(file))
    }
  }

  async function submitKYC(e) {
    e.preventDefault()
    
    if (!formData.firstName || !formData.lastName || !formData.dateOfBirth || 
        !formData.idNumber || !formData.address || !formData.city || !formData.country) {
      alert('Please fill in all required fields')
      return
    }

    if (!frontFile) {
      alert('Please upload the front side of your ID')
      return
    }

    setSubmitting(true)

    try {
      // Upload ID images
      const frontFileName = `${user.id}/front_${Date.now()}.${frontFile.name.split('.').pop()}`
      
      const { error: frontError } = await supabase.storage
        .from('kyc_docs')
        .upload(frontFileName, frontFile)

      if (frontError) throw new Error('Failed to upload front ID')

      let backUrl = null
      if (backFile) {
        const backFileName = `${user.id}/back_${Date.now()}.${backFile.name.split('.').pop()}`
        const { error: backError } = await supabase.storage
          .from('kyc_docs')
          .upload(backFileName, backFile)
        if (!backError) backUrl = backFileName
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          date_of_birth: formData.dateOfBirth,
          id_type: formData.idType,
          id_number: formData.idNumber,
          address: formData.address,
          city: formData.city,
          country: formData.country,
          id_front_url: frontFileName,
          id_back_url: backUrl,
          kyc_status: 'pending'
        })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('✅ KYC submitted successfully! Our team will review your documents.')
      setKycStatus('pending')
      
    } catch (error) {
      console.error('KYC submission error:', error)
      alert('Error submitting KYC: ' + error.message)
    } finally {
      setSubmitting(false)
    }
  }

  const africanCountries = [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon',
    'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea',
    'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau',
    'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali',
    'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda',
    'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa',
    'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ].sort()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="text-center py-20">
          <div className="animate-pulse text-2xl mb-2">🔐</div>
          <p className="text-gray-500">Loading KYC portal...</p>
        </div>
      </div>
    )
  }

  if (kycStatus === 'pending') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 pb-20">
        <div className="max-w-md mx-auto text-center py-12">
          <div className="text-6xl mb-4">⏳</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">KYC Under Review</h2>
          <p className="text-gray-500 mb-4">Our team is verifying your documents. This usually takes 24-48 hours.</p>
          <button onClick={() => router.push('/dashboard')} className="bg-green-600 text-white px-6 py-2 rounded-xl">
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-green-800 mb-2">🔐 Verify Your Identity</h1>
        <p className="text-sm text-gray-500 mb-6">Required by regulators to prevent fraud</p>

        <form onSubmit={submitKYC} className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Personal Information</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                <input type="text" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Name *</label>
                <input type="text" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">ID Information</h3>
            
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">ID Type *</label>
              <select value={formData.idType} onChange={e => setFormData({...formData, idType: e.target.value})} className="w-full p-2 border rounded-lg text-sm">
                <option value="national_id">National ID Card</option>
                <option value="passport">Passport</option>
                <option value="drivers_license">Driver's License</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">ID Number *</label>
              <input type="text" value={formData.idNumber} onChange={e => setFormData({...formData, idNumber: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>

            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Front Side of ID *</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'front')} className="w-full p-2 border rounded-lg text-sm" required />
              {frontPreview && <img src={frontPreview} alt="Front ID" className="mt-2 max-h-32 rounded-lg border" />}
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Back Side of ID (Optional)</label>
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, 'back')} className="w-full p-2 border rounded-lg text-sm" />
              {backPreview && <img src={backPreview} alt="Back ID" className="mt-2 max-h-32 rounded-lg border" />}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm p-5">
            <h3 className="font-semibold text-gray-800 mb-3">Address Information</h3>
            
            <div className="mb-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Address *</label>
              <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">City *</label>
                <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country *</label>
                <select value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})} className="w-full p-2 border rounded-lg text-sm" required>
                  <option value="">Select country</option>
                  {africanCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold disabled:bg-gray-400">
            {submitting ? 'Submitting...' : 'Submit KYC Verification'}
          </button>
        </form>
      </div>
    </div>
  )
}