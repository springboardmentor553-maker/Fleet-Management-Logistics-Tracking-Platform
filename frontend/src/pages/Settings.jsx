import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings as SettingsIcon, Sun, Moon, Bell, User, Lock, Building2, Trash2, Mail, Users as UsersIcon } from 'lucide-react'
import { getNotificationPreferences, setNotificationPreferences } from '../utils/notifications'
import { isAdmin, getCurrentUser } from '../utils/permissions'
import api from '../api/axios'

export default function Settings({ darkMode, setDarkMode }) {
  const navigate = useNavigate()
  const currentUser = getCurrentUser()
  const [prefs, setPrefs] = useState(getNotificationPreferences())

  const [emailFrequency, setEmailFrequency] = useState(currentUser?.notification_frequency || 'instant')
  const [freqSaving, setFreqSaving] = useState(false)
  const [freqMsg, setFreqMsg] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [logoUrl, setLogoUrl] = useState(null)
  const [companyMsg, setCompanyMsg] = useState('')
  const [logoUploading, setLogoUploading] = useState(false)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const togglePref = (key) => {
    const updated = { ...prefs, [key]: !prefs[key] }
    setPrefs(updated)
    setNotificationPreferences(updated)
  }

  useEffect(() => {
    if (isAdmin()) {
      api.get('/company/').then(res => {
        setCompanyName(res.data.company_name)
        setLogoUrl(res.data.logo_url)
      }).catch(() => {})
    }
  }, [])

  const handleFrequencyChange = async (value) => {
    setEmailFrequency(value)
    setFreqSaving(true)
    setFreqMsg('')
    try {
      const res = await api.put('/auth/notification-frequency', { frequency: value })
      localStorage.setItem('user', JSON.stringify(res.data))
      setFreqMsg('Saved!')
      setTimeout(() => setFreqMsg(''), 2000)
    } catch (err) {
      setFreqMsg('Failed to save')
    } finally {
      setFreqSaving(false)
    }
  }

  const handleCompanySave = async () => {
    setCompanyMsg('')
    try {
      await api.put('/company/', { company_name: companyName })
      setCompanyMsg('Company name updated!')
      setTimeout(() => setCompanyMsg(''), 2000)
    } catch (err) {
      setCompanyMsg('Failed to update')
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    setLogoUploading(true)
    try {
      const res = await api.post('/company/logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      setLogoUrl(res.data.logo_url)
    } catch (err) {
      alert('Failed to upload logo')
    } finally {
      setLogoUploading(false)
    }
  }

  const handleDeleteAccount = async (e) => {
    e.preventDefault()
    setDeleteError('')
    setDeleting(true)
    try {
      await api.delete('/auth/me', { data: { password: deletePassword } })
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      navigate('/login')
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><SettingsIcon size={16} /><span>Settings</span></div>
          <p className="ff-page-subtitle">Manage your app preferences</p>
        </div>
      </div>

      {/* Appearance */}
      <div className="ff-widget-card" style={{ marginBottom: 16 }}>
        <div className="ff-widget-title"><span>Appearance</span></div>
        <div className="ff-settings-row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Dark Mode</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Toggle the app's color theme</div>
          </div>
          <button className="ff-toggle-btn" onClick={() => setDarkMode(!darkMode)}>
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="ff-widget-card" style={{ marginBottom: 16 }}>
        <div className="ff-widget-title"><span><Bell size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Notification Preferences</span></div>

        <div className="ff-settings-row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Shipment Updates</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Show shipment activity in notifications</div>
          </div>
          <label className="ff-switch">
            <input type="checkbox" checked={prefs.showShipments} onChange={() => togglePref('showShipments')} />
            <span className="ff-switch-slider" />
          </label>
        </div>

        <div className="ff-settings-row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Trip Updates</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Show trip scheduling activity in notifications</div>
          </div>
          <label className="ff-switch">
            <input type="checkbox" checked={prefs.showTrips} onChange={() => togglePref('showTrips')} />
            <span className="ff-switch-slider" />
          </label>
        </div>
      </div>

      {/* Email Notification Frequency */}
      <div className="ff-widget-card" style={{ marginBottom: 16 }}>
        <div className="ff-widget-title"><span><Mail size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Email Notifications</span></div>
        <div className="ff-settings-row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Email Frequency</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>How often you receive email digests</div>
          </div>
          <select className="ff-select" value={emailFrequency} onChange={(e) => handleFrequencyChange(e.target.value)} disabled={freqSaving}>
            <option value="instant">Instant</option>
            <option value="daily">Daily Digest</option>
            <option value="off">Off</option>
          </select>
        </div>
        {freqMsg && <p style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 4 }}>{freqMsg}</p>}
        <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, fontStyle: 'italic' }}>
          Preference is saved to your account. Automatic digest emails require a scheduled background job, which is planned for a future milestone.
        </p>
      </div>

      {/* Company Settings — Admin only */}
      {isAdmin() && (
        <div className="ff-widget-card" style={{ marginBottom: 16 }}>
          <div className="ff-widget-title"><span><Building2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Company Settings</span></div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            {logoUrl ? (
              <img src={`http://127.0.0.1:8000${logoUrl}`} alt="Company logo" style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover' }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 10, background: 'var(--cyan-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={22} color="var(--accent)" />
              </div>
            )}
            <label className="ff-btn-primary" style={{ cursor: 'pointer' }}>
              {logoUploading ? 'Uploading...' : 'Upload Logo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoUpload} style={{ display: 'none' }} />
            </label>
          </div>

          <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 5, display: 'block' }}>Company Name</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px',
              borderRadius: 8,
              border: '1px solid var(--border)',
              marginBottom: 10,
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              fontSize: 14,
              outline: 'none',
            }}
          />
          <button className="ff-btn-primary" onClick={handleCompanySave}>Save Company Name</button>
          {companyMsg && <p style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 8 }}>{companyMsg}</p>}
        </div>
      )}

      {/* Users & Roles — Admin only */}
      {isAdmin() && (
        <div className="ff-widget-card" style={{ marginBottom: 16 }}>
          <div className="ff-widget-title"><span><UsersIcon size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Users & Roles</span></div>
          <div className="ff-settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/users')}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Manage Users</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>View and change user roles</div>
            </div>
          </div>
        </div>
      )}

      {/* Account */}
      <div className="ff-widget-card" style={{ marginBottom: 16 }}>
        <div className="ff-widget-title"><span>Account</span></div>

        <div className="ff-settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <User size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Edit Profile</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your name and photo</div>
            </div>
          </div>
        </div>

        <div className="ff-settings-row" style={{ cursor: 'pointer' }} onClick={() => navigate('/profile')}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Lock size={16} style={{ color: 'var(--text-muted)' }} />
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>Change Password</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Update your account password</div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="ff-widget-card" style={{ border: '1px solid var(--red)' }}>
        <div className="ff-widget-title"><span style={{ color: 'var(--red)' }}><Trash2 size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Danger Zone</span></div>
        <div className="ff-settings-row">
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Delete Account</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Permanently delete your account. This cannot be undone.</div>
          </div>
          <button className="ff-btn-primary" style={{ background: 'var(--red)' }} onClick={() => setShowDeleteModal(true)}>
            Delete Account
          </button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="ff-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="ff-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ff-modal-header">
              <h3>Delete Account</h3>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14 }}>
              This action is permanent. Enter your password to confirm.
            </p>
            {deleteError && <div className="ff-modal-error">{deleteError}</div>}
            <form onSubmit={handleDeleteAccount} className="ff-modal-form">
              <label>Password</label>
              <input type="password" value={deletePassword} onChange={(e) => setDeletePassword(e.target.value)} required />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button type="button" className="ff-btn-primary" style={{ background: 'var(--border)', color: 'var(--text-primary)', flex: 1, justifyContent: 'center' }} onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="ff-btn-primary" style={{ background: 'var(--red)', flex: 1, justifyContent: 'center' }} disabled={deleting}>
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}