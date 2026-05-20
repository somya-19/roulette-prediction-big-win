import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { getDeviceFingerprint, getDeviceInfo } from '../../utils/deviceFingerprint'

const ADMIN_EMAIL = 'admin_rock@bigwin.com'

export default function AuthPage({ onLogin, onError, onInfo, authError, authInfo, onClearMessages }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)

  async function registerDevice(userId) {
    const fingerprint = await getDeviceFingerprint()
    const deviceInfo  = getDeviceInfo()
    const { error } = await supabase.from('devices').insert({
      user_id:     userId,
      fingerprint: fingerprint,
      device_info: deviceInfo,
    })
    if (error) console.error('[GOA] Register failed:', error.message)
  }

  async function checkDevice(userId) {
    if (email.trim().toLowerCase() === ADMIN_EMAIL) return { allowed: true }

    const fingerprint = await getDeviceFingerprint()

    const { data: rows, error: fetchErr } = await supabase
      .from('devices').select('*').eq('user_id', userId)

    if (fetchErr) {
      return { allowed: false, type: 'error', message: 'Device check failed: ' + fetchErr.message }
    }

    // CASE 1: First ever login — register device
    if (!rows || rows.length === 0) {
      await registerDevice(userId)
      return {
        allowed: true,
        type: 'first',
        message: '✅ Device registered! Your account is now locked to this device. Logging in from any other device will lock your account permanently.'
      }
    }

    // CASE 2: Account is locked
    if (rows.some(r => r.locked === true)) {
      return {
        allowed: false,
        type: 'locked',
        message: '🔒 Your account has been locked due to a login attempt from another device. Please contact admin to unlock.'
      }
    }

    // CASE 3: Same device — allow silently
    if (rows.some(r => r.fingerprint === fingerprint)) {
      return { allowed: true }
    }

    // CASE 4: Different device — lock and block
    await supabase.from('devices')
      .update({ locked: true, lock_reason: 'Different device: ' + new Date().toLocaleString() })
      .eq('user_id', userId)

    return {
      allowed: false,
      type: 'locked',
      message: '⚠️ Login attempt from a different device detected! Your account has been locked for security. Contact admin to unlock.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    onClearMessages()
    setLoading(true)

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      })

      if (signInErr) {
        onError('Invalid email or password.')
        setLoading(false)
        return
      }

      const result = await checkDevice(data.user.id)

      if (!result.allowed) {
        // Sign out and show error — error lives in App.jsx so survives remount
        await supabase.auth.signOut()
        onError(result.message)
        setLoading(false)
        return
      }

      // Show first-login info warning if needed
      if (result.type === 'first') {
        onInfo(result.message)
      }

      onLogin(data.user)

    } catch (err) {
      onError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🎰</div>
        <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#d4af37', marginBottom:'4px' }}>GOA ROULETTE</div>
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'24px', letterSpacing:'1px', textTransform:'uppercase' }}>
          Authorised Access Only
        </div>

        {/* Error message — red */}
        {authError && (
          <div style={{ background:'#b71c1c', color:'#fff', fontSize:'0.8rem', fontWeight:700, padding:'12px', borderRadius:'6px', marginBottom:'14px', lineHeight:1.6, textAlign:'left' }}>
            {authError}
          </div>
        )}

        {/* Info message — blue (first login warning) */}
        {authInfo && (
          <div style={{ background:'#1565c0', color:'#fff', fontSize:'0.75rem', fontWeight:600, padding:'12px', borderRadius:'6px', marginBottom:'14px', lineHeight:1.6, textAlign:'left', border:'1px solid #42a5f5' }}>
            {authInfo}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            autoComplete="off"
            onChange={e => { setEmail(e.target.value); onClearMessages() }}
            onKeyDown={e => { if (e.key==='Enter') document.getElementById('pwd').focus() }}
            required
          />
          <input
            id="pwd"
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="off"
            onChange={e => { setPassword(e.target.value); onClearMessages() }}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : '🔓 LOGIN'}
          </button>
        </form>

        <div style={{ marginTop:'20px', fontSize:'0.65rem', color:'#333', lineHeight:1.8 }}>
          🔒 One device per account — Contact admin for access
        </div>
      </div>
    </div>
  )
}
