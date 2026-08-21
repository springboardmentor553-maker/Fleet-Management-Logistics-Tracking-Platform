import { useEffect, useState } from "react";
import api from "../services/api";

const ALERT_STATUSES = [
  "Pending",
  "Sent",
  "Completed",
];

function MaintenanceAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [editingAlert, setEditingAlert] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [
        alertsResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get("/maintenance-alerts/"),
        api.get("/vehicles/"),
      ]);

      setAlerts(alertsResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load maintenance alerts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getVehicleName = (vehicleId) => {
    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle
      ? vehicle.registration_number
      : `Vehicle #${vehicleId}`;
  };

  const formatDateTime = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
      }
    );
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(
      `${value}T00:00:00`
    ).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusClass = (status) => {
    return status
      .toLowerCase()
      .replace(/\s+/g, "-");
  };

  const openStatusEditor = (alert) => {
    setEditingAlert(alert);
    setNewStatus(alert.alert_status);
    setError("");
    setSuccess("");
  };

  const closeStatusEditor = () => {
    if (saving) {
      return;
    }

    setEditingAlert(null);
    setNewStatus("");
  };

  const handleStatusUpdate = async () => {
    if (!editingAlert || !newStatus) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await api.put(
        `/maintenance-alerts/${editingAlert.id}`,
        {
          alert_status: newStatus,
        }
      );

      closeStatusEditor();

      setSuccess(
        "Maintenance alert status updated successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to update maintenance alert."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (alert) => {
    const confirmed = window.confirm(
      `Delete this maintenance alert for ${getVehicleName(
        alert.vehicle_id
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      await api.delete(
        `/maintenance-alerts/${alert.id}`
      );

      setSuccess(
        "Maintenance alert deleted successfully."
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete maintenance alert."
      );
    }
  };

  if (loading) {
    return (
      <div className="empty-state">
        Loading maintenance alerts...
      </div>
    );
  }

  return (
    <div>

      <div className="page-heading">

        <div>
          <h1>Maintenance Alerts</h1>

          <p>
            Monitor and manage vehicle maintenance alerts.
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={fetchData}
        >
          ↻ Refresh
        </button>

      </div>


      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}


      <div className="table-card">

        <div className="table-card-header">

          <div>
            <h2>Maintenance Alerts</h2>

            <p>
              {alerts.length} alert
              {alerts.length !== 1 ? "s" : ""}
            </p>
          </div>

        </div>


        {alerts.length === 0 ? (

          <div className="empty-table">

            <div
              style={{
                fontSize: "30px",
                marginBottom: "10px",
              }}
            >
              ✓
            </div>

            <div>
              No maintenance alerts found.
            </div>

          </div>

        ) : (

          <div className="table-wrapper">

            <table>

              <thead>

                <tr>
                  <th>Vehicle</th>
                  <th>Alert</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Generated</th>
                  <th>Next Service</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {alerts.map((alert) => (

                  <tr key={alert.id}>

                    <td>
                      <strong>
                        {getVehicleName(
                          alert.vehicle_id
                        )}
                      </strong>
                    </td>

                    <td>
                      {alert.alert_message}
                    </td>

                    <td>
                      {alert.alert_type}
                    </td>

                    <td>

                      <span
                        className={`status-badge alert-${getStatusClass(
                          alert.alert_status
                        )}`}
                      >
                        {alert.alert_status}
                      </span>

                    </td>

                    <td>
                      {formatDateTime(
                        alert.generated_date
                      )}
                    </td>

                    <td>
                      {formatDate(
                        alert.next_service_date
                      )}
                    </td>

                    <td>

                      <div className="table-actions">

                        <button
                          className="secondary-button"
                          onClick={() =>
                            openStatusEditor(alert)
                          }
                        >
                          Update
                        </button>

                        <button
                          className="danger-button"
                          onClick={() =>
                            handleDelete(alert)
                          }
                        >
                          Delete
                        </button>

                      </div>

                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {editingAlert && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Update Alert Status
                </h2>

                <p>
                  {getVehicleName(
                    editingAlert.vehicle_id
                  )}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeStatusEditor}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <div className="vehicle-form">

              <div className="form-field">

                <label>
                  Alert Status
                </label>

                <select
                  className="form-select"
                  value={newStatus}
                  onChange={(event) =>
                    setNewStatus(
                      event.target.value
                    )
                  }
                >

                  {ALERT_STATUSES.map(
                    (status) => (
                      <option
                        key={status}
                        value={status}
                      >
                        {status}
                      </option>
                    )
                  )}

                </select>

              </div>


              <div className="modal-actions">

                <button
                  className="secondary-button"
                  onClick={closeStatusEditor}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  className="primary-button"
                  onClick={handleStatusUpdate}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Update Status"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default MaintenanceAlerts;