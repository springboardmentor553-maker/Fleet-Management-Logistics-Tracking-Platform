import { X, MapPin, Truck as TruckIcon } from 'lucide-react'
import ShipmentTrackMap from './ShipmentTrackMap'

export default function ShipmentTrackModal({ shipment, vehicle, driver, onClose }) {
  return (
    <div className="ff-modal-overlay" onClick={onClose}>
      <div className="ff-modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="ff-modal-header">
          <h3>Tracking {shipment.tracking_id}</h3>
          <X size={18} style={{ cursor: 'pointer' }} onClick={onClose} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginBottom: 12, color: 'var(--text-secondary)' }}>
          <MapPin size={14} /> {shipment.origin} <span style={{ color: 'var(--text-muted)' }}>&rarr;</span> {shipment.destination}
          <span className={`ff-badge status-${shipment.status}`} style={{ marginLeft: 'auto' }}>{shipment.status.replace('_', ' ')}</span>
        </div>

        <ShipmentTrackMap shipment={shipment} vehicle={vehicle} />

        <div style={{ marginTop: 12, fontSize: 12.5, color: 'var(--text-secondary)' }}>
          {vehicle ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <TruckIcon size={13} /> {vehicle.registration_number} {driver ? `• ${driver.name}` : ''}
            </div>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>No vehicle assigned yet</span>
          )}
        </div>
      </div>
    </div>
  )
}