import { useState, useEffect } from 'react'
import { supabase } from '../../supabaseClient'
import { getDeviceFingerprint, getDeviceInfo } from '../../utils/deviceFingerprint'

const ADMIN_EMAIL = 'admin_rock@bigwin.com'

// Module-level variable — survives component unmount/remount
// When signIn succeeds then we detect wrong device, we store error here
// New AuthPage instance reads it on mount
let pendingError = ''
let pendingInfo  = ''

export default function AuthPage({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [info,     setInfo]     = useState('')

  // On mount — pick up any pending message from previous instance
  useEffect(() => {
    if (pendingError) { setError(pendingError); pendingError = '' }
    if (pendingInfo)  { setInfo(pendingInfo);   pendingInfo  = '' }
  }, [])

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
      return { allowed: false, message: 'Device check failed. Contact admin.' }
    }

    // CASE 1: First login — register device
    if (!rows || rows.length === 0) {
      await registerDevice(userId)
      return {
        allowed: true,
        info: '✅ This device is now registered to your account. Logging in from any other device will permanently lock your account.'
      }
    }

    // CASE 2: Account is locked
    if (rows.some(r => r.locked === true)) {
      return {
        allowed: false,
        message: '🔒 Your account is locked due to a login attempt from another device. Contact admin to unlock.'
      }
    }

    // CASE 3: Same device — allow
    if (rows.some(r => r.fingerprint === fingerprint)) {
      return { allowed: true }
    }

    // CASE 4: Different device — lock account
    await supabase.from('devices')
      .update({
        locked:      true,
        lock_reason: 'Different device: ' + new Date().toLocaleString()
      })
      .eq('user_id', userId)

    return {
      allowed: false,
      message: '⚠️ Login from another device detected! Your account has been locked. Contact admin to unlock.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      })

      if (signInErr) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }

      const result = await checkDevice(data.user.id)

      if (!result.allowed) {
        // ── KEY FIX: store error BEFORE signOut ──────────────────
        // signOut triggers onAuthStateChange → App remounts AuthPage
        // new AuthPage reads pendingError in useEffect above
        pendingError = result.message
        await supabase.auth.signOut()
        // AuthPage already remounted with the error at this point
        return
      }

      // First login — show info message after entering app
      if (result.info) {
        pendingInfo = result.info
      }

      onLogin(data.user)

    } catch (err) {
      setError('Something went wrong. Try again.')
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
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'24px', letterSpacing:'1px', textTransform:'uppercase' }}>
          Authorised Access Only
        </div>

        {/* Error — red */}
        {error && (
          <div style={{
            background:'#b71c1c', color:'#fff',
            fontSize:'0.8rem', fontWeight:700,
            padding:'12px', borderRadius:'6px',
            marginBottom:'14px', lineHeight:1.7,
            textAlign:'left', border:'1px solid #ef5350'
          }}>
            {error}
          </div>
        )}

        {/* Info — blue (first login warning) */}
        {info && (
          <div style={{
            background:'#0d47a1', color:'#fff',
            fontSize:'0.75rem', fontWeight:600,
            padding:'12px', borderRadius:'6px',
            marginBottom:'14px', lineHeight:1.7,
            textAlign:'left', border:'1px solid #42a5f5'
          }}>
            {info}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            autoComplete="off"
            onChange={e => { setEmail(e.target.value); setError(''); setInfo('') }}
            onKeyDown={e => { if (e.key === 'Enter') document.getElementById('pwd').focus() }}
            required
          />
          <input
            id="pwd"
            className="auth-input"
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="off"
            onChange={e => { setPassword(e.target.value); setError(''); setInfo('') }}
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
