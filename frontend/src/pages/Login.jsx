import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, getApiErrorMessage, setAuthToken, setStoredUser } from '../services/api'
import { decodeToken } from '../utils/jwt'
import { ArrowRight, Lock, Mail, User, Shield, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Admin',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((current) => ({
      ...current,
      [name]: value,
    }))
    if (error) setError('')
    if (successMsg) setSuccessMsg('')
    if (fieldErrors[name]) {
      setFieldErrors((current) => ({
        ...current,
        [name]: '',
      }))
    }
  }

  const validateForm = () => {
    const nextFieldErrors = {}
    if (!formData.email.trim()) {
      nextFieldErrors.email = 'Email is required.'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      nextFieldErrors.email = 'Please enter a valid email address.'
    }
    if (!formData.password.trim()) {
      nextFieldErrors.password = 'Password is required.'
    } else if (formData.password.length < 4) {
      nextFieldErrors.password = 'Password must be at least 4 characters.'
    }
    if (!isLogin && !formData.name.trim()) {
      nextFieldErrors.name = 'Name is required.'
    }
    setFieldErrors(nextFieldErrors)
    return Object.keys(nextFieldErrors).length === 0
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setSuccessMsg('')
    if (!validateForm()) return

    setLoading(true)
    try {
      if (isLogin) {
        // Handle Login
        const response = await authService.login({
          email: formData.email.trim(),
          password: formData.password,
        })
        const { access_token: accessToken } = response.data || {}
        if (accessToken) {
          setAuthToken(accessToken)
          const decoded = decodeToken(accessToken)
          if (decoded) {
            const cachedName = localStorage.getItem(`ff_name_${decoded.sub}`)
            setStoredUser({
              name: cachedName || decoded.sub.split('@')[0],
              email: decoded.sub,
              role: decoded.role,
            })
          }
          navigate('/dashboard', { replace: true })
        } else {
          throw new Error('Access token not returned from server.')
        }
      } else {
        // Handle Registration
        const regName = formData.name.trim()
        const regEmail = formData.email.trim()
        await authService.register({
          name: regName,
          email: regEmail,
          password: formData.password,
          role: formData.role,
        })
        localStorage.setItem(`ff_name_${regEmail}`, regName)
        setSuccessMsg('Registration successful! Please sign in.')
        setIsLogin(true)
        setFormData((current) => ({
          ...current,
          password: '',
        }))
      }
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, isLogin ? 'Login failed. Please verify credentials.' : 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      {/* Left side: Premium Logistics Graphic / Info panel */}
      <section className="login-page__illustration">
        <div className="login-page__ill-logo">
          <div className="login-page__ill-logo-container" aria-hidden="true">
            <svg style={{ width: '20px', height: '20px', stroke: '#FFFFFF', strokeWidth: 2.5, fill: 'none' }} viewBox="0 0 32 32">
              <path d="M8 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-3h16M24 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            </svg>
          </div>
          <span className="login-page__ill-logo-title">FleetFlow</span>
        </div>

        <div className="login-page__ill-content">
          <span className="login-page__ill-tag">Enterprise Grade</span>
          <h2 className="login-page__ill-title">Optimize & Dispatch Fleet Operations</h2>
          <p className="login-page__ill-desc">
            Streamline vehicle tracking, schedule preventive maintenance logs, organize driver assignments, and dispatch shipments through a unified telemetry pipeline.
          </p>
          
          {/* Stylized route line vector graphic */}
          <div style={{ marginTop: '40px', position: 'relative', height: '120px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.08)', overflow: 'hidden' }}>
            <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }} viewBox="0 0 400 120">
              <path d="M 30,80 Q 100,20 180,80 T 370,40" fill="none" stroke="rgba(37, 99, 235, 0.4)" strokeWidth="3" />
              <path d="M 30,80 Q 100,20 180,80 T 370,40" fill="none" stroke="#2563EB" strokeWidth="3" strokeDasharray="8, 6" />
              <circle cx="30" cy="80" r="6" fill="#10B981" />
              <circle cx="180" cy="80" r="6" fill="#F59E0B" />
              <circle cx="370" cy="40" r="6" fill="#2563EB" />
            </svg>
          </div>
        </div>

        <div className="login-page__ill-footer">
          &copy; 2026 FleetFlow. All rights reserved.
        </div>
      </section>

      {/* Right side: Form container */}
      <section className="login-page__form-container" aria-labelledby="form-heading">
        <div className="login-page__panel">
          {/* Redesigned Minimal Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <div className="sidebar__logo-container" aria-hidden="true" style={{ width: '40px', height: '40px', borderRadius: '8px' }}>
              <svg className="sidebar__logo-svg" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ width: '22px', height: '22px' }}>
                <path d="M8 20a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0-3h16M24 18a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
              </svg>
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: '800', lineHeight: 1.1, color: 'var(--text-main)' }}>FleetFlow</h1>
              <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fleet Management Platform</p>
            </div>
          </div>

          <header className="login-page__header">
            <h2 className="login-page__title" id="form-heading">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="login-page__subtitle">
              {isLogin
                ? 'Sign in to access your administrative operations dashboard.'
                : 'Register a new administrative or operations user account.'}
            </p>
          </header>

          {/* Success messages */}
          {successMsg && (
            <div className="badge badge--success" style={{ display: 'flex', width: '100%', padding: '12px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', gap: '8px' }}>
              <span>✓</span>
              {successMsg}
            </div>
          )}

          {/* Error messages */}
          {error && (
            <div className="login-form__error" role="alert">
              <AlertCircle className="toast-icon" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Full Name field (Register only) */}
            {!isLogin && (
              <div className="login-form__field">
                <label className="login-form__label" htmlFor="name">
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94A3B8' }} />
                  <input
                    className="login-form__input"
                    style={{ paddingLeft: '40px' }}
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    aria-invalid={Boolean(fieldErrors.name)}
                    aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.name && (
                  <p className="login-form__fieldError" id="name-error" role="alert">
                    {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Address field */}
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="email">
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94A3B8' }} />
                <input
                  className="login-form__input"
                  style={{ paddingLeft: '40px' }}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="admin@fleetflow.com"
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                  required
                />
              </div>
              {fieldErrors.email && (
                <p className="login-form__fieldError" id="email-error" role="alert">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password field */}
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="password">
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94A3B8' }} />
                <input
                  className="login-form__input"
                  style={{ paddingLeft: '40px' }}
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                  required
                />
              </div>
              {fieldErrors.password && (
                <p className="login-form__fieldError" id="password-error" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Role select field (Register only) */}
            {!isLogin && (
              <div className="login-form__field">
                <label className="login-form__label" htmlFor="role">
                  System Authorization Role
                </label>
                <div style={{ position: 'relative' }}>
                  <Shield style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', width: '16px', height: '16px', color: '#94A3B8' }} />
                  <select
                    className="form-select"
                    style={{ paddingLeft: '40px' }}
                    id="role"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Fleet Manager">Fleet Manager</option>
                    <option value="Dispatcher">Dispatcher</option>
                    <option value="Driver">Driver</option>
                  </select>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button className="login-form__button" type="submit" disabled={loading} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
              <span>{loading ? (isLogin ? 'Authenticating...' : 'Registering Account...') : (isLogin ? 'Sign In' : 'Register Account')}</span>
              {!loading && <ArrowRight style={{ width: '16px', height: '16px' }} />}
            </button>
          </form>

          {/* Form switch footer */}
          <footer style={{ marginTop: '24px', textAlign: 'center', fontSize: '13px', color: 'var(--text-secondary)' }}>
            {isLogin ? (
              <>
                New to the platform?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false)
                    setError('')
                    setFieldErrors({})
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true)
                    setError('')
                    setFieldErrors({})
                  }}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                >
                  Sign in instead
                </button>
              </>
            )}
          </footer>
        </div>
      </section>
    </main>
  )
}