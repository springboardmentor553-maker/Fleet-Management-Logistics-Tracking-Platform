import { useNavigate } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react'
import { getStoredUser } from '../services/api'

export default function AccessDenied() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const role = user?.role || 'Guest'

  const handleGoBack = () => {
    if (role === 'Admin' || role === 'Fleet Manager') {
      navigate('/dashboard', { replace: true })
    } else if (role === 'Dispatcher') {
      navigate('/shipments', { replace: true })
    } else if (role === 'Driver') {
      navigate('/trips', { replace: true })
    } else {
      navigate('/login', { replace: true })
    }
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '20px',
    }}>
      <div className="card" style={{
        maxWidth: '480px',
        width: '100%',
        padding: '40px',
        textAlign: 'center',
        boxShadow: 'var(--shadow-xl)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          backgroundColor: '#FEF2F2',
          color: '#EF4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.15)',
          border: '2px solid #FEE2E2'
        }}>
          <ShieldAlert style={{ width: '36px', height: '36px' }} />
        </div>

        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '800',
            color: 'var(--text-main)',
            marginBottom: '8px'
          }}>
            Access Denied
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            lineHeight: '1.6'
          }}>
            You do not have the necessary system authorization to view this section. 
            This resource is restricted to other operational roles.
          </p>
        </div>

        <div style={{
          fontSize: '12px',
          color: 'var(--text-secondary)',
          backgroundColor: 'var(--bg-body)',
          padding: '8px 16px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          fontWeight: 500,
          width: '100%',
          boxSizing: 'border-box'
        }}>
          Current Role: <span className="badge badge--danger" style={{ display: 'inline-block', marginLeft: '6px' }}>{role}</span>
        </div>

        <div style={{ display: 'flex', gap: '12px', width: '100%' }}>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => navigate(-1)}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>Go Back</span>
          </button>
          
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleGoBack}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Home style={{ width: '16px', height: '16px' }} />
            <span>Home Workspace</span>
          </button>
        </div>
      </div>
    </div>
  )
}
