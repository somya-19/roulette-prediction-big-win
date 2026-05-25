import { useState } from 'react'
import { supabase } from '../../supabaseClient'

let pendingError = ''

export default function AuthPage({ onLogin }) {
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(pendingError)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: signInErr } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password: password.trim(),
      })
      if (signInErr) { setError('Invalid email or password.'); return }
      onLogin(data.user)
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-box">
        <div style={{ fontSize:'2.5rem', marginBottom:'8px' }}>🎰</div>
        <div style={{ fontSize:'1.3rem', fontWeight:900, color:'#d4af37', marginBottom:'4px' }}>GOA ROULETTE</div>
        <div style={{ fontSize:'0.7rem', color:'#555', marginBottom:'28px', letterSpacing:'1px', textTransform:'uppercase' }}>
          Authorised Access Only
        </div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="email" placeholder="Email address"
            value={email} autoComplete="off"
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') document.getElementById('pwd').focus() }}
            required />
          <input id="pwd" className="auth-input" type="password" placeholder="Password"
            value={password} autoComplete="off"
            onChange={e => setPassword(e.target.value)}
            required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? 'Please wait...' : '🔓 LOGIN'}
          </button>
        </form>
      </div>
    </div>
  )
}
