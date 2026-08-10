import { useState, useEffect } from "react";
import api from "../services/api";
import { extractErrorMessage } from "../services/fuelRecordService";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import ConfirmationDialog from "../components/ConfirmationDialog";

function FuelRecords() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [fuelQuantity, setFuelQuantity] = useState("");
  const [fuelCost, setFuelCost] = useState("");
  const [refuelDate, setRefuelDate] = useState("");
  const [odometerReading, setOdometerReading] = useState("");
  const [notes, setNotes] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [fuelRes, vehiclesRes, driversRes] = await Promise.all([
        api.get("/fuel-records/"),
        api.get("/vehicles/"),
        api.get("/drivers/"),
      ]);
      setRecords(Array.isArray(fuelRes.data) ? fuelRes.data : []);
      setVehicles(Array.isArray(vehiclesRes.data) ? vehiclesRes.data : []);
      setDrivers(Array.isArray(driversRes.data) ? driversRes.data : []);
    } catch (err) {
      console.error(err);
      setErrorMsg(extractErrorMessage(err, "Failed to load fuel records. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetForm = () => {
    setVehicleId("");
    setDriverId("");
    setFuelQuantity("");
    setFuelCost("");
    setRefuelDate("");
    setOdometerReading("");
    setNotes("");
    setEditingRecord(null);
  };

  const openAddForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (rec) => {
    setVehicleId(rec.vehicle_id ? rec.vehicle_id.toString() : "");
    setDriverId(rec.driver_id ? rec.driver_id.toString() : "");
    setFuelQuantity(rec.fuel_quantity ? rec.fuel_quantity.toString() : "");
    setFuelCost(rec.fuel_cost ? rec.fuel_cost.toString() : "");
    const dateVal = rec.fuel_date || rec.refuel_date;
    setRefuelDate(dateVal ? new Date(dateVal).toISOString().slice(0, 10) : "");
    setOdometerReading(rec.odometer_reading ? rec.odometer_reading.toString() : "");
    setNotes(rec.fuel_station || rec.remarks || rec.notes || "");
    setEditingRecord(rec);
    setShowForm(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!vehicleId) {
      alert("Please select a vehicle.");
      return;
    }
    if (!fuelQuantity || isNaN(parseFloat(fuelQuantity)) || parseFloat(fuelQuantity) <= 0) {
      alert("Fuel quantity is required and must be greater than 0.");
      return;
    }
    if (!fuelCost || isNaN(parseFloat(fuelCost)) || parseFloat(fuelCost) <= 0) {
      alert("Total cost is required and must be greater than 0.");
      return;
    }
    if (!refuelDate) {
      alert("Refuel date/time is required.");
      return;
    }
    if (
      odometerReading === "" ||
      odometerReading === null ||
      isNaN(parseFloat(odometerReading)) ||
      parseFloat(odometerReading) < 0
    ) {
      alert("Odometer reading is required.");
      return;
    }

    const payload = {
      vehicle_id: parseInt(vehicleId),
      driver_id: driverId ? parseInt(driverId) : null,
      fuel_quantity: parseFloat(fuelQuantity),
      fuel_cost: parseFloat(fuelCost),
      odometer_reading: parseFloat(odometerReading),
      fuel_date: refuelDate.slice(0, 10),
      fuel_station: notes || null,
      remarks: notes || null,
    };

    setSubmitting(true);
    try {
      if (editingRecord) {
        await api.put(`/fuel-records/${editingRecord.id}`, payload);
        alert("Fuel record updated successfully!");
      } else {
        await api.post("/fuel-records/", payload);
        alert("Fuel record created successfully!");
      }
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = extractErrorMessage(err, "Failed to save fuel record.");
      alert(`Error: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmId) return;
    try {
      await api.delete(`/fuel-records/${deleteConfirmId}`);
      alert("Fuel record deleted successfully!");
      setDeleteConfirmId(null);
      fetchData();
    } catch (err) {
      console.error(err);
      const detail = extractErrorMessage(err, "Failed to delete fuel record.");
      alert(`Error: ${detail}`);
    }
  };

  const isManagement = ["Admin", "Fleet Manager", "Dispatcher"].includes(user?.role);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container fuel-records-page">
      <div className="page-header">
        <div>
          <h2>Fuel Monitoring & Records</h2>
          <p className="page-subtitle">Track refuel events, costs, and consumption efficiency across fleet vehicles</p>
        </div>
        {isManagement && (
          <button className="btn btn-primary" onClick={openAddForm}>
            ➕ Add Fuel Record
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {showForm && (
        <div className="form-card">
          <h3>{editingRecord ? `Edit Fuel Record #${editingRecord.id}` : "Log Refuel Event"}</h3>
          <form onSubmit={handleFormSubmit} className="grid-form">
            <div className="form-group">
              <label>Select Vehicle *</label>
              <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)} required>
                <option value="">— Select Vehicle —</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicle_number} ({v.vehicle_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Driver (Optional)</label>
              <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                <option value="">— Select Driver —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Fuel Quantity (Liters) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 50.0"
                value={fuelQuantity}
                onChange={(e) => setFuelQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Total Cost ($) *</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 120.00"
                value={fuelCost}
                onChange={(e) => setFuelCost(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Refuel Date/Time *</label>
              <input
                type="date"
                value={refuelDate}
                onChange={(e) => setRefuelDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Odometer Reading (km) *</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 45000"
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                required
              />
            </div>

            <div className="form-group span-grid">
              <label>Notes / Station Location</label>
              <input
                type="text"
                placeholder="Optional notes or station location..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="form-actions span-grid">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving..." : "Save Fuel Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-card">
        <h3>All Refuel Logs ({records.length})</h3>
        {records.length === 0 ? (
          <p className="empty-state">No fuel records logged yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Quantity (L)</th>
                  <th>Cost ($)</th>
                  <th>Refuel Date</th>
                  <th>Odometer (km)</th>
                  <th>Notes</th>
                  {isManagement && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => {
                  const vehicle = vehicles.find((v) => v.id === rec.vehicle_id);
                  const driver = drivers.find((d) => d.id === rec.driver_id);
                  const displayDate = rec.fuel_date || rec.refuel_date;
                  const displayNotes = rec.fuel_station || rec.remarks || rec.notes;
                  return (
                    <tr key={rec.id}>
                      <td>#{rec.id}</td>
                      <td>
                        <strong>{vehicle ? vehicle.vehicle_number : `Vehicle #${rec.vehicle_id}`}</strong>
                      </td>
                      <td>{driver ? driver.name : rec.driver_id ? `Driver #${rec.driver_id}` : "—"}</td>
                      <td>{rec.fuel_quantity ? `${rec.fuel_quantity} L` : "—"}</td>
                      <td>
                        <strong>${rec.fuel_cost ? rec.fuel_cost.toFixed(2) : "0.00"}</strong>
                      </td>
                      <td style={{ fontSize: "13px" }}>
                        {displayDate ? new Date(displayDate).toLocaleDateString() : "—"}
                      </td>
                      <td>{rec.odometer_reading ? `${rec.odometer_reading} km` : "—"}</td>
                      <td>{displayNotes || "—"}</td>
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
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmationDialog
        isOpen={deleteConfirmId !== null}
        title="Confirm Refuel Log Deletion"
        message="Are you sure you want to delete this fuel record?"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </div>
  );
}

export default FuelRecords;
