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

const emptyForm = {
  vehicle_id: "",
  driver_id: "",
  fuel_quantity: "",
  fuel_cost: "",
  odometer_reading: "",
  fuel_date: "",
  fuel_station: "",
  remarks: "",
};

function Fuel() {
  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

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

      const [
        fuelResponse,
        vehiclesResponse,
        driversResponse,
      ] = await Promise.all([
        api.get("/fuel-records/"),
        api.get("/vehicles/"),
        api.get("/drivers/"),
      ]);

      setRecords(fuelResponse.data);
      setVehicles(vehiclesResponse.data);
      setDrivers(driversResponse.data);
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load fuel records."
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

    /*
     * If a vehicle has an associated driver,
     * automatically select that driver.
     */
    if (name === "vehicle_id" && value) {
      const vehicle = vehicles.find(
        (item) => item.id === Number(value)
      );

      if (vehicle?.driver_id) {
        setForm((previous) => ({
          ...previous,
          vehicle_id: value,
          driver_id: String(vehicle.driver_id),
        }));
      }
    }
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
      driver_id: String(record.driver_id),
      fuel_quantity: String(record.fuel_quantity),
      fuel_cost: String(record.fuel_cost),
      odometer_reading: String(record.odometer_reading),
      fuel_date: record.fuel_date || "",
      fuel_station: record.fuel_station,
      remarks: record.remarks || "",
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
        driver_id: Number(form.driver_id),
        fuel_quantity: Number(form.fuel_quantity),
        fuel_cost: Number(form.fuel_cost),
        odometer_reading: Number(
          form.odometer_reading
        ),
        fuel_date: form.fuel_date,
        fuel_station: form.fuel_station,
        remarks: form.remarks || null,
      };

      if (editingRecord) {
        await api.put(
          `/fuel-records/${editingRecord.id}`,
          payload
        );
      } else {
        await api.post(
          "/fuel-records/",
          payload
        );
      }

      closeForm();
      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save fuel record."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (record) => {
    const confirmed = window.confirm(
      `Delete fuel record #${record.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/fuel-records/${record.id}`
      );

      await fetchData();
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete fuel record."
      );
    }
  };

  const getVehicle = (vehicleId) => {
    return vehicles.find(
      (vehicle) => vehicle.id === vehicleId
    );
  };

  const getDriver = (driverId) => {
    return drivers.find(
      (driver) => driver.id === driverId
    );
  };

  const getVehicleName = (vehicleId) => {
    const vehicle = getVehicle(vehicleId);

    if (!vehicle) {
      return "Unknown vehicle";
    }

    return vehicle.registration_number;
  };

  const getDriverName = (driverId) => {
    const driver = getDriver(driverId);

    if (!driver) {
      return "Unknown driver";
    }

    return driver.name;
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
   * For new records, only active vehicles and drivers
   * are shown.
   *
   * When editing, the existing vehicle/driver remains
   * selectable so old records can still be corrected.
   */
  const availableVehicles = vehicles.filter(
    (vehicle) => {
      if (
        editingRecord &&
        vehicle.id === editingRecord.vehicle_id
      ) {
        return true;
      }

      return vehicle.is_active;
    }
  );

  const availableDrivers = drivers.filter(
    (driver) => {
      if (
        editingRecord &&
        driver.id === editingRecord.driver_id
      ) {
        return true;
      }

      return driver.is_active;
    }
  );

  return (
    <div>

      <div className="page-heading">

        <div>
          <h1>Fuel Management</h1>

          <p>
            Track fuel usage, costs and vehicle
            consumption.
          </p>
        </div>

        <Button onClick={openAddForm}>
          + Add Fuel Record
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
            Fuel Records ({records.length})
          </CardTitle>
        </CardHeader>

        <CardContent>

          {loading ? (

            <div className="empty-state">
              Loading fuel records...
            </div>

          ) : records.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                ⛽
              </div>

              <h3>
                No fuel records
              </h3>

              <p>
                Add a fuel record to start tracking
                fuel consumption.
              </p>

              <Button onClick={openAddForm}>
                Add Fuel Record
              </Button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="fleet-table">

                <thead>

                  <tr>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Quantity</th>
                    <th>Cost</th>
                    <th>Odometer</th>
                    <th>Date</th>
                    <th>Fuel Station</th>
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
                        {getDriverName(
                          record.driver_id
                        )}
                      </td>

                      <td>
                        {record.fuel_quantity} L
                      </td>

                      <td>
                        ₹
                        {Number(
                          record.fuel_cost
                        ).toLocaleString("en-IN")}
                      </td>

                      <td>
                        {Number(
                          record.odometer_reading
                        ).toLocaleString("en-IN")}
                        km
                      </td>

                      <td>
                        {formatDate(
                          record.fuel_date
                        )}
                      </td>

                      <td>
                        {record.fuel_station}
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

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDelete(record)
                            }
                          >
                            Delete
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


      {showForm && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingRecord
                    ? "Edit Fuel Record"
                    : "Add Fuel Record"}
                </h2>

                <p>
                  Record vehicle fuel usage.
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

              <div className="form-row">

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
                  >

                    <option value="">
                      Select vehicle
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


                <div className="form-field">

                  <label>
                    Driver
                  </label>

                  <select
                    name="driver_id"
                    value={form.driver_id}
                    onChange={handleChange}
                    className="form-select"
                    required
                  >

                    <option value="">
                      Select driver
                    </option>

                    {availableDrivers.map(
                      (driver) => (

                        <option
                          key={driver.id}
                          value={driver.id}
                        >
                          {driver.name}
                          {" — "}
                          {driver.license_number}
                        </option>

                      )
                    )}

                  </select>

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Fuel Quantity (L)
                  </label>

                  <Input
                    name="fuel_quantity"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.fuel_quantity}
                    onChange={handleChange}
                    placeholder="50"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Fuel Cost (₹)
                  </label>

                  <Input
                    name="fuel_cost"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.fuel_cost}
                    onChange={handleChange}
                    placeholder="5000"
                    required
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Odometer Reading (km)
                  </label>

                  <Input
                    name="odometer_reading"
                    type="number"
                    min="0"
                    step="0.1"
                    value={form.odometer_reading}
                    onChange={handleChange}
                    placeholder="25000"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Fuel Date
                  </label>

                  <Input
                    name="fuel_date"
                    type="date"
                    value={form.fuel_date}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>


              <div className="form-field">

                <label>
                  Fuel Station
                </label>

                <Input
                  name="fuel_station"
                  value={form.fuel_station}
                  onChange={handleChange}
                  placeholder="Indian Oil"
                  required
                />

              </div>


              <div className="form-field">

                <label>
                  Remarks
                </label>

                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  placeholder="Additional remarks..."
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
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingRecord
                      ? "Update Fuel Record"
                      : "Add Fuel Record"}
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Fuel;