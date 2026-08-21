import React, { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";
import "./MaintenanceAlertPage.css";

const API_URL = "https://fleetflow-backend-90o5.onrender.com/maintenance-alerts";

function MaintenanceAlertPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    vehicle_id: "",
    maintenance_id: "",
    alert_message: "",
    alert_type: "Upcoming Service",
    next_service_date: "",
    alert_status: "Pending",
  });

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(API_URL + "/");
      setAlerts(response.data);
    } catch (error) {
      console.error(error);
      alert("Unable to load alerts.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearForm = () => {
    setEditingId(null);

    setFormData({
      vehicle_id: "",
      maintenance_id: "",
      alert_message: "",
      alert_type: "Upcoming Service",
      next_service_date: "",
      alert_status: "Pending",
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId === null) {
        await axios.post(API_URL + "/", {
          vehicle_id: Number(formData.vehicle_id),
          maintenance_id: Number(formData.maintenance_id),
          alert_message: formData.alert_message,
          alert_type: formData.alert_type,
          next_service_date: formData.next_service_date,
        });

        alert("Maintenance Alert Created.");
      } else {
        await axios.put(`${API_URL}/${editingId}`, {
          alert_status: formData.alert_status,
        });

        alert("Alert Updated.");
      }

      clearForm();
      await fetchAlerts();
    } catch (error) {
      console.error(error);

      alert(
        error.response?.data?.detail ||
          "Operation Failed"
      );
    }
  };

  const handleEdit = (alert) => {
    setEditingId(alert.id);

    setFormData({
      vehicle_id: alert.vehicle_id,
      maintenance_id: alert.maintenance_id,
      alert_message: alert.alert_message,
      alert_type: alert.alert_type,
      next_service_date: alert.next_service_date,
      alert_status: alert.alert_status,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alert?")) return;

    try {
      await axios.delete(`${API_URL}/${id}`);

      alert("Alert Deleted Successfully.");

      await fetchAlerts();
    } catch (error) {
      console.error(error);
      alert("Delete Failed.");
    }
  };

  return (
    <>
      <Navbar />

      <main className="maintenance-alert-page">

        {/* Page Header */}
        <div className="maintenance-alert-header">
          <h2>Maintenance Alerts</h2>

          <p>
            Create, update and manage vehicle maintenance alerts.
          </p>
        </div>

        {/* Form Card */}
        <div className="maintenance-alert-card">

          <div className="maintenance-alert-card-header">
            <h4>
              {editingId === null
                ? "Create Maintenance Alert"
                : "Update Maintenance Alert"}
            </h4>
          </div>

          <div className="maintenance-alert-card-body">

            <form onSubmit={handleSubmit}>

              <div className="row">

                {/* Vehicle ID */}
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label">
                    Vehicle ID
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    name="vehicle_id"
                    value={formData.vehicle_id}
                    onChange={handleChange}
                    disabled={editingId !== null}
                    required
                  />
                </div>

                {/* Maintenance ID */}
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label">
                    Maintenance ID
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    name="maintenance_id"
                    value={formData.maintenance_id}
                    onChange={handleChange}
                    disabled={editingId !== null}
                    required
                  />
                </div>

                {/* Alert Message */}
                <div className="col-12 mb-3">
                  <label className="form-label">
                    Alert Message
                  </label>

                  <textarea
                    className="form-control"
                    rows="3"
                    name="alert_message"
                    value={formData.alert_message}
                    onChange={handleChange}
                    disabled={editingId !== null}
                    required
                  />
                </div>

                {/* Alert Type */}
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label">
                    Alert Type
                  </label>

                  <select
                    className="form-select"
                    name="alert_type"
                    value={formData.alert_type}
                    onChange={handleChange}
                    disabled={editingId !== null}
                  >
                    <option value="Upcoming Service">
                      Upcoming Service
                    </option>

                    <option value="Overdue Service">
                      Overdue Service
                    </option>

                    <option value="General">
                      General
                    </option>
                  </select>
                </div>

                {/* Next Service Date */}
                <div className="col-12 col-md-6 mb-3">
                  <label className="form-label">
                    Next Service Date
                  </label>

                  <input
                    type="date"
                    className="form-control"
                    name="next_service_date"
                    value={formData.next_service_date}
                    onChange={handleChange}
                    disabled={editingId !== null}
                    required
                  />
                </div>

                {/* Status while editing */}
                {editingId !== null && (
                  <div className="col-12 col-md-6 mb-3">
                    <label className="form-label">
                      Status
                    </label>

                    <select
                      className="form-select"
                      name="alert_status"
                      value={formData.alert_status}
                      onChange={handleChange}
                    >
                      <option value="Pending">
                        Pending
                      </option>

                      <option value="Completed">
                        Completed
                      </option>
                    </select>
                  </div>
                )}

                {/* Buttons */}
                <div className="col-12 mt-2">

                  <button
                    type="submit"
                    className="btn btn-primary maintenance-btn"
                  >
                    {editingId === null
                      ? "Create Alert"
                      : "Update Status"}
                  </button>

                  <button
                    type="button"
                    className="btn btn-secondary maintenance-btn"
                    onClick={clearForm}
                  >
                    Clear
                  </button>

                </div>

              </div>

            </form>

          </div>
        </div>

        {/* Table Card */}
        <div className="maintenance-alert-card">

          <div className="maintenance-alert-card-header dark-header">
            <h4>Maintenance Alerts</h4>
          </div>

          <div className="maintenance-alert-table-wrapper">

            {loading ? (
              <div className="loading-message">
                Loading maintenance alerts...
              </div>
            ) : (
              <table className="table table-bordered table-hover maintenance-alert-table">

                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Vehicle</th>
                    <th>Maintenance</th>
                    <th>Message</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Next Service</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {alerts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="8"
                        className="text-center"
                      >
                        No Alerts Found
                      </td>
                    </tr>
                  ) : (
                    alerts.map((alert) => (
                      <tr key={alert.id}>

                        <td>
                          {alert.id}
                        </td>

                        <td>
                          {alert.vehicle_id}
                        </td>

                        <td>
                          {alert.maintenance_id}
                        </td>

                        <td className="alert-message-cell">
                          {alert.alert_message}
                        </td>

                        <td>
                          {alert.alert_type}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              alert.alert_status === "Completed"
                                ? "status-completed"
                                : "status-pending"
                            }`}
                          >
                            {alert.alert_status}
                          </span>
                        </td>

                        <td>
                          {alert.next_service_date}
                        </td>

                        <td className="action-cell">

                          <button
                            type="button"
                            className="btn btn-warning btn-sm"
                            onClick={() =>
                              handleEdit(alert)
                            }
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleDelete(alert.id)
                            }
                          >
                            Delete
                          </button>

                        </td>

                      </tr>
                    ))
                  )}

                </tbody>

              </table>
            )}

          </div>
        </div>

      </main>
    </>
  );
}

export default MaintenanceAlertPage;