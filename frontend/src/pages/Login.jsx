import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService, getApiErrorMessage, setAuthToken, setStoredUser } from '../services/api'
import { decodeToken } from '../utils/jwt'

export default function Login() {
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
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
    }
    if (!formData.password.trim()) {
      nextFieldErrors.password = 'Password is required.'
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
            setStoredUser({
              name: decoded.sub.split('@')[0],
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
        await authService.register({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
          role: formData.role,
        })
        setSuccessMsg('Registration successful! Please sign in.')
        setIsLogin(true)
        setFormData((current) => ({
          ...current,
          password: '',
        }))
      }
    } catch (apiError) {
      setError(getApiErrorMessage(apiError, isLogin ? 'Login failed.' : 'Registration failed.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-page__panel" aria-labelledby="login-title">
        <div className="login-page__brand" aria-hidden="true">
          FF
        </div>

        <header className="login-page__header">
          <p className="login-page__eyebrow">FleetFlow</p>
          <h1 className="login-page__title" id="login-title">
            {isLogin ? 'Sign In' : 'Create Account'}
          </h1>
          <p className="login-page__subtitle">
            {isLogin
              ? 'Sign in to manage drivers, vehicles, shipments, and operations.'
              : 'Register a new administrative or operations user account.'}
          </p>
        </header>

        {successMsg && (
          <div style={{
            backgroundColor: '#ecfdf5',
            border: '1px solid #d1fae5',
            color: '#065f46',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '20px'
          }} role="alert">
            {successMsg}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          {!isLogin && (
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="name">
                Full Name
              </label>
              <input
                className="login-form__input"
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                aria-invalid={Boolean(fieldErrors.name)}
                aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              />
              {fieldErrors.name && (
                <p className="login-form__fieldError" id="name-error" role="alert">
                  {fieldErrors.name}
                </p>
              )}
            </div>
          )}

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="email">
              Email Address
            </label>
            <input
              className="login-form__input"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@fleetflow.com"
              aria-invalid={Boolean(fieldErrors.email)}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <p className="login-form__fieldError" id="email-error" role="alert">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div className="login-form__field">
            <label className="login-form__label" htmlFor="password">
              Password
            </label>
            <input
              className="login-form__input"
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter password"
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <p className="login-form__fieldError" id="password-error" role="alert">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {!isLogin && (
            <div className="login-form__field">
              <label className="login-form__label" htmlFor="role">
                User Role
              </label>
              <select
                className="form-select"
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                style={{ padding: '10px 14px' }}
              >
                <option value="user">Standard User</option>
                <option value="admin">Administrator</option>
                <option value="manager">Operations Manager</option>
              </select>
            </div>
          )}

          {error && (
            <div className="login-form__error" role="alert">
              {error}
            </div>
          )}

          <button className="login-form__button" type="submit" disabled={loading}>
            {loading ? (isLogin ? 'Signing in...' : 'Registering...') : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem', color: '#64748b' }}>
          {isLogin ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false)
                  setError('')
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Register here
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
                }}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                Sign in instead
              </button>
            </>
          )}
        </div>
      </section>
    </main>
  )
}