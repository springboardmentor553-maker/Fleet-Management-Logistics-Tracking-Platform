import { useState } from 'react'
import { Package } from 'lucide-react'
import { canEdit } from '../utils/permissions'
import { getStatusBadgeClass } from '../utils/statusBadge'
import AddShipmentModal from '../components/AddShipmentModal'
import ShipmentTrackingPanel from '../components/ShipmentTrackingPanel'
import api from '../api/axios'

const TABS = ['All', 'Created', 'Assigned', 'Picked Up', 'In Transit', 'Out for Delivery', 'Delayed', 'Delivered', 'Cancelled']
const tabToStatus = (tab) => tab.toLowerCase().replace(/\s+/g, '_')

const Shipments = ({ shipments = [], vehicles = [], drivers = [], loading, search, onShipmentAdded, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('All')
  const [showModal, setShowModal] = useState(false)
  const [trackingShipment, setTrackingShipment] = useState(null)

  const filteredShipments = (shipments || []).filter(s => {
    const matchesSearch =
      (s.tracking_id && s.tracking_id.toLowerCase().includes(search.toLowerCase())) ||
      (s.origin && s.origin.toLowerCase().includes(search.toLowerCase())) ||
      (s.destination && s.destination.toLowerCase().includes(search.toLowerCase()))
    const matchesTab = activeTab === 'All' || s.status === tabToStatus(activeTab)
    return matchesSearch && matchesTab
  })

  const handleStatusChange = async (shipmentId, newStatus) => {
    try {
      const res = await api.put(`/shipments/${shipmentId}/status`, { status: newStatus })
      if (onStatusUpdate) onStatusUpdate(res.data)
    } catch (err) {
      alert('Failed to update status')
    }
  }

  return (
    <div className="ff-section">
      <div className="ff-page-header">
        <div>
          <div className="ff-section-title"><Package size={16} /><span>Shipments</span></div>
          <p className="ff-page-subtitle">Track and manage all shipment deliveries</p>
        </div>
        {canEdit() && (
          <button className="ff-btn-primary" onClick={() => setShowModal(true)}>
            + New Shipment
          </button>
        )}
      </div>

      <div className="ff-tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`ff-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="ff-table-wrap">
        <table className="ff-table">
          <thead>
            <tr>
              <th>Tracking ID</th><th>Origin</th><th>Destination</th><th>Vehicle</th><th>Driver</th><th>Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.length === 0 && !loading && (
              <tr className="ff-empty-row"><td colSpan="7">No shipments match your search</td></tr>
            )}
            {filteredShipments.map(s => {
              const vehicle = vehicles.find(v => v.id === s.vehicle_id)
              const driver = drivers.find(d => d.id === s.driver_id)
              return (
                <tr key={s.id}>
                  <td className="ff-reg-cell" data-label="Tracking ID">{s.tracking_id}</td>
                  <td data-label="Origin">{s.origin}</td>
                  <td data-label="Destination">{s.destination}</td>
                  <td data-label="Vehicle">{vehicle?.registration_number || '—'}</td>
                  <td data-label="Driver">{driver?.name || '—'}</td>
                  <td data-label="Status">
                    {canEdit() ? (
                      <select
                        className={`ff-status-select status-${s.status.toLowerCase().replace(/\s+/g, '_')}`}
                        value={s.status}
                        onChange={(e) => handleStatusChange(s.id, e.target.value)}
                      >
                        <option value="created">Created</option>
                        <option value="assigned">Assigned</option>
                        <option value="picked_up">Picked Up</option>
                        <option value="in_transit">In Transit</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delayed">Delayed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`ff-badge status-${getStatusBadgeClass(s.status)}`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    )}
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    <button className="ff-btn-track" onClick={() => setTrackingShipment(s)}>
                      Track
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {showModal && (
        <AddShipmentModal
          vehicles={vehicles}
          drivers={drivers}
          onClose={() => setShowModal(false)}
          onSuccess={(newShipment) => onShipmentAdded(newShipment)}
        />
      )}

      {trackingShipment && (
        <ShipmentTrackingPanel
          shipment={trackingShipment}
          vehicle={vehicles.find(v => v.id === trackingShipment.vehicle_id)}
          driver={drivers.find(d => d.id === trackingShipment.driver_id)}
          onClose={() => setTrackingShipment(null)}
        />
      )}
    </div>
  )
}

export default Shipments