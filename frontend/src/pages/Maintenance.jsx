import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function Maintenance() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
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
      const res = await api.get("/maintenance/");
      console.log("Maintenance Response:", res.data);
      setRecords(res.data);
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
    record.vehicle_id
    record.maintenance_category
    record.service_date
    record.next_service_date
    record.service_cost
    record.service_provider
    record.maintenance_status
  };

 const handleFormSubmit = async (e) => {
  e.preventDefault();

  if (
    !vehicleId ||
    !maintenanceCategory ||
    !serviceDate ||
    !maintenanceStatus
  ) {
    alert("Please fill in all required fields.");
    return;
  }

  const payload = {
    vehicle_id: parseInt(vehicleId),
    maintenance_category: maintenanceCategory,
    service_date: serviceDate,
    next_service_date: nextServiceDate || null,
    service_cost:
      serviceCost !== "" ? parseFloat(serviceCost) : null,
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

    const detail =
      err.response?.data?.detail ||
      "Failed to save maintenance record.";

    alert(`Error: ${detail}`);

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
      const detail = err.response?.data?.detail || "Failed to delete maintenance record.";
      alert(`Error: ${detail}`);
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
          <h2>Maintenance Records</h2>
          <p className="page-subtitle">Track and manage vehicle service and maintenance schedules</p>
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

      {/* Add / Edit Form Dialog */}
      {showAddForm && (
        <div className="form-card">
          <h3>
            {editingRecord
              ? `Edit Maintenance Record #${editingRecord.id}`
              : "Add New Maintenance Record"}
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
                <option value="Tire Rotation">Tire Rotation</option>
                <option value="Brake Inspection">Brake Inspection</option>
                <option value="Engine Repair">Engine Repair</option>
                <option value="Transmission Service">Transmission Service</option>
                <option value="Battery Replacement">Battery Replacement</option>
                <option value="General Service">General Service</option>
                <option value="Other">Other</option>
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
                      <span
                        className={`badge badge-${record.maintenance_status
                          .toLowerCase()
                          .replace(/\s+/g, "-")}`}
                      >
                        {record.maintenance_status}
                      </span>
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

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="Confirm Maintenance Record Deletion"
        message="Are you sure you want to permanently delete this maintenance record? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

export default Maintenance;
