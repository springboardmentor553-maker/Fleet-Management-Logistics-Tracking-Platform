import { useState } from 'react'
import { User, Mail, Shield, Lock, Camera } from 'lucide-react'
import api from '../api/axios'
import { getCurrentUser } from '../utils/permissions'

const roleLabels = {
  admin: 'Administrator',
  fleet_manager: 'Fleet Manager',
  driver: 'Driver',
  dispatcher: 'Dispatcher',
}

export default function Profile() {
  const currentUser = getCurrentUser()
  const [name, setName] = useState(currentUser?.name || '')
  const [nameMsg, setNameMsg] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [photoUrl, setPhotoUrl] = useState(currentUser?.photo_url || null)

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setPhotoLoading(true)
    try {
        const res = await api.post('/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        })
        localStorage.setItem('user', JSON.stringify(res.data))
        setPhotoUrl(res.data.photo_url)
    } catch (err) {
        alert('Failed to upload photo')
    } finally {
        setPhotoLoading(false)
    }
}

  const [passwords, setPasswords] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [passMsg, setPassMsg] = useState('')
  const [passError, setPassError] = useState('')
  const [passLoading, setPassLoading] = useState(false)

  const initials = (n) => {
    if (!n) return '?'
    const parts = n.trim().split(' ')
    return parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase()
  }

  const handleNameUpdate = async (e) => {
    e.preventDefault()
    setNameLoading(true)
    setNameMsg('')
    try {
      const res = await api.put('/auth/me', { name })
      localStorage.setItem('user', JSON.stringify(res.data))
      setNameMsg('Name updated successfully!')
    } catch (err) {
      setNameMsg('Failed to update name')
    } finally {
      setNameLoading(false)
    }
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setPassError('')
    setPassMsg('')

  if (passwords.new_password !== passwords.confirm_password) {
    setPassError('New password and confirm password do not match')
    return
  }

  setPassLoading(true)
  try {
    await api.put('/auth/change-password', {
      current_password: passwords.current_password,
      new_password: passwords.new_password,
    })
    setPassMsg('Password changed successfully!')
    setPasswords({ current_password: '', new_password: '', confirm_password: '' })
  } catch (err) {
    setPassError(err.response?.data?.detail || 'Failed to change password')
  } finally {
    setPassLoading(false)
  }
}

  if (!currentUser) return null

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><User size={16} /><span>My Profile</span></div>
          <p className="ff-page-subtitle">Manage your account details and security</p>
        </div>
      </div>

      <div className="ff-profile-layout">
        {/* Profile summary card */}
        <div className="ff-profile-card">
          <div style={{ position: 'relative', width: 64, margin: '0 auto' }}>
            {photoUrl ? (
                <img
                    src={`http://127.0.0.1:8000${photoUrl}`}
                    alt="Profile"
                    style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }}
                />
            ) : (
                <div className="ff-avatar" style={{ width: 64, height: 64, fontSize: 22 }}>
                    {initials(currentUser.name)}
                </div>
            )}
            <label htmlFor="photo-upload" style={{
                position: 'absolute', bottom: -2, right: -2, background: 'var(--accent)',
                borderRadius: '50%', width: 24, height: 24, display: 'flex',
                alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid var(--bg)'
            }}>
                <Camera size={12} color="#fff" />
            </label>
            <input id="photo-upload" type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
        </div>
        {photoLoading && <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>Uploading...</p>}
          <h3 style={{ textAlign: 'center', margin: '12px 0 4px' }}>{currentUser.name}</h3>
          <p style={{ textAlign: 'center', fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
            {roleLabels[currentUser.role] || currentUser.role}
          </p>

          <div className="ff-profile-detail-row">
            <Mail size={14} />
            <span>{currentUser.email}</span>
          </div>
          <div className="ff-profile-detail-row">
            <Shield size={14} />
            <span className={`ff-badge status-active`}>{roleLabels[currentUser.role] || currentUser.role}</span>
          </div>
        </div>

        {/* Edit forms */}
        <div className="ff-profile-forms">
          <div className="ff-widget-card">
            <div className="ff-widget-title"><span>Edit Name</span></div>
            <form onSubmit={handleNameUpdate} className="ff-modal-form">
              {nameMsg && <div className={nameMsg.includes('success') ? 'ff-modal-success' : 'ff-modal-error'}>{nameMsg}</div>}
              <label>Full Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required />
              <button type="submit" className="ff-btn-primary" disabled={nameLoading} style={{ marginTop: 10, width: 'fit-content' }}>
                {nameLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>

          <div className="ff-widget-card" style={{ marginTop: 16 }}>
            <div className="ff-widget-title"><span><Lock size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Change Password</span></div>
            <form onSubmit={handlePasswordChange} className="ff-modal-form">
              {passError && <div className="ff-modal-error">{passError}</div>}
              {passMsg && <div className="ff-modal-success">{passMsg}</div>}
              <label>Current Password</label>
              <input type="password" value={passwords.current_password}
                onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required />
              <label>New Password</label>
              <input type="password" value={passwords.new_password} minLength={6}
                onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} required />
              <label>Confirm New Password</label>
              <input type="password" value={passwords.confirm_password} minLength={6}
                onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })} required />
              <button type="submit" className="ff-btn-primary" disabled={passLoading} style={{ marginTop: 10, width: 'fit-content' }}>
                {passLoading ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}