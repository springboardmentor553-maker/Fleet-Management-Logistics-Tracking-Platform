import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ROLES = [
  { value: 'ADMIN',         label: 'Admin — Full system access' },
  { value: 'FLEET_MANAGER', label: 'Fleet Manager — Manage vehicles & drivers' },
  { value: 'DRIVER',        label: 'Driver — View fleet status' },
  { value: 'DISPATCHER',    label: 'Dispatcher — Monitor operations' },
]

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '', role: 'FLEET_MANAGER' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function set(field) { return (e) => setForm((f) => ({ ...f, [field]: e.target.value })) }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setError('')
    setLoading(true)
    try {
      await register(form.email, form.password, form.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3"/>
              <rect x="9" y="11" width="14" height="10" rx="2"/>
              <circle cx="12" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            </svg>
          </div>
          <span className="auth-logo-text">FleetFlow</span>
        </div>

        <h1 className="auth-heading">Create account</h1>
        <p className="auth-subheading">Join your team on FleetFlow</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input id="reg-email" className="form-input" type="email" required autoFocus
              value={form.email} onChange={set('email')} placeholder="you@company.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Password <span style={{color:'var(--text-muted)',fontWeight:400}}>(min. 8 chars)</span></label>
            <input id="reg-password" className="form-input" type="password" required
              value={form.password} onChange={set('password')} placeholder="••••••••" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select id="reg-role" className="form-select" value={form.role} onChange={set('role')}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <button id="reg-submit" type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }} disabled={loading}>
            {loading ? <><span className="spinner" /> Creating account…</> : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
