import { useState } from 'react'
import { supabase } from '../../supabaseClient'
import { getDeviceFingerprint, getDeviceInfo } from '../../utils/deviceFingerprint'

// ── Admin email — bypasses all device checks ─────────────────────
const ADMIN_EMAIL = 'admin_rock@bigwin.com'
// ────────────────────────────────────────────────────────────────

export default function AuthPage({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  // ── Step 1: Register this device for a new user ──────────────
  async function registerDevice(userId) {
    const fingerprint = await getDeviceFingerprint()
    const deviceInfo  = getDeviceInfo()
    const { error } = await supabase.from('devices').insert({
      user_id:      userId,
      fingerprint:  fingerprint,
      device_info:  deviceInfo,
      locked:       false,
      lock_reason:  null,
    })
    if (error) console.error('Register device error:', error.message)
  }

  // ── Step 2: Check device and handle locking ──────────────────
  // Returns: { allowed: true } or { allowed: false, message: '...' }
  async function checkDevice(userId) {

    // Admin bypasses everything
    if (email.trim().toLowerCase() === ADMIN_EMAIL) {
      return { allowed: true }
    }

    const fingerprint = await getDeviceFingerprint()

    // Get all device records for this user
    const { data: rows, error: fetchError } = await supabase
      .from('devices')
      .select('fingerprint, locked, lock_reason')
      .eq('user_id', userId)

    if (fetchError) {
      console.error('Device fetch error:', fetchError.message)
      return { allowed: false, message: 'Error checking device. Try again.' }
    }

    // ── Case 1: No device registered yet ────────────────────────
    // This is their first login — register device and allow
    if (!rows || rows.length === 0) {
      await registerDevice(userId)
      return { allowed: true }
    }

    // ── Case 2: Account is already locked ───────────────────────
    const isLocked = rows.some(r => r.locked === true)
    if (isLocked) {
      return {
        allowed: false,
        message: '🔒 Your account is locked. Contact admin to unlock.'
      }
    }

    // ── Case 3: Same device — allow ──────────────────────────────
    const sameDevice = rows.some(r => r.fingerprint === fingerprint)
    if (sameDevice) {
      return { allowed: true }
    }

    // ── Case 4: Different device — lock account and block ────────
    const { error: lockError } = await supabase
      .from('devices')
      .update({
        locked:      true,
        lock_reason: `Blocked: login from different device on ${new Date().toLocaleString()}`,
      })
      .eq('user_id', userId)

    if (lockError) {
      console.error('Lock error:', lockError.message)
    }

    return {
      allowed: false,
      message: '⚠️ Login attempt from a different device detected! Your account has been locked. Contact admin to unlock.'
    }
  }

  // ── Main submit handler ──────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Step A: Sign in with Supabase Auth
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      })

      if (signInError) {
        setError('Invalid email or password.')
        setLoading(false)
        return
      }

      // Step B: Check device
      const result = await checkDevice(data.user.id)

      if (!result.allowed) {
        // Sign them out immediately
        await supabase.auth.signOut()
        setError(result.message)
        setLoading(false)
        return
      }

      // Step C: All good — let them in
      onLogin(data.user)

    } catch (err) {
      console.error('Login error:', err)
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>🎰</div>
        <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#d4af37', marginBottom: '4px' }}>
          GOA ROULETTE
        </div>
        <div style={{ fontSize: '0.7rem', color: '#555', marginBottom: '28px', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Authorised Access Only
        </div>

        {error && (
          <div className="auth-error" style={{ lineHeight: 1.6 }}>
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

        <div style={{ marginTop: '20px', fontSize: '0.65rem', color: '#333', lineHeight: 1.8 }}>
          🔒 One device per account<br />
          Contact admin for access
        </div>
      </div>
    </div>
  )
}
