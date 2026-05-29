'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [country, setCountry] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [countryCode, setCountryCode] = useState('+254')
  const [hearAbout, setHearAbout] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)

  // Fetch stats for landing page
  const [stats, setStats] = useState({
    investors: 'Loading...',
    projects: 'Loading...',
    co2_saved: 'Loading...'
  })

  useEffect(() => {
    fetchStats()
  }, [])

  async function fetchStats() {
    const { data, error } = await supabase
      .from('stats')
      .select('stat_key, stat_value')
    
    if (!error && data) {
      const statsMap = {}
      data.forEach(stat => {
        statsMap[stat.stat_key] = stat.stat_value
      })
      setStats({
        investors: statsMap.investors || '0',
        projects: statsMap.projects || '0',
        co2_saved: statsMap.co2_saved || '0'
      })
    }
  }

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ 
      email: loginEmail, 
      password: loginPassword 
    })
    if (error) alert(error.message)
    else router.push('/dashboard')
    setLoading(false)
  }

  async function handleRegister(e) {
  e.preventDefault()
  
  // Validation
  if (password !== confirmPassword) {
    alert('Passwords do not match')
    return
  }
  if (!termsAccepted) {
    alert('You must accept the Terms & Conditions')
    return
  }
  if (!firstName || !lastName || !country || !email || !phone) {
    alert('Please fill in all required fields')
    return
  }

  setLoading(true)
  
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          full_name: `${firstName} ${lastName}`
        }
      }
    })
    
    if (authError) {
      alert(authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // Try to insert into users table
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          phone: `${countryCode}${phone}`,
          country: country,
          hear_about: hearAbout,
          terms_accepted: termsAccepted,
          kyc_status: 'not_submitted',
          wallet_balance: 0,
          green_points: 0
        })
      
      if (insertError) {
        console.error('Insert error details:', insertError)
        alert(`Profile error: ${insertError.message}. Please contact support with this error.`)
      } else {
        alert('Account created successfully! Please check your email to confirm.')
        setIsLogin(true)
        // Clear form
        setFirstName('')
        setLastName('')
        setCountry('')
        setEmail('')
        setPhone('')
        setPassword('')
        setConfirmPassword('')
        setTermsAccepted(false)
      }
    }
  } catch (error) {
    console.error('Registration error:', error)
    alert('An unexpected error occurred. Please try again.')
  }
  
  setLoading(false)
}
  // All African countries
  const africanCountries = [
    'Algeria', 'Angola', 'Benin', 'Botswana', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cameroon', 
    'Central African Republic', 'Chad', 'Comoros', 'Congo', 'Djibouti', 'Egypt', 'Equatorial Guinea', 
    'Eritrea', 'Eswatini', 'Ethiopia', 'Gabon', 'Gambia', 'Ghana', 'Guinea', 'Guinea-Bissau', 
    'Ivory Coast', 'Kenya', 'Lesotho', 'Liberia', 'Libya', 'Madagascar', 'Malawi', 'Mali', 
    'Mauritania', 'Mauritius', 'Morocco', 'Mozambique', 'Namibia', 'Niger', 'Nigeria', 'Rwanda', 
    'Sao Tome and Principe', 'Senegal', 'Seychelles', 'Sierra Leone', 'Somalia', 'South Africa', 
    'South Sudan', 'Sudan', 'Tanzania', 'Togo', 'Tunisia', 'Uganda', 'Zambia', 'Zimbabwe'
  ].sort()

  // Country codes for phone
  const countryCodes = [
    '+20', '+27', '+211', '+212', '+213', '+216', '+218', '+220', '+221', '+222', '+223', '+224', 
    '+225', '+226', '+227', '+228', '+229', '+230', '+231', '+232', '+233', '+234', '+235', '+236', 
    '+237', '+238', '+239', '+240', '+241', '+242', '+243', '+244', '+245', '+248', '+249', '+250', 
    '+251', '+252', '+253', '+254', '+255', '+256', '+257', '+258', '+260', '+261', '+263', '+264', 
    '+265', '+266', '+267', '+268', '+269', '+27', '+290', '+291', '+297', '+298', '+350', '+351'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-700 to-green-500 text-white px-6 pt-12 pb-16 rounded-b-3xl">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">🌍 Gain</h1>
          <p className="text-green-100 text-lg">Green Africa Investment Network</p>
          <p className="text-green-50 text-sm mt-4 max-w-xs mx-auto">
            Invest in Africa's green future. From $10, earn up to 19% p.a.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="px-6 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div><div className="text-2xl font-bold text-green-600">{stats.investors}</div><div className="text-xs text-gray-500">Investors</div></div>
            <div><div className="text-2xl font-bold text-green-600">{stats.projects}</div><div className="text-xs text-gray-500">Projects</div></div>
            <div><div className="text-2xl font-bold text-green-600">{stats.co2_saved}</div><div className="text-xs text-gray-500">Tons CO₂ Saved</div></div>
          </div>
        </div>
      </div>

      {/* Auth Card */}
      <div className="px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
          <div className="flex gap-2 mb-6">
            <button onClick={() => setIsLogin(true)} className={`flex-1 py-2 rounded-lg font-semibold ${isLogin ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Login</button>
            <button onClick={() => setIsLogin(false)} className={`flex-1 py-2 rounded-lg font-semibold ${!isLogin ? 'bg-green-600 text-white' : 'bg-gray-100'}`}>Register</button>
          </div>

          {isLogin ? (
            // LOGIN FORM
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-Mail</label>
                <input type="email" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl" required />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold">LOGIN</button>
            </form>
          ) : (
            // REGISTER FORM
            <form onSubmit={handleRegister} className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Surname *</label>
                  <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Country *</label>
                <select value={country} onChange={e => setCountry(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required>
                  <option value="">Select country</option>
                  {africanCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="flex gap-2">
                  <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className="w-1/3 p-2 border border-gray-300 rounded-lg text-sm">
                    {countryCodes.map(code => <option key={code} value={code}>{code}</option>)}
                  </select>
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="712345678" className="flex-1 p-2 border border-gray-300 rounded-lg text-sm" required />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">How did you hear about Gain?</label>
                <select value={hearAbout} onChange={e => setHearAbout(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm">
                  <option value="">Select an option</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="twitter">Twitter/X</option>
                  <option value="facebook">Facebook</option>
                  <option value="instagram">Instagram</option>
                  <option value="friend">Friend/Family</option>
                  <option value="podcast">Podcast</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Password *</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" required />
              </div>

              <div className="flex items-start gap-2">
                <input type="checkbox" checked={termsAccepted} onChange={e => setTermsAccepted(e.target.checked)} className="mt-1" required />
                <label className="text-xs text-gray-600">
                  I agree to Gain's <a href="#" className="text-green-600">Terms of Service</a> and 
                  <a href="#" className="text-green-600"> Privacy Policy</a>, including data processing for KYC and investment tracking.
                </label>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-green-600 text-white p-3 rounded-xl font-semibold mt-2">
                {loading ? 'Creating account...' : 'CREATE ACCOUNT'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}