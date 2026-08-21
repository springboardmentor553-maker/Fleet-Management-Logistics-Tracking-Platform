import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CATEGORIES = [
  "Oil Change",
  "Tyre Replacement",
  "Brake Service",
  "Engine Service",
  "General Inspection",
];

const STATUSES = [
  "Scheduled",
  "Completed",
];

const emptyForm = {
  vehicle_id: "",
  maintenance_category: "",
  service_date: "",
  next_service_date: "",
  service_cost: "",
  service_provider: "",
  maintenance_status: "Scheduled",
  notes: "",
};

function Maintenance() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [maintenanceResponse, vehiclesResponse] =
        await Promise.all([
          api.get("/maintenance/"),
          api.get("/vehicles/"),
        ]);

      setRecords(maintenanceResponse.data);
      setVehicles(vehiclesResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load maintenance information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const openAddForm = () => {
    setEditingRecord(null);
    setForm(emptyForm);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (record) => {
    setEditingRecord(record);

    setForm({
      vehicle_id: String(record.vehicle_id),
      maintenance_category: record.maintenance_category,
      service_date: record.service_date || "",
      next_service_date: record.next_service_date || "",
      service_cost: String(record.service_cost),
      service_provider: record.service_provider,
      maintenance_status: record.maintenance_status,
      notes: record.notes || "",
    });

    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) {
      return;
    }

    setShowForm(false);
    setEditingRecord(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        vehicle_id: Number(form.vehicle_id),
        maintenance_category: form.maintenance_category,
        service_date: form.service_date,
        next_service_date:
          form.next_service_date || null,
        service_cost: Number(form.service_cost),
        service_provider: form.service_provider,
        maintenance_status: form.maintenance_status,
        notes: form.notes || null,
      };

      if (editingRecord) {
        await api.put(
          `/maintenance/${editingRecord.id}`,
          payload
        );
      } else {
        await api.post(
          "/maintenance/",
          payload
        );
      }

      closeForm();
      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save maintenance record."
      );
    } finally {
      setSaving(false);
    }
  };


  const getVehicle = (vehicleId) => {
    return vehicles.find(
      (vehicle) => vehicle.id === vehicleId
    );
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = getVehicle(vehicleId);

    if (!vehicle) {
      return "Unknown vehicle";
    }

    return vehicle.registration_number;
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  };

  /*
   * For new scheduled maintenance, only show
   * vehicles that are currently available.
   *
   * When editing an existing record, its current
   * vehicle remains selectable.
   */
  const availableVehicles = vehicles.filter(
    (vehicle) => {
      if (
        editingRecord &&
        vehicle.id === editingRecord.vehicle_id
      ) {
        return true;
      }

      return (
        vehicle.is_active &&
        vehicle.current_status === "Available"
      );
    }
  );

  return (
    <div>

      <div className="page-heading">

        <div>
          <h1>Maintenance</h1>

          <p>
            Manage vehicle maintenance and service records.
          </p>
        </div>

        <Button onClick={openAddForm}>
          + Add Maintenance
        </Button>

      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <Card>

        <CardHeader>
          <CardTitle>
            Maintenance Records ({records.length})
          </CardTitle>
        </CardHeader>

        <CardContent>

          {loading ? (

            <div className="empty-state">
              Loading maintenance records...
            </div>

          ) : records.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🔧
              </div>

              <h3>
                No maintenance records
              </h3>

              <p>
                Add a maintenance record to start
                tracking vehicle servicing.
              </p>

              <Button onClick={openAddForm}>
                Add Maintenance
              </Button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="fleet-table">

                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Category</th>
                    <th>Service Date</th>
                    <th>Next Service</th>
                    <th>Cost</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {records.map((record) => (

                    <tr key={record.id}>

                      <td>
                        <strong>
                          {getVehicleName(
                            record.vehicle_id
                          )}
                        </strong>
                      </td>

                      <td>
                        {record.maintenance_category}
                      </td>

                      <td>
                        {formatDate(
                          record.service_date
                        )}
                      </td>

                      <td>
                        {formatDate(
                          record.next_service_date
                        )}
                      </td>

                      <td>
                        ₹
                        {Number(
                          record.service_cost
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        {record.service_provider}
                      </td>

                      <td>
                        <span
                          className={
                            record.maintenance_status ===
                            "Completed"
                              ? "status-badge available"
                              : "status-badge"
                          }
                        >
                          {record.maintenance_status}
                        </span>
                      </td>

                      <td>

                        <div className="table-actions">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openEditForm(record)
                            }
                          >
                            Edit
                            </Button>
                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

          )}

        </CardContent>

      </Card>


      {/* Add / Edit Maintenance */}

      {showForm && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingRecord
                    ? "Edit Maintenance"
                    : "Add Maintenance"}
                </h2>

                <p>
                  {editingRecord
                    ? "Update this maintenance record."
                    : "Register a vehicle service record."}
                </p>

              </div>

              <button
                className="modal-close"
                onClick={closeForm}
                disabled={saving}
              >
                ×
              </button>

            </div>


            <form
              onSubmit={handleSubmit}
              className="vehicle-form"
            >

              <div className="form-field">

                <label>
                  Vehicle
                </label>

                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={Boolean(editingRecord)}
                >

                  <option value="">
                    Select an available vehicle
                  </option>

                  {availableVehicles.map(
                    (vehicle) => (

                      <option
                        key={vehicle.id}
                        value={vehicle.id}
                      >
                        {vehicle.registration_number}
                        {" — "}
                        {vehicle.vehicle_type}
                      </option>

                    )
                  )}

                </select>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Maintenance Category
                  </label>

                  <select
                    name="maintenance_category"
                    value={form.maintenance_category}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    {CATEGORIES.map(
                      (category) => (

                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>

                      )
                    )}

                  </select>

                </div>


                <div className="form-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="maintenance_status"
                    value={form.maintenance_status}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >

                    {STATUSES.map(
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

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Service Date
                  </label>

                  <Input
                    name="service_date"
                    type="date"
                    value={form.service_date}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Next Service Date
                  </label>

                  <Input
                    name="next_service_date"
                    type="date"
                    value={form.next_service_date}
                    onChange={handleChange}
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Service Cost
                  </label>

                  <Input
                    name="service_cost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.service_cost}
                    onChange={handleChange}
                    placeholder="5000"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Service Provider
                  </label>

                  <Input
                    name="service_provider"
                    value={form.service_provider}
                    onChange={handleChange}
                    placeholder="ABC Motors"
                    required
                  />

                </div>

              </div>


              <div className="form-field">

                <label>
                  Notes
                </label>

                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  placeholder="Additional service notes..."
                  rows="4"
                  className="form-textarea"
                />

              </div>


              <div className="modal-actions">

                <Button
                  type="button"
                  variant="outline"
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={
                    saving ||
                    availableVehicles.length === 0
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Update Maintenance"
                      : "Add Maintenance"}
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Maintenance;