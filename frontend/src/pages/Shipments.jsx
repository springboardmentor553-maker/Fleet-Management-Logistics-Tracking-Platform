import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function Shipments() {
  const { user } = useAuth();
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals & Forms display states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editShipment, setEditShipment] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [completeConfirmId, setCompleteConfirmId] = useState(null);
  const [selectedHistoryShipment, setSelectedHistoryShipment] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form value states
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [status, setStatus] = useState("Pending");
  const [submitting, setSubmitting] = useState(false);

  const fetchShipmentsAndCarriers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const shipmentsRes = await api.get("/shipments/");
      setShipments(shipmentsRes.data);

      // Load drivers & vehicles in order to populate option selectors
      const driversRes = await api.get("/drivers/");
      setDrivers(driversRes.data);

      const vehiclesRes = await api.get("/vehicles/");
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to retrieve shipments and carrier records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShipmentsAndCarriers();
  }, []);

  // Filter lists for assigning to NEW shipments
  // New assignment requires AVAILABLE driver/vehicle or the currently assigned one (if editing)
  const getAssignableDrivers = () => {
    if (editShipment) {
      return drivers.filter(
        (d) => d.status === "Available" || d.id === editShipment.driver_id
      );
    }
    return drivers.filter((d) => d.status === "Available");
  };

  const getAssignableVehicles = () => {
    if (editShipment) {
      return vehicles.filter(
        (v) => v.status === "Available" || v.id === editShipment.vehicle_id
      );
    }
    return vehicles.filter((v) => v.status === "Available");
  };

  const openAddForm = () => {
    setSource("");
    setDestination("");
    setDriverId("");
    setVehicleId("");
    setStatus("Pending");
    setEditShipment(null);
    setShowAddForm(true);
  };

  const openEditForm = (shipment) => {
    setSource(shipment.source);
    setDestination(shipment.destination);
    setDriverId(shipment.driver_id.toString());
    setVehicleId(shipment.vehicle_id.toString());
    setStatus(shipment.status);
    setEditShipment(shipment);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!source || !destination || !driverId || !vehicleId) {
      alert("Please fill in all details and select assignments.");
      return;
    }

    setSubmitting(true);
    try {
      if (editShipment) {
        // Edit PUT /{shipment_id}
        await api.put(`/shipments/${editShipment.id}`, {
          source,
          destination,
          status,
          driver_id: parseInt(driverId),
          vehicle_id: parseInt(vehicleId),
        });
        alert("Shipment updated successfully!");
      } else {
        // Create POST /
        await api.post("/shipments/", {
          source,
          destination,
          driver_id: parseInt(driverId),
          vehicle_id: parseInt(vehicleId),
        });
        alert("Shipment scheduled successfully!");
      }
      setShowAddForm(false);
      setEditShipment(null);
      fetchShipmentsAndCarriers();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Operation failed.";
      alert(`Error: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteShipment = async () => {
    if (!completeConfirmId) return;
    try {
      await api.put(`/shipments/${completeConfirmId}/complete`);
      alert("Shipment marked completed and assets returned details updated!");
      setCompleteConfirmId(null);
      fetchShipmentsAndCarriers();
    } catch (err) {
      console.error(err);
      alert("Failed to complete shipment.");
    }
  };

  const handleDeleteShipment = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/shipments/${deleteConfirmId}`);
      alert("Shipment deleted successfully!");
      setDeleteConfirmId(null);
      fetchShipmentsAndCarriers();
    } catch (err) {
      console.error(err);
      alert("Failed to delete shipment. Action requires Admin role.");
    }
  };

  const viewHistory = async (shipment) => {
    setSelectedHistoryShipment(shipment);
    setLoadingHistory(true);
    setHistoryLogs([]);
    try {
      const res = await api.get(`/shipments/${shipment.id}/history`);
      if (Array.isArray(res.data)) {
        setHistoryLogs(res.data);
      } else {
        setHistoryLogs([]);
      }
    } catch (err) {
      console.error("Failed to load shipment history state", err);
      setHistoryLogs([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const getDriverName = (id) => {
    const d = drivers.find((drv) => drv.id === id);
    return d ? d.name : `Driver #${id}`;
  };

  const getVehicleNumber = (id) => {
    const v = vehicles.find((vh) => vh.id === id);
    return v ? v.vehicle_number : `Vehicle #${id}`;
  };

  const isManagementAllowed = ["Admin", "Fleet Manager"].includes(user?.role);
  const isAdmin = user?.role === "Admin";

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container shipments-page">
      <div className="page-header">
        <div>
          <h2>Shipments Registry</h2>
          <p className="page-subtitle">Schedule, assign, and track shipping tasks</p>
        </div>
        {isManagementAllowed && (
          <button className="btn btn-primary" onClick={openAddForm}>
            ➕ Schedule Shipment
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {/* Scheduling Shipment form drawer */}
      {showAddForm && (
        <div className="form-card">
          <h3>{editShipment ? `Edit Shipment #${editShipment.id}` : "Schedule Shipment"}</h3>
          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group">
              <label>Source Location</label>
              <input
                type="text"
                placeholder="e.g. Philadelphia Warehouse, PA"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Destination Location</label>
              <input
                type="text"
                placeholder="e.g. Boston Distribution Center, MA"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Assign Driver</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                required
              >
                <option value="">-- Choose Driver --</option>
                {getAssignableDrivers().map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.phone})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assign Vehicle</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
              >
                <option value="">-- Choose Vehicle --</option>
                {getAssignableVehicles().map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} - {v.vehicle_type} ({v.capacity} Tons)
                  </option>
                ))}
              </select>
            </div>
            {editShipment && (
              <div className="form-group">
                <label>Operational Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Pending">Pending</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            )}
            <div className="form-actions span-grid">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditShipment(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Submitting..." : "Schedule Order"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Shipment registry list table */}
      <div className="table-card">
        <h3>Dispatch Ledger ({shipments.length})</h3>
        {shipments.length === 0 ? (
          <p className="empty-state">No shipments scheduled in the registry.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Driver</th>
                  <th>Vehicle Plate</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((shipment) => (
                  <tr key={shipment.id}>
                    <td>#{shipment.id}</td>
                    <td>{shipment.source}</td>
                    <td>{shipment.destination}</td>
                    <td>{getDriverName(shipment.driver_id)}</td>
                    <td>{getVehicleNumber(shipment.vehicle_id)}</td>
                    <td>
                      <span className={`badge badge-${shipment.status.toLowerCase().replace(" ", "-")}`}>
                        {shipment.status}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => viewHistory(shipment)}
                        >
                          📜 Logs
                        </button>
                        {isManagementAllowed && shipment.status !== "Completed" && (
                          <>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => openEditForm(shipment)}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => setCompleteConfirmId(shipment.id)}
                            >
                              ✓ Complete
                            </button>
                          </>
                        )}
                        {isAdmin && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirmId(shipment.id)}
                          >
                            🗑 Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* History Drawer Modal */}
      {selectedHistoryShipment && (
        <div className="modal-overlay">
          <div className="modal-dialog history-modal">
            <div className="modal-header">
              <h3>Tracking Logs: Shipment #{selectedHistoryShipment.id}</h3>
              <button className="close-btn" onClick={() => setSelectedHistoryShipment(null)}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {loadingHistory ? (
                <div style={{ textAlign: "center", padding: "20px" }}>Loading logs...</div>
              ) : historyLogs.length === 0 ? (
                <p className="empty-state">No status logs recorded for this shipment.</p>
              ) : (
                <div className="tracking-timeline">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="timeline-item">
                      <div className="timeline-badge">📍</div>
                      <div className="timeline-content">
                        <h4>Status: <span className={`badge badge-${log.status.toLowerCase().replace(" ", "-")}`}>{log.status}</span></h4>
                        <p className="timeline-time">Recorded Time ID: #{log.id}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedHistoryShipment(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete Shipment Confirmation */}
      <ConfirmationDialog
        isOpen={completeConfirmId !== null}
        title="Mark Shipment Completed"
        message="Marking this shipment completed will release the assigned vehicle and driver back into the pool as Available. Confirm operation?"
        confirmText="Yes, Complete"
        type="primary"
        onConfirm={handleCompleteShipment}
        onCancel={() => setCompleteConfirmId(null)}
      />

      {/* Delete Shipment Confirmation */}
      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Shipment"
        type="danger"
        message="Are you sure you want to permanently delete this shipment record from the log? This is a destructive action."
        onConfirm={handleDeleteShipment}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

export default Shipments;