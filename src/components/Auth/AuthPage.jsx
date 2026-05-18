import { useState } from 'react'
import { supabase } from '../../supabaseClient'

export default function AuthPage({ onLogin }) {
  const [mode,     setMode]     = useState('login')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        onLogin(data.user)
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) onLogin(data.user)
        else setError('Check your email to confirm your account.')
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
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input className="auth-input" type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} required />
          <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? '...' : mode === 'login' ? '🔓 LOGIN' : '🚀 CREATE ACCOUNT'}
          </button>
        </form>
        <span className="auth-link" onClick={() => { setMode(m => m === 'login' ? 'signup' : 'login'); setError('') }}>
          {mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Login'}
        </span>
      </div>
    </div>
  )
}
