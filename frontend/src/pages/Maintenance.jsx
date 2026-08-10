import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function Maintenance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modal & form display states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form field states
  const [vehicleId, setVehicleId] = useState("");
  const [maintenanceCategory, setMaintenanceCategory] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  const [nextServiceDate, setNextServiceDate] = useState("");
  const [serviceCost, setServiceCost] = useState("");
  const [serviceProvider, setServiceProvider] = useState("");
  const [maintenanceStatus, setMaintenanceStatus] = useState("Scheduled");
  const [notes, setNotes] = useState("");

  const fetchRecords = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [maintRes, alertsRes] = await Promise.all([
        api.get("/maintenance/"),
        api.get("/maintenance-alerts/").catch(() => ({ data: [] })),
      ]);
      setRecords(Array.isArray(maintRes.data) ? maintRes.data : []);
      setAlerts(Array.isArray(alertsRes.data) ? alertsRes.data : []);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch maintenance records. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const resetForm = () => {
    setVehicleId("");
    setMaintenanceCategory("");
    setServiceDate("");
    setNextServiceDate("");
    setServiceCost("");
    setServiceProvider("");
    setMaintenanceStatus("Scheduled");
    setNotes("");
    setEditingRecord(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowAddForm(true);
  };

  const openEditForm = (record) => {
    setVehicleId(record.vehicle_id ? record.vehicle_id.toString() : "");
    setMaintenanceCategory(record.maintenance_category || "");
    setServiceDate(record.service_date ? record.service_date.substring(0, 10) : "");
    setNextServiceDate(record.next_service_date ? record.next_service_date.substring(0, 10) : "");
    setServiceCost(record.service_cost != null ? record.service_cost.toString() : "");
    setServiceProvider(record.service_provider || "");
    setMaintenanceStatus(record.maintenance_status || "Scheduled");
    setNotes(record.notes || "");
    setEditingRecord(record);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId || !maintenanceCategory || !serviceDate || !maintenanceStatus) {
      alert("Please fill in all required fields.");
      return;
    }

    const payload = {
      vehicle_id: parseInt(vehicleId),
      maintenance_category: maintenanceCategory,
      service_date: serviceDate,
      next_service_date: nextServiceDate || null,
      service_cost: serviceCost !== "" ? parseFloat(serviceCost) : null,
      service_provider: serviceProvider || null,
      maintenance_status: maintenanceStatus,
      notes: notes || null,
    };

    setSubmitting(true);
    try {
      if (editingRecord) {
        await api.put(`/maintenance/${editingRecord.id}`, payload);
        alert("Maintenance record updated successfully!");
      } else {
        await api.post("/maintenance/", payload);
        alert("Maintenance record created successfully!");
      }
      setShowAddForm(false);
      resetForm();
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.detail || "Failed to save maintenance record."}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/maintenance/${deleteConfirmId}`);
      alert(res.data.message || "Maintenance record deleted successfully!");
      setDeleteConfirmId(null);
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.response?.data?.detail || "Failed to delete maintenance record."}`);
    }
  };

  const handleResolveAlert = async (alertId) => {
    try {
      await api.put(`/maintenance-alerts/${alertId}`, { alert_status: "Resolved" });
      alert("Alert marked as Resolved!");
      fetchRecords();
    } catch (err) {
      console.error(err);
      alert(`Error resolving alert: ${err.response?.data?.detail || err.message}`);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return dateStr.substring(0, 10);
  };

  const isManagementAllowed = ["Admin", "Fleet Manager"].includes(user?.role);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container maintenance-page">
      <div className="page-header">
        <div>
          <h2>Maintenance & Fleet Service</h2>
          <p className="page-subtitle">Track service schedules, manage alerts, and maintain vehicle health</p>
        </div>
        {isManagementAllowed && (
          <button className="btn btn-primary" onClick={openAddForm}>
            ➕ Add Maintenance Record
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {/* Maintenance Alerts Banner Section */}
      {alerts.length > 0 && (
        <div className="table-card" style={{ marginBottom: "24px", borderColor: "var(--warning-border, #f59e0b)" }}>
          <h3>🔔 Active Maintenance Alerts ({alerts.filter((a) => a.alert_status === "Pending").length})</h3>
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Vehicle ID</th>
                  <th>Type</th>
                  <th>Message</th>
                  <th>Status</th>
                  <th>Next Service</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alt) => (
                  <tr key={alt.id}>
                    <td>#{alt.id}</td>
                    <td>
                      <strong>Vehicle #{alt.vehicle_id}</strong>
                    </td>
                    <td>{alt.alert_type}</td>
                    <td>{alt.alert_message}</td>
                    <td>
                      <span className={`badge badge-${alt.alert_status === "Pending" ? "danger" : "success"}`}>
                        {alt.alert_status}
                      </span>
                    </td>
                    <td style={{ fontSize: "13px" }}>{formatDate(alt.next_service_date)}</td>
                    <td>
                      {alt.alert_status === "Pending" && (
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleResolveAlert(alt.id)}
                        >
                          ✓ Resolve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Form Dialog */}
      {showAddForm && (
        <div className="form-card">
          <h3>
            {editingRecord ? `Edit Maintenance Record #${editingRecord.id}` : "Add New Maintenance Record"}
          </h3>
          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group">
              <label>Vehicle ID *</label>
              <input
                type="number"
                placeholder="e.g. 1"
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Maintenance Category *</label>
              <select
                value={maintenanceCategory}
                onChange={(e) => setMaintenanceCategory(e.target.value)}
                required
              >
                <option value="">— Select Category —</option>
                <option value="Oil Change">Oil Change</option>
                <option value="Tyre Replacement">Tyre Replacement</option>
                <option value="Brake Service">Brake Service</option>
                <option value="Engine Service">Engine Service</option>
                <option value="General Inspection">General Inspection</option>
              </select>
            </div>

            <div className="form-group">
              <label>Service Date *</label>
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Next Service Date</label>
              <input
                type="date"
                value={nextServiceDate}
                onChange={(e) => setNextServiceDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Service Cost ($)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 250.00"
                value={serviceCost}
                onChange={(e) => setServiceCost(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Service Provider</label>
              <input
                type="text"
                placeholder="e.g. AutoFix Center"
                value={serviceProvider}
                onChange={(e) => setServiceProvider(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Maintenance Status *</label>
              <select
                value={maintenanceStatus}
                onChange={(e) => setMaintenanceStatus(e.target.value)}
                required
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                placeholder="Additional notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                style={{ resize: "vertical" }}
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
                {submitting ? "Saving..." : "Save Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Maintenance Records Table */}
      <div className="table-card">
        <h3>Maintenance Records ({records.length})</h3>
        {records.length === 0 ? (
          <p className="empty-state">No maintenance records found.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle ID</th>
                  <th>Category</th>
                  <th>Service Date</th>
                  <th>Next Service</th>
                  <th>Cost ($)</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Notes</th>
                  {isManagementAllowed && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>#{record.id}</td>
                    <td>
                      <strong>Vehicle #{record.vehicle_id}</strong>
                    </td>
                    <td>{record.maintenance_category}</td>
                    <td>{formatDate(record.service_date)}</td>
                    <td>{formatDate(record.next_service_date)}</td>
                    <td>
                      {record.service_cost != null
                        ? `$${record.service_cost.toFixed(2)}`
                        : "—"}
                    </td>
                    <td>{record.service_provider || "—"}</td>
                    <td>
                      {(() => {
                        const status = record.maintenance_status || "Unknown";
                        return (
                          <span
                            className={`badge badge-${status
                              .toLowerCase()
                              .replace(/\s+/g, "-")}`}
                          >
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                    <td>{record.notes || "—"}</td>
                    {isManagementAllowed && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEditForm(record)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirmId(record.id)}
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
        title="Confirm Maintenance Record Deletion"
        message="Are you sure you want to permanently delete this maintenance record?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

export default Maintenance;
