import { useEffect, useState } from "react";
import api from "../services/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";


const emptyForm = {
  registration_number: "",
  vehicle_type: "",
  capacity: "",
  fuel_type: "",
  current_status: "Available",
  driver_id: "",
};


function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);


  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [vehiclesResponse, driversResponse] =
        await Promise.all([
          api.get("/vehicles/"),
          api.get("/drivers/"),
        ]);

      setVehicles(vehiclesResponse.data);
      setDrivers(driversResponse.data);

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load vehicles."
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
    setEditingVehicle(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");
  };


  const openEditForm = (vehicle) => {
    setEditingVehicle(vehicle);

    setForm({
      registration_number: vehicle.registration_number,
      vehicle_type: vehicle.vehicle_type,
      capacity: vehicle.capacity,
      fuel_type: vehicle.fuel_type,
      current_status: vehicle.current_status,
      driver_id: vehicle.driver_id
        ? String(vehicle.driver_id)
        : "",
    });

    setShowForm(true);
    setError("");
  };


  const closeForm = () => {
    if (!saving) {
      setShowForm(false);
      setEditingVehicle(null);
      setForm(emptyForm);
    }
  };


  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        registration_number:
          form.registration_number,

        vehicle_type:
          form.vehicle_type,

        capacity:
          Number(form.capacity),

        fuel_type:
          form.fuel_type,

        current_status:
          form.current_status,

        driver_id:
          form.driver_id
            ? Number(form.driver_id)
            : null,
      };


      if (editingVehicle) {
        await api.put(
          `/vehicles/${editingVehicle.id}`,
          payload
        );
      } else {
        await api.post(
          "/vehicles/",
          payload
        );
      }


      closeForm();
      await fetchData();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save vehicle."
      );
    } finally {
      setSaving(false);
    }
  };


  const handleDelete = async (vehicle) => {
    const confirmed = window.confirm(
      `Delete vehicle ${vehicle.registration_number}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(
        `/vehicles/${vehicle.id}`
      );

      await fetchData();

    } catch (err) {
      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete vehicle."
      );
    }
  };


  const getStatusVariant = (status) => {
    if (status === "Available") {
      return "default";
    }

    if (status === "Maintenance") {
      return "destructive";
    }

    return "secondary";
  };


  const getDriverName = (driverId) => {
    const driver = drivers.find(
      (item) => item.id === driverId
    );

    return driver
      ? driver.name
      : `Driver #${driverId}`;
  };


  return (
    <div>

      <div className="page-heading">

        <div>

          <h1>Vehicles</h1>

          <p>
            Manage vehicles registered in your fleet.
          </p>

        </div>


        <Button onClick={openAddForm}>
          + Add Vehicle
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
            Fleet Vehicles ({vehicles.length})
          </CardTitle>

        </CardHeader>


        <CardContent>

          {loading ? (

            <div className="empty-state">
              Loading vehicles...
            </div>

          ) : vehicles.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🚚
              </div>

              <h3>
                No vehicles yet
              </h3>

              <p>
                Add your first vehicle to start
                managing your fleet.
              </p>

              <Button onClick={openAddForm}>
                Add Vehicle
              </Button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="fleet-table">

                <thead>

                  <tr>
                    <th>Registration</th>
                    <th>Type</th>
                    <th>Capacity</th>
                    <th>Fuel Type</th>
                    <th>Status</th>
                    <th>Driver</th>
                    <th>Actions</th>
                  </tr>

                </thead>


                <tbody>

                  {vehicles.map((vehicle) => (

                    <tr key={vehicle.id}>

                      <td>
                        <strong>
                          {vehicle.registration_number}
                        </strong>
                      </td>

                      <td>
                        {vehicle.vehicle_type}
                      </td>

                      <td>
                        {vehicle.capacity}
                      </td>

                      <td>
                        {vehicle.fuel_type}
                      </td>

                      <td>

                        <Badge
                          variant={getStatusVariant(
                            vehicle.current_status
                          )}
                        >
                          {vehicle.current_status}
                        </Badge>

                      </td>

                      <td>
                        {vehicle.driver_id
                          ? getDriverName(
                              vehicle.driver_id
                            )
                          : "Unassigned"}
                      </td>

                      <td>

                        <div className="table-actions">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openEditForm(vehicle)
                            }
                          >
                            Edit
                          </Button>


                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDelete(vehicle)
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
                  {editingVehicle
                    ? "Edit Vehicle"
                    : "Add Vehicle"}
                </h2>

                <p>
                  {editingVehicle
                    ? "Update vehicle information."
                    : "Register a new vehicle."}
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
                  Registration Number
                </label>

                <Input
                  name="registration_number"
                  value={form.registration_number}
                  onChange={handleChange}
                  placeholder="KA01AB1234"
                  required
                />

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Vehicle Type
                  </label>

                  <Input
                    name="vehicle_type"
                    value={form.vehicle_type}
                    onChange={handleChange}
                    placeholder="Truck"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Capacity
                  </label>

                  <Input
                    name="capacity"
                    type="number"
                    min="1"
                    value={form.capacity}
                    onChange={handleChange}
                    placeholder="5000"
                    required
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Fuel Type
                  </label>

                  <Input
                    name="fuel_type"
                    value={form.fuel_type}
                    onChange={handleChange}
                    placeholder="Diesel"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Status
                  </label>

                  <select
                    name="current_status"
                    value={form.current_status}
                    onChange={handleChange}
                    className="form-select"
                  >

                    <option value="Available">
                      Available
                    </option>

                    <option value="Assigned">
                      Assigned
                    </option>

                    <option value="In Transit">
                      In Transit
                    </option>

                    <option value="Maintenance">
                      Maintenance
                    </option>

                  </select>

                </div>

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
                >

                  <option value="">
                    Unassigned
                  </option>

                  {drivers.map((driver) => (

                    <option
                      key={driver.id}
                      value={driver.id}
                    >
                      {driver.name}
                      {" — "}
                      {driver.status}
                    </option>

                  ))}

                </select>

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
                    : editingVehicle
                      ? "Update Vehicle"
                      : "Add Vehicle"}
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}


export default Vehicles;