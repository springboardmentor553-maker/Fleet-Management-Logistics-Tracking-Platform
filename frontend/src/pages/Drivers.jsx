import { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

function Drivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  
  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await api.get("/drivers/");
      setDrivers(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch drivers. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!name || !licenseNumber || !phone) {
      alert("All fields are required.");
      return;
    }

    setSubmitting(true);
    try {
      await api.post("/drivers/", {
        name,
        license_number: licenseNumber,
        phone,
      });
      // Reset form
      setName("");
      setLicenseNumber("");
      setPhone("");
      setShowAddForm(false);
      // Fetch latest
      fetchDrivers();
      alert("Driver added successfully!");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail || "Failed to register driver.";
      alert(`Error: ${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  const isManagementAllowed = ["Admin", "Fleet Manager"].includes(user?.role);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container drivers-page">
      <div className="page-header">
        <div>
          <h2>Drivers Management</h2>
          <p className="page-subtitle">View and register logistics drivers</p>
        </div>
        {isManagementAllowed && (
          <button 
            className="btn btn-primary" 
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? "Cancel" : "➕ Register Driver"}
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="error-banner">
          <span>⚠</span> {errorMsg}
        </div>
      )}

      {/* Register Driver Form Drawer/Modal */}
      {showAddForm && isManagementAllowed && (
        <div className="form-card">
          <h3>Register New Driver</h3>
          <form onSubmit={handleAddSubmit} className="grid-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                placeholder="e.g. Robert Miller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>License Number</label>
              <input
                type="text"
                placeholder="e.g. DL-12345678"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                placeholder="e.g. +1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="form-actions span-grid">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Save Driver"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Drivers List Table */}
      <div className="table-card">
        <h3>System Drivers ({drivers.length})</h3>
        {drivers.length === 0 ? (
          <p className="empty-state">No drivers registered in the system yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>License Number</th>
                  <th>Phone</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id}>
                    <td>#{driver.id}</td>
                    <td>{driver.name}</td>
                    <td><code>{driver.license_number}</code></td>
                    <td>{driver.phone}</td>
                    <td>
                      <span className={`badge badge-${driver.status.toLowerCase().replace(" ", "-")}`}>
                        {driver.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Drivers;