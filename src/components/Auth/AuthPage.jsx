import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { getDeviceFingerprint, getDeviceInfo } from '../../utils/deviceFingerprint'

export default function AuthPage({ onLogin }) {
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function registerDevice(userId) {
    const fingerprint = await getDeviceFingerprint()
    const deviceInfo  = getDeviceInfo()
    await supabase.from('devices').insert({ user_id:userId, fingerprint, device_info:deviceInfo })
  }

  async function checkDevice(userId) {
    const fingerprint = await getDeviceFingerprint()
    const { data: devices } = await supabase.from('devices').select('fingerprint').eq('user_id', userId)
    if (!devices || devices.length === 0) { await registerDevice(userId); return true }
    return devices.some(d => d.fingerprint === fingerprint)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) { await registerDevice(data.user.id); onLogin(data.user) }
        else setError('Check your email to confirm your account.')
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        const allowed = await checkDevice(data.user.id)
        if (!allowed) {
          await supabase.auth.signOut()
          setError('❌ This account is locked to another device. Contact support to switch devices.')
          setLoading(false)
          return
        }
        onLogin(data.user)
      }
    } catch(err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize:'2.5rem', marginBottom:'6px' }}>🎰</div>
        <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#d4af37', marginBottom:'4px' }}>GOA ROULETTE</div>
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'28px', letterSpacing:'1px', textTransform:'uppercase' }}>
          {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
        </div>
        {error && <div className="auth-error" style={{ lineHeight:1.5 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? mode === 'login' ? 'Checking device...' : 'Creating account...' : mode === 'login' ? '🔓 LOGIN' : '🚀 CREATE ACCOUNT'}
          </button>
        </form>
        <span className="auth-link" onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </span>
        {mode === 'login' && (
          <div style={{ marginTop:'16px', fontSize:'0.65rem', color:'#444', lineHeight:1.6 }}>
            ⚠️ This app is locked to one device per account.
          </div>
        )}
      </div>
    </div>
  )
}
