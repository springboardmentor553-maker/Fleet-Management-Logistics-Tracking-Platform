import { useNavigate } from 'react-router-dom'
import { clearStoredAuth } from '../services/api'
import Card from '../components/Card'
import { 
  User, 
  Shield, 
  Truck, 
  Package, 
  Users, 
  Lock, 
  LogOut 
} from 'lucide-react'

export default function Profile() {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearStoredAuth()
    navigate('/login', { replace: true })
  }

  const storedUser = localStorage.getItem('fleetflow_user')
  let user = { name: 'Admin', email: 'admin@fleetflow.com', role: 'Fleet Manager' }
  if (storedUser) {
    try {
      user = JSON.parse(storedUser)
    } catch (e) {
      // ignore
    }
  }

  const responsibilities = [
    {
      role: 'Admin',
      desc: 'Manage users, assign roles, monitor the complete fleet system.',
      color: '#3B82F6',
      icon: Shield,
    },
    {
      role: 'Fleet Manager',
      desc: 'Manage vehicles, drivers, fleet operations and monitor performance.',
      color: '#10B981',
      icon: Truck,
    },
    {
      role: 'Dispatcher',
      desc: 'Create shipments, assign drivers and monitor deliveries.',
      color: '#F59E0B',
      icon: Package,
    },
    {
      role: 'Driver',
      desc: 'View assigned trips and update shipment status.',
      color: '#8B5CF6',
      icon: Users,
    },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', alignItems: 'start' }}>
      
      {/* Profile Card */}
      <Card title="User Account Profile">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '16px 0' }}>
          
          {/* Avatar Icon */}
          <div style={{
            width: '96px',
            height: '96px',
            borderRadius: '50%',
            backgroundColor: '#EFF6FF',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.12)',
            border: '2px solid #DBEAFE'
          }}>
            <User style={{ width: '48px', height: '48px' }} />
          </div>
          
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '4px' }}>{user.name}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '16px' }}>{user.email}</p>
          
          <div className="badge badge--success" style={{ padding: '6px 16px', fontWeight: '600', fontSize: '12px', marginBottom: '24px' }}>
            <span>{user.role}</span>
          </div>

          <div style={{ width: '100%', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '16px 0', marginBottom: '24px', display: 'flex', justifyContent: 'space-around' }}>
            <div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Account Status</span>
              <span className="badge badge--success" style={{ padding: '4px 8px', fontSize: '11px', marginTop: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }}></span>
                <span>Active</span>
              </span>
            </div>
            <div>
              <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Security Level</span>
              <span className="badge badge--secondary" style={{ padding: '4px 8px', fontSize: '11px', marginTop: '6px', display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
                <Lock style={{ width: '10px', height: '10px' }} />
                <span>Verified</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn--danger"
            onClick={handleLogout}
            style={{ width: '100%' }}
          >
            <LogOut style={{ width: '16px', height: '16px' }} />
            <span>Sign Out</span>
          </button>
        </div>
      </Card>

      {/* Role Responsibilities Card */}
      <Card title="System Roles & Responsibilities">
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', marginBottom: '20px', lineHeight: '1.6' }}>
          This system is configured with 4 key operational roles. Depending on your assigned profile, your operational scopes are detailed below:
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {responsibilities.map((r) => {
            const isUserRole = user.role?.toLowerCase() === r.role.toLowerCase()
            const IconComp = r.icon
            return (
              <div
                key={r.role}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-lg)',
                  border: isUserRole ? `2px solid ${r.color}` : '1px solid var(--border-color)',
                  backgroundColor: isUserRole ? `${r.color}08` : 'var(--bg-card)',
                  transition: 'all 0.15s ease',
                  position: 'relative'
                }}
              >
                {isUserRole && (
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    backgroundColor: r.color,
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: '700',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Your Role
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: `${r.color}15`,
                    color: r.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <IconComp style={{ width: '16px', height: '16px' }} />
                  </div>
                  <h4 style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-main)' }}>{r.role}</h4>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: '1.5', margin: 0 }}>{r.desc}</p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}