import AddShipmentModal from '../components/AddShipmentModal'
import { useState } from 'react'
import { Package } from 'lucide-react'
import { canEdit } from '../utils/permissions'

const TABS = ['All', 'Created', 'Assigned', 'In Transit', 'Delayed', 'Delivered', 'Cancelled']
const tabToStatus = (tab) => tab.toLowerCase().replace(' ', '_')

// Helper function to map raw backend status strings to valid App.css style tokens
const getStatusBadgeClass = (statusString) => {
  if (!statusString) return 'in_use';
  const cleanStatus = statusString.toLowerCase().replace('_', ' ').trim();

  // Mapping to green token configurations
  if (cleanStatus === 'delivered') return 'delivered';
  
  // Mapping to violet/blue token configurations
  if (cleanStatus === 'in transit' || cleanStatus === 'assigned') return 'in_use';
  
  // Mapping to amber/red token configurations
  if (cleanStatus === 'delayed' || cleanStatus === 'cancelled') return 'maintenance';
  
  // Mapping to grey/inactive token configurations
  if (cleanStatus === 'created') return 'inactive';

  return 'in_use';
};

const Shipments = ({ shipments = [], vehicles = [], drivers = [], loading, search, onShipmentAdded }) => {
  const [activeTab, setActiveTab] = useState('All')
  const [showModal, setShowModal] = useState(false)

  const filteredShipments = (shipments || []).filter(s => {
    const matchesSearch =
      (s.tracking_id && s.tracking_id.toLowerCase().includes(search.toLowerCase())) ||
      (s.origin && s.origin.toLowerCase().includes(search.toLowerCase())) ||
      (s.destination && s.destination.toLowerCase().includes(search.toLowerCase()))
    const matchesTab = activeTab === 'All' || s.status === tabToStatus(activeTab)
    return matchesSearch && matchesTab
  })

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
                    {/* Applied central dynamic wrapper function to map exact theme background tokens */}
                    <span className={`ff-badge status-${getStatusBadgeClass(s.status)}`}>
                      {s.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td data-label="" style={{ textAlign: 'right' }}>
                    <button className="ff-btn-track" onClick={() => alert(`Tracking ${s.tracking_id} — map coming soon`)}>
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
    </div>
  )
}

export default Shipments