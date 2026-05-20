import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { getDeviceFingerprint, getDeviceInfo } from '../../utils/deviceFingerprint'

const ADMIN_EMAIL = 'admin_rock@bigwin.com'

export default function AuthPage({ onLogin }) {
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
    // Admin can use any device
    if (email.trim().toLowerCase() === ADMIN_EMAIL) return { allowed: true }

    const fingerprint = await getDeviceFingerprint()

    // Check if account is already locked
    const { data: devices } = await supabase
      .from('devices')
      .select('fingerprint, locked, lock_reason')
      .eq('user_id', userId)

    // No device registered yet — register and allow
    if (!devices || devices.length === 0) {
      await registerDevice(userId)
      return { allowed: true }
    }

    // Account is locked
    if (devices.some(d => d.locked)) {
      return {
        allowed: false,
        message: '🔒 Your account has been locked due to login attempt from another device. Contact admin to unlock.'
      }
    }

    // Same device — allow
    if (devices.some(d => d.fingerprint === fingerprint)) {
      return { allowed: true }
    }

    // Different device — lock account immediately and block
    await supabase
      .from('devices')
      .update({
        locked: true,
        lock_reason: `Login attempted from different device on ${new Date().toLocaleString()}`
      })
      .eq('user_id', userId)

    return {
      allowed: false,
      message: '⚠️ Login from another device detected. Your account has been locked for security. Contact admin to unlock your account.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      })
      if (error) throw error

      const result = await checkDevice(data.user.id)
      if (!result.allowed) {
        await supabase.auth.signOut()
        setError(result.message)
        setLoading(false)
        return
      }

      onLogin(data.user)
    } catch(err) {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🎰</div>
        <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#d4af37', marginBottom:'4px' }}>
          GOA ROULETTE
        </div>
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'28px', letterSpacing:'1px', textTransform:'uppercase' }}>
          Authorised Access Only
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && document.getElementById('pass-input').focus()}
            required
          />
          <input
            id="pass-input"
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : '🔓 LOGIN'}
          </button>
        </form>

        <div style={{ marginTop:'20px', fontSize:'0.65rem', color:'#333', lineHeight:1.7 }}>
          🔒 One device per account<br />
          Contact admin to get access
        </div>
      </div>
    </div>
  )
}

