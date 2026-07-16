import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function Vehicles() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // Modals & form display states
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Form value states
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [capacity, setCapacity] = useState("");
  const [status, setStatus] = useState("Available");
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/vehicles/");
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch vehicles. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddForm = () => {
    setVehicleNumber("");
    setVehicleType("");
    setCapacity("");
    setStatus("Available");
    setEditingVehicle(null);
    setShowAddForm(true);
  };

  const openEditForm = (vehicle) => {
    setVehicleNumber(vehicle.vehicle_number);
    setVehicleType(vehicle.vehicle_type);
    setCapacity(vehicle.capacity.toString());
    setStatus(vehicle.status);
    setEditingVehicle(vehicle);
    setShowAddForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleNumber || !vehicleType || !capacity) {
      alert("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      if (editingVehicle) {
        // Edit vehicle (PUT /{vehicle_id})
        await api.put(`/vehicles/${editingVehicle.id}`, {
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType,
          capacity: parseFloat(capacity),
          status: status,
        });
        alert("Vehicle updated successfully!");
      } else {
        // New vehicle (POST /)
        await api.post("/vehicles/", {
          vehicle_number: vehicleNumber,
          vehicle_type: vehicleType,
          capacity: parseFloat(capacity),
        });
        alert("Vehicle added successfully!");
      }
      setShowAddForm(false);
      setEditingVehicle(null);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to save vehicle.";
      alert(`Error: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      const res = await api.delete(`/vehicles/${deleteConfirmId}`);
      alert(res.data.message || "Vehicle deleted successfully!");
      setDeleteConfirmId(null);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to delete vehicle.";
      alert(`Error: ${detail}`);
    }
  };

  const handleQuickStatusChange = async (vehicle, newStatus) => {
    try {
      // Endpoint: PATCH /vehicles/{vehicle_id}/status
      await api.patch(`/vehicles/${vehicle.id}/status?status=${newStatus}`);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert("Failed to update status. Check permissions.");
    }
  };

  const isManagementAllowed = ["Admin", "Fleet Manager"].includes(user?.role);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container vehicles-page">
      <div className="page-header">
        <div>
          <h2>Vehicles Fleet</h2>
          <p className="page-subtitle">Manage and track fleet shipping vehicles</p>
        </div>
        {isManagementAllowed && (
          <button className="btn btn-primary" onClick={openAddForm}>
            ➕ Add New Vehicle
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {/* Add / Edit Form Dialog Drawer */}
      {showAddForm && (
        <div className="form-card">
          <h3>{editingVehicle ? `Edit Vehicle #${editingVehicle.id}` : "Add New Vehicle"}</h3>
          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group">
              <label>Vehicle Plate Number</label>
              <input
                type="text"
                placeholder="e.g. NY-987-AB"
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Vehicle Type</label>
              <input
                type="text"
                placeholder="e.g. Heavy Duty Semi, Mini Truck"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Cargo Capacity (Tons)</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 15.5"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
            {editingVehicle && (
              <div className="form-group">
                <label>Operational Status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)}>
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>
            )}
            <div className="form-actions span-grid">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingVehicle(null);
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Vehicle"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles Fleet List Table */}
      <div className="table-card">
        <h3>Operational Fleet ({vehicles.length})</h3>
        {vehicles.length === 0 ? (
          <p className="empty-state">No vehicles in the database yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Plate Number</th>
                  <th>Type</th>
                  <th>Capacity (Tons)</th>
                  <th>Status</th>
                  {isManagementAllowed && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {vehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td>#{vehicle.id}</td>
                    <td><strong>{vehicle.vehicle_number}</strong></td>
                    <td>{vehicle.vehicle_type}</td>
                    <td>{vehicle.capacity} Ton(s)</td>
                    <td>
                      {isManagementAllowed ? (
                        <select
                          className={`badge status-select status-${vehicle.status.toLowerCase().replace(" ", "-")}`}
                          value={vehicle.status}
                          onChange={(e) => handleQuickStatusChange(vehicle, e.target.value)}
                        >
                          <option value="Available">Available</option>
                          <option value="On Trip">On Trip</option>
                          <option value="Maintenance">Maintenance</option>
                        </select>
                      ) : (
                        <span className={`badge badge-${vehicle.status.toLowerCase().replace(" ", "-")}`}>
                          {vehicle.status}
                        </span>
                      )}
                    </td>
                    {isManagementAllowed && (
                      <td>
                        <div className="table-actions">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => openEditForm(vehicle)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => setDeleteConfirmId(vehicle.id)}
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
        title="Confirm Vehicle Deletion"
        message="Are you sure you want to permanently remove this vehicle from the fleet? This action cannot be undone."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

export default Vehicles;