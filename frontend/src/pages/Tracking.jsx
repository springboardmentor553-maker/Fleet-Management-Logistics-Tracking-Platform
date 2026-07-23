import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { shipmentService, getApiErrorMessage } from '../services/api'
import { Search, MapPin, Truck, User, Clock, AlertCircle } from 'lucide-react'

export default function Tracking() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialNum = searchParams.get('num') || ''
  
  const [trackingNumber, setTrackingNumber] = useState(initialNum)
  const [trackingData, setTrackingData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (initialNum.trim()) {
      handleTrack(initialNum.trim())
    }
  }, [initialNum])

  const handleTrack = async (numToSearch) => {
    const num = numToSearch || trackingNumber
    if (!num.trim()) {
      setError('Please enter a valid shipment tracking number.')
      return
    }

    try {
      setLoading(true)
      setError('')
      setTrackingData(null)
      
      const res = await shipmentService.getTrackingStatus(num.trim())
      setTrackingData(res.data)
      setSearchParams({ num: num.trim() })
    } catch (err) {
      setError(getApiErrorMessage(err, `No shipment found for tracking number "${num}". Please check and try again.`))
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    handleTrack()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      {/* Title Header */}
      <div style={{ textAlign: 'center' }}>
        <h1 className="page-title" style={{ fontSize: '28px' }}>Shipment Live Tracking</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '6px' }}>
          Track real-time cargo status, assigned fleet driver, vehicle registration, and estimated arrival time.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="card" style={{ padding: '24px' }}>
        <form onSubmit={onSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search style={{ position: 'absolute', top: '50%', left: '14px', transform: 'translateY(-50%)', width: '18px', height: '18px', color: '#94A3B8' }} />
            <input
              type="text"
              className="navbar__searchInput"
              style={{
                width: '100%',
                paddingLeft: '42px',
                height: '46px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-card)',
                color: 'var(--text-main)',
                fontSize: '15px'
              }}
              placeholder="Enter Tracking Number (e.g. FLT100001)..."
              value={trackingNumber}
              onChange={(e) => {
                setTrackingNumber(e.target.value)
                if (error) setError('')
              }}
              required
            />
          </div>
          <button type="submit" className="btn btn--primary" style={{ padding: '0 24px', height: '46px', fontSize: '14px' }} disabled={loading}>
            {loading ? 'Searching...' : 'Track Package'}
          </button>
        </form>
      </div>

      {/* Error Card */}
      {error && (
        <div className="error-card" style={{ padding: '20px' }}>
          <AlertCircle className="error-card__icon" />
          <h2 className="error-card__title" style={{ fontSize: '16px' }}>Tracking Lookup Failed</h2>
          <p className="error-card__desc">{error}</p>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div className="loading-container" style={{ minHeight: '30vh', flexDirection: 'column', gap: '12px' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Retrieving telemetry for #{trackingNumber}...</p>
        </div>
      )}

      {/* Tracking Results Card */}
      {trackingData && !loading && (
        <div className="card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', tracking: '0.05em', fontWeight: 600 }}>Tracking Number</span>
              <h2 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }}>{trackingData.tracking_number}</h2>
            </div>
            <div>
              <span className={`badge badge--${(trackingData.current_status || 'created').toLowerCase().replace(/\s+/g, '')}`} style={{ fontSize: '14px', padding: '6px 16px', borderRadius: '20px' }}>
                {trackingData.current_status || 'Unknown'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            {/* Origin */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Pickup Location</span>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{trackingData.pickup_location || 'N/A'}</p>
              </div>
            </div>

            {/* Destination */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF2F2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <MapPin style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Destination Hub</span>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{trackingData.destination || 'N/A'}</p>
              </div>
            </div>

            {/* Driver */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Assigned Driver</span>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{trackingData.driver_name || 'Unassigned'}</p>
              </div>
            </div>

            {/* Vehicle */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck style={{ width: '20px', height: '20px' }} />
              </div>
              <div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Vehicle Registration</span>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-main)', marginTop: '2px' }}>{trackingData.vehicle_registration_number || 'Unassigned'}</p>
              </div>
            </div>
          </div>

          {/* ETA Banner */}
          <div style={{
            backgroundColor: 'var(--bg-body)',
            padding: '16px 20px',
            borderRadius: '10px',
            border: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginTop: '8px'
          }}>
            <Clock style={{ width: '22px', height: '22px', color: 'var(--primary)', flexShrink: 0 }} />
            <div>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Estimated Time of Arrival (ETA)</span>
              <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                {trackingData.eta ? trackingData.eta : 'Pending route scheduling'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
