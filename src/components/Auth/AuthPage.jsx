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
    // Only insert what we know exists in the table
    const { error } = await supabase.from('devices').insert({
      user_id:     userId,
      fingerprint: fingerprint,
      device_info: deviceInfo,
    })
    if (error) console.error('[GOA] Register device FAILED:', error.message)
    else       console.log('[GOA] Device registered OK:', deviceInfo)
  }

  async function checkDevice(userId) {
    // Admin bypasses all checks
    if (email.trim().toLowerCase() === ADMIN_EMAIL) {
      console.log('[GOA] Admin login — skipping device check')
      return { allowed: true }
    }

    const fingerprint = await getDeviceFingerprint()
    console.log('[GOA] My fingerprint:', fingerprint.substring(0, 16) + '...')

    // Fetch ALL columns so missing locked column doesnt cause error
    const { data: rows, error: fetchErr } = await supabase
      .from('devices')
      .select('*')
      .eq('user_id', userId)

    if (fetchErr) {
      console.error('[GOA] Fetch devices FAILED:', fetchErr.message)
      return { allowed: false, message: 'Device check failed. Contact admin. (' + fetchErr.message + ')' }
    }

    console.log('[GOA] Devices in DB:', rows?.length ?? 0)
    if (rows?.length) {
      console.log('[GOA] Stored fingerprint:', rows[0].fingerprint?.substring(0, 16) + '...')
      console.log('[GOA] Locked?', rows[0].locked)
    }

    // ── CASE 1: No device registered — first ever login ──────────
    if (!rows || rows.length === 0) {
      console.log('[GOA] CASE 1: First login — registering device')
      await registerDevice(userId)
      return { allowed: true }
    }

    // ── CASE 2: Account is locked ─────────────────────────────────
    const isLocked = rows.some(r => r.locked === true)
    if (isLocked) {
      console.log('[GOA] CASE 2: Account is locked')
      return {
        allowed: false,
        message: '🔒 Your account is locked. Contact admin to unlock.'
      }
    }

    // ── CASE 3: Same device — allow ───────────────────────────────
    const sameDevice = rows.some(r => r.fingerprint === fingerprint)
    if (sameDevice) {
      console.log('[GOA] CASE 3: Same device — allowed')
      return { allowed: true }
    }

    // ── CASE 4: Different device — lock account and block ─────────
    console.log('[GOA] CASE 4: Different device — locking account!')
    const { error: lockErr } = await supabase
      .from('devices')
      .update({
        locked:      true,
        lock_reason: 'Different device login on ' + new Date().toLocaleString(),
      })
      .eq('user_id', userId)

    if (lockErr) console.error('[GOA] Lock FAILED:', lockErr.message)
    else         console.log('[GOA] Account locked successfully')

    return {
      allowed: false,
      message: '⚠️ Login from another device detected! Your account has been locked. Contact admin to unlock.'
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    console.log('[GOA] Login attempt for:', email.trim())

    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      })

      if (signInErr) {
        console.error('[GOA] Sign in failed:', signInErr.message)
        setError('Invalid email or password.')
        setLoading(false)
        return
      }

      console.log('[GOA] Auth OK — checking device...')
      const result = await checkDevice(data.user.id)
      console.log('[GOA] Device check result:', result)

      if (!result.allowed) {
        await supabase.auth.signOut()
        setError(result.message)
        setLoading(false)
        return
      }

      console.log('[GOA] Login complete!')
      onLogin(data.user)

    } catch (err) {
      console.error('[GOA] Unexpected error:', err)
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
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'28px', letterSpacing:'1px', textTransform:'uppercase' }}>
          Authorised Access Only
        </div>

        {error && (
          <div className="auth-error" style={{ lineHeight:1.6 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="email"
            placeholder="Email address"
            value={email}
            autoComplete="off"
            onChange={e => setEmail(e.target.value)}
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
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : '🔓 LOGIN'}
          </button>
        </form>

        <div style={{ marginTop:'20px', fontSize:'0.65rem', color:'#333', lineHeight:1.8 }}>
          🔒 One device per account<br />
          Contact admin for access
        </div>
      </div>
    </div>
  )
}
