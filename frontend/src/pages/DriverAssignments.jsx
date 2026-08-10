import { useState, useEffect } from "react";
import api from "../services/api";
import { extractErrorMessage } from "../services/driverAssignmentService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function DriverAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form field states
  const [driverId, setDriverId] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [tripId, setTripId] = useState("");
  const [assignmentStatus, setAssignmentStatus] = useState("Active");
  const [remarks, setRemarks] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [assignRes, driversRes, vehiclesRes, tripsRes] = await Promise.all([
        api.get("/driver-assignments/"),
        api.get("/drivers/"),
        api.get("/vehicles/"),
        api.get("/trips/"),
      ]);
      setAssignments(Array.isArray(assignRes.data) ? assignRes.data : []);
      setDrivers(Array.isArray(driversRes.data) ? driversRes.data : []);
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
      setTrips(Array.isArray(tripsRes.data) ? tripsRes.data : []);
    } catch (err) {
      console.error(err);
      setErrorMsg(extractErrorMessage(err, "Failed to load driver assignments data. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setDriverId("");
    setVehicleId("");
    setTripId("");
    setAssignmentStatus("Active");
    setRemarks("");
    setEditingRecord(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const openEditForm = (record) => {
    setDriverId(record.driver_id ? record.driver_id.toString() : "");
    setVehicleId(record.vehicle_id ? record.vehicle_id.toString() : "");
    setTripId(record.trip_id ? record.trip_id.toString() : "");
    setAssignmentStatus(record.assignment_status || "Active");
    setRemarks(record.remarks || "");
    setEditingRecord(record);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!driverId || !vehicleId || !tripId) {
      alert("Please select a Driver, Vehicle, and Trip.");
      return;
    }

    const payload = {
      driver_id: parseInt(driverId),
      vehicle_id: parseInt(vehicleId),
      trip_id: parseInt(tripId),
      assignment_status: assignmentStatus,
      remarks: remarks || null,
    };

    setSubmitting(true);
    try {
      if (editingRecord) {
        await api.put(`/driver-assignments/${editingRecord.id}`, payload);
        alert("Assignment updated successfully!");
      } else {
        await api.post("/driver-assignments/", payload);
        alert("Driver assignment created successfully!");
      }
      setShowAddForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = extractErrorMessage(err, "Failed to save driver assignment.");
      alert(`Error: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/driver-assignments/${deleteConfirmId}`);
      alert("Assignment deleted successfully!");
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = extractErrorMessage(err, "Failed to delete assignment.");
      alert(`Error: ${detail}`);
    }
  };

  const getDriverLabel = (id) => {
    const d = drivers.find((drv) => drv.id === id);
    return d ? `${d.name} (#${d.id})` : `Driver #${id}`;
  };

  const getVehicleLabel = (id) => {
    const v = vehicles.find((vh) => vh.id === id);
    return v ? `${v.vehicle_number} (${v.vehicle_type})` : `Vehicle #${id}`;
  };

  const isManagement = ["Admin", "Fleet Manager", "Dispatcher"].includes(user?.role);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container driver-assignments-page">
      <div className="page-header">
        <div>
          <h2>Driver Assignments</h2>
          <p className="page-subtitle">Manage duty assignments linking drivers to vehicles and trips</p>
        </div>
        {isManagement && (
          <button className="btn btn-primary" onClick={openAddForm}>
            ➕ New Assignment
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {showAddForm && (
        <div className="form-card">
          <h3>
            {editingRecord ? `Edit Assignment #${editingRecord.id}` : "Create Driver Assignment"}
          </h3>
          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group">
              <label>Select Driver *</label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                required
              >
                <option value="">— Select Available Driver —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} — Status: {d.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Vehicle *</label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
              >
                <option value="">— Select Available Vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.vehicle_type}) — Status: {v.status}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Select Trip *</label>
              <select
                value={tripId}
                onChange={(e) => setTripId(e.target.value)}
                required
              >
                <option value="">— Select Trip —</option>
                {trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    Trip #{t.id} ({t.pickup_location} → {t.destination}) [{t.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Assignment Status *</label>
              <select
                value={assignmentStatus}
                onChange={(e) => setAssignmentStatus(e.target.value)}
                required
              >
                <option value="Active">Active</option>
                <option value="Assigned">Assigned</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group span-grid">
              <label>Remarks</label>
              <input
                type="text"
                placeholder="Optional assignment remarks..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="form-actions span-grid">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <h3>All Assignments ({assignments.length})</h3>
        {assignments.length === 0 ? (
          <p className="empty-state">No driver assignments recorded.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Driver</th>
                  <th>Vehicle</th>
                  <th>Trip</th>
                  <th>Status</th>
                  <th>Assigned At</th>
                  <th>Remarks</th>
                  {isManagement && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {assignments.map((rec) => (
                  <tr key={rec.id}>
                    <td>#{rec.id}</td>
                    <td>
                      <strong>{getDriverLabel(rec.driver_id)}</strong>
                    </td>
                    <td>{getVehicleLabel(rec.vehicle_id)}</td>
                    <td>
                      <span className="badge badge-info">Trip #{rec.trip_id}</span>
                    </td>
                    <td>
                      <span
                        className={`badge badge-${(rec.assignment_status || "Active")
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {rec.assignment_status || "Active"}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px" }}>
                      {rec.assigned_at ? new Date(rec.assigned_at).toLocaleString() : "—"}
                    </td>
                    <td>{rec.remarks || "—"}</td>
                    {isManagement && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEditForm(rec)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirmId(rec.id)}
                          >
                            🗑 Delete
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="Confirm Assignment Deletion"
        message="Are you sure you want to remove this driver assignment?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

export default DriverAssignments;
