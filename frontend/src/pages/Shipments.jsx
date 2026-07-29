import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function Shipments() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [shipments, setShipments] = useState([]);
  const [trips, setTrips] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Scheduling Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingShipment, setSchedulingShipment] = useState(null);
  const [schedulingTrip, setSchedulingTrip] = useState(null);
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [tripStatus, setTripStatus] = useState("Scheduled");
  const [schedDriverId, setSchedDriverId] = useState("");
  const [schedVehicleId, setSchedVehicleId] = useState("");

  const getValidTransitions = (currentStatus) => {
    const transitions = {
      "Created": ["Assigned", "Cancelled"],
      "Assigned": ["In Transit", "Cancelled"],
      "In Transit": ["Delayed", "Delivered", "Cancelled"],
      "Delayed": ["In Transit", "Delivered", "Cancelled"],
      "Delivered": [],
      "Cancelled": []
    };
    return transitions[currentStatus] || [];
  };

  const handleStatusChange = async (shipmentId, newStatus) => {
    setUpdatingStatusId(shipmentId);
    setErrorMsg("");
    setSuccessMsg("");
    try {
      const res = await api.put(`/shipments/${shipmentId}/status`, { status: newStatus });
      // Reload matching dataset
      await fetchShipmentsAndCarriers();
      setSuccessMsg(res.data.message || "Shipment status updated successfully.");
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Could not update status.";
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(""), 5000);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openScheduleModal = (shipment, trip = null) => {
    setSchedulingShipment(shipment);
    setSchedulingTrip(trip);
    setSchedDriverId(shipment.driver_id ? shipment.driver_id.toString() : "");
    setSchedVehicleId(shipment.vehicle_id ? shipment.vehicle_id.toString() : "");
    if (trip) {
      setScheduledStart(trip.scheduled_start ? trip.scheduled_start.substring(0, 16) : "");
      setScheduledEnd(trip.scheduled_end ? trip.scheduled_end.substring(0, 16) : "");
      setTripStatus(trip.status);
    } else {
      setScheduledStart("");
      setScheduledEnd("");
      setTripStatus("Scheduled");
    }
    setShowScheduleModal(true);
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!scheduledStart || !scheduledEnd || !schedDriverId || !schedVehicleId) {
      alert("Please complete all scheduling parameters.");
      return;
    }

    setSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload = {
        shipment_id: schedulingShipment.id,
        driver_id: parseInt(schedDriverId),
        vehicle_id: parseInt(schedVehicleId),
        pickup_location: schedulingShipment.source,
        destination: schedulingShipment.destination,
        scheduled_start: new Date(scheduledStart).toISOString(),
        scheduled_end: new Date(scheduledEnd).toISOString(),
        status: tripStatus
      };

      if (schedulingTrip) {
        await api.put(`/trips/${schedulingTrip.id}`, payload);
        setSuccessMsg("Trip schedule updated successfully!");
      } else {
        await api.post("/trips/", payload);
        setSuccessMsg("Trip scheduled successfully!");
      }

      setShowScheduleModal(false);
      setSchedulingShipment(null);
      setSchedulingTrip(null);
      await fetchShipmentsAndCarriers();
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Scheduling conflict or validation error occurred.";
      setErrorMsg(detail);
      setTimeout(() => setErrorMsg(""), 6000);
    } finally {
      setSubmitting(false);
    }
  };

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
  const [status, setStatus] = useState("Created");
  const [submitting, setSubmitting] = useState(false);

  const fetchShipmentsAndCarriers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const shipmentsRes = await api.get("/shipments/");
      setShipments(shipmentsRes.data);

      const tripsRes = await api.get("/trips/");
      setTrips(tripsRes.data);

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

      {successMsg && (
        <div className="success-banner" style={{
          padding: "12px 16px",
          backgroundColor: "var(--success-bg)",
          border: "1px solid var(--success)",
          color: "var(--success)",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontWeight: 500
        }}>
          <span>✓</span> {successMsg}
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
                  <option value="Created">Created</option>
                  <option value="Assigned">Assigned</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delayed">Delayed</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Cancelled">Cancelled</option>
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
                  <th>Tracking Number</th>
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
                    <td><code>TRK-{shipment.id}</code></td>
                    <td>{shipment.source}</td>
                    <td>{shipment.destination}</td>
                    <td>{getDriverName(shipment.driver_id)}</td>
                    <td>{getVehicleNumber(shipment.vehicle_id)}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span className={`badge badge-${shipment.status.toLowerCase().replace(" ", "-")}`}>
                          {shipment.status}
                        </span>
                        {getValidTransitions(shipment.status).length > 0 && (
                          <select
                            value={shipment.status}
                            onChange={(e) => handleStatusChange(shipment.id, e.target.value)}
                            disabled={updatingStatusId === shipment.id}
                            className="status-select"
                            style={{
                              fontSize: "12px",
                              padding: "4px 8px",
                              borderRadius: "6px",
                              border: "1.5px solid var(--border)",
                              backgroundColor: "var(--card-bg)",
                              color: "var(--text-h)",
                              outline: "none",
                              cursor: "pointer"
                            }}
                          >
                            <option value={shipment.status} disabled>-- Update Status --</option>
                            {getValidTransitions(shipment.status).map((stat) => (
                              <option key={stat} value={stat}>{stat}</option>
                            ))}
                          </select>
                        )}
                        {updatingStatusId === shipment.id && (
                          <span style={{ fontSize: "11px", color: "var(--text)", fontStyle: "italic" }}>
                            Updating...
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => viewHistory(shipment)}
                        >
                          📜 Logs
                        </button>
                        {trips.find((t) => t.shipment_id === shipment.id) ? (
                          <>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => navigate(`/trips/${trips.find((t) => t.shipment_id === shipment.id).id}`)}
                            >
                              🗺️ View Route
                            </button>
                            {isManagementAllowed && (
                              <button
                                className="btn btn-sm btn-secondary"
                                onClick={() => openScheduleModal(shipment, trips.find((t) => t.shipment_id === shipment.id))}
                              >
                                📅 Edit Schedule
                              </button>
                            )}
                          </>
                        ) : (
                          isManagementAllowed && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => openScheduleModal(shipment)}
                            >
                              📅 Schedule
                            </button>
                          )
                        )}
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
                        <p className="timeline-time">
                          {log.updated_at ? new Date(log.updated_at).toLocaleString() : `Recorded ID: #${log.id}`}
                        </p>
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

      {/* Trip Scheduling Modal */}
      {showScheduleModal && schedulingShipment && (
        <div className="modal-overlay">
          <div className="modal-dialog" style={{ maxWidth: "500px" }}>
            <div className="modal-header">
              <h3>{schedulingTrip ? "Edit Trip Schedule" : "Schedule Shipment Trip"}</h3>
              <button
                className="close-btn"
                onClick={() => {
                  setShowScheduleModal(false);
                  setSchedulingShipment(null);
                  setSchedulingTrip(null);
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleScheduleSubmit}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "var(--text)" }}>
                  Setting scheduled window for Shipment <strong>TRK-{schedulingShipment.id}</strong> (from {schedulingShipment.source} to {schedulingShipment.destination}).
                </p>

                <div className="form-group">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Scheduled Start Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text-h)"
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Scheduled End Time</label>
                  <input
                    type="datetime-local"
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text-h)"
                    }}
                  />
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Trip Driver Assignment</label>
                  <select
                    value={schedDriverId}
                    onChange={(e) => setSchedDriverId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text-h)"
                    }}
                  >
                    <option value="">-- Select Driver --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} {d.status !== "Available" && d.id !== schedulingShipment.driver_id ? `(${d.status})` : "(Available)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Trip Vehicle Assignment</label>
                  <select
                    value={schedVehicleId}
                    onChange={(e) => setSchedVehicleId(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text-h)"
                    }}
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicle_number} - {v.vehicle_type} {v.status !== "Available" && v.id !== schedulingShipment.vehicle_id ? `(${v.status})` : "(Available)"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label style={{ fontWeight: 600, display: "block", marginBottom: "6px" }}>Trip Status</label>
                  <select
                    value={tripStatus}
                    onChange={(e) => setTripStatus(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "6px",
                      border: "1.5px solid var(--border)",
                      backgroundColor: "var(--bg)",
                      color: "var(--text-h)"
                    }}
                  >
                    <option value="Scheduled">Scheduled</option>
                    <option value="Active">Active</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowScheduleModal(false);
                    setSchedulingShipment(null);
                    setSchedulingTrip(null);
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Processing..." : schedulingTrip ? "Update Schedule" : "Confirm Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Shipments;