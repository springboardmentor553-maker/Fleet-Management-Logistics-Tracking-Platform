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


const STATUSES = [
  "Created",
  "Assigned",
  "Picked Up",
  "In Transit",
  "Out for Delivery",
  "Delivered",
  "Delayed",
  "Cancelled",
];


const emptyForm = {
  sender_name: "",
  receiver_name: "",
  pickup_location: "",
  delivery_location: "",
  weight: "",
  vehicle_id: "",
};


function Shipments() {

  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingShipment, setEditingShipment] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [trackingShipment, setTrackingShipment] = useState(null);
  const [trackingLoading, setTrackingLoading] = useState(false);


  const fetchData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        shipmentsResponse,
        driversResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get("/shipments/"),
        api.get("/drivers/"),
        api.get("/vehicles/"),
      ]);

      setShipments(shipmentsResponse.data);
      setDrivers(driversResponse.data);
      setVehicles(vehiclesResponse.data);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load shipments."
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

    setEditingShipment(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");

  };


  const openEditForm = (shipment) => {

    setEditingShipment(shipment);

    setForm({
      sender_name: shipment.sender_name,
      receiver_name: shipment.receiver_name,
      pickup_location: shipment.pickup_location,
      delivery_location: shipment.delivery_location,
      weight: shipment.weight,
      vehicle_id: shipment.vehicle_id
        ? String(shipment.vehicle_id)
        : "",
    });

    setShowForm(true);
    setError("");

  };


  const closeForm = () => {

    if (!saving) {

      setShowForm(false);
      setEditingShipment(null);
      setForm(emptyForm);

    }

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);
      setError("");

      const payload = {
        sender_name: form.sender_name,
        receiver_name: form.receiver_name,
        pickup_location: form.pickup_location,
        delivery_location: form.delivery_location,
        weight: Number(form.weight),

        vehicle_id: form.vehicle_id
          ? Number(form.vehicle_id)
          : null,

        driver_id: null,
      };


      if (form.vehicle_id) {

        const selectedVehicle = vehicles.find(
          (vehicle) =>
            vehicle.id === Number(form.vehicle_id)
        );

        payload.driver_id =
          selectedVehicle?.driver_id || null;

      }


      if (editingShipment) {

        await api.put(
          `/shipments/${editingShipment.id}`,
          payload
        );

      } else {

        await api.post(
          "/shipments/",
          payload
        );

      }


      closeForm();

      await fetchData();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save shipment."
      );

    } finally {

      setSaving(false);

    }

  };


  const updateStatus = async (
    shipment,
    status
  ) => {

    try {

      setError("");

      await api.put(
        `/shipments/${shipment.id}`,
        {
          current_status: status,
        }
      );

      await fetchData();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to update shipment status."
      );

    }

  };


  const handleDelete = async (shipment) => {

    const confirmed = window.confirm(
      `Delete shipment ${shipment.tracking_number}?`
    );

    if (!confirmed) {
      return;
    }


    try {

      setError("");

      await api.delete(
        `/shipments/${shipment.id}`
      );

      await fetchData();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete shipment."
      );

    }

  };


  const trackShipment = async (shipment) => {

    try {

      setTrackingLoading(true);
      setError("");

      const response = await api.get(
        `/shipments/${shipment.tracking_number}/status`
      );

      setTrackingShipment(response.data);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to retrieve tracking information."
      );

    } finally {

      setTrackingLoading(false);

    }

  };


  const closeTracking = () => {

    setTrackingShipment(null);

  };


  const getStatusVariant = (status) => {

    if (status === "Delivered") {
      return "default";
    }

    if (
      status === "Delayed" ||
      status === "Cancelled"
    ) {
      return "destructive";
    }

    if (status === "In Transit") {
      return "secondary";
    }

    return "outline";

  };


  const getDriverName = (driverId) => {

    const driver = drivers.find(
      (item) => item.id === driverId
    );

    return driver
      ? driver.name
      : `Driver #${driverId}`;

  };


  const getVehicleRegistration = (vehicleId) => {

    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle
      ? vehicle.registration_number
      : `Vehicle #${vehicleId}`;

  };


  const availableVehicles = vehicles.filter(
    (vehicle) =>
      vehicle.is_active === true &&
      vehicle.current_status === "Available" &&
      vehicle.driver_id !== null &&
      drivers.some(
        (driver) =>
          driver.id === vehicle.driver_id &&
          driver.is_active === true &&
          driver.status === "Available"
      )
  );


  const selectedVehicle = vehicles.find(
    (vehicle) =>
      vehicle.id === Number(form.vehicle_id)
  );


  const selectedDriver = selectedVehicle
    ? drivers.find(
        (driver) =>
          driver.id === selectedVehicle.driver_id
      )
    : null;


  return (

    <div>

      <div className="page-heading">

        <div>

          <h1>
            Shipments
          </h1>

          <p>
            Manage shipments, assignments and delivery status.
          </p>

        </div>


        <Button onClick={openAddForm}>
          + Create Shipment
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
            Shipments ({shipments.length})
          </CardTitle>

        </CardHeader>


        <CardContent>

          {loading ? (

            <div className="empty-state">
              Loading shipments...
            </div>

          ) : shipments.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                📦
              </div>

              <h3>
                No shipments yet
              </h3>

              <p>
                Create your first shipment to begin
                tracking deliveries.
              </p>

              <Button onClick={openAddForm}>
                Create Shipment
              </Button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="fleet-table">

                <thead>

                  <tr>

                    <th>Tracking Number</th>
                    <th>Sender</th>
                    <th>Receiver</th>
                    <th>Route</th>
                    <th>Weight</th>
                    <th>Status</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Actions</th>

                  </tr>

                </thead>


                <tbody>

                  {shipments.map((shipment) => (

                    <tr key={shipment.id}>

                      <td>

                        <strong>
                          {shipment.tracking_number}
                        </strong>

                      </td>


                      <td>
                        {shipment.sender_name}
                      </td>


                      <td>
                        {shipment.receiver_name}
                      </td>


                      <td>

                        {shipment.pickup_location}
                        {" → "}
                        {shipment.delivery_location}

                      </td>


                      <td>
                        {shipment.weight}
                      </td>


                      <td>

                        <select
                          value={shipment.current_status}
                          onChange={(event) =>
                            updateStatus(
                              shipment,
                              event.target.value
                            )
                          }
                          className="status-select"
                        >

                          {STATUSES.map((status) => (

                            <option
                              key={status}
                              value={status}
                            >
                              {status}
                            </option>

                          ))}

                        </select>

                      </td>


                      <td>

                        {shipment.driver_id
                          ? getDriverName(
                              shipment.driver_id
                            )
                          : "Unassigned"}

                      </td>


                      <td>

                        {shipment.vehicle_id
                          ? getVehicleRegistration(
                              shipment.vehicle_id
                            )
                          : "Unassigned"}

                      </td>


                      <td>

                        <div className="table-actions">

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              trackShipment(shipment)
                            }
                            disabled={trackingLoading}
                          >
                            Track
                          </Button>


                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              openEditForm(shipment)
                            }
                          >
                            Edit
                          </Button>


                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() =>
                              handleDelete(shipment)
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

                  {editingShipment
                    ? "Edit Shipment"
                    : "Create Shipment"}

                </h2>

                <p>

                  {editingShipment
                    ? "Update shipment information."
                    : "Enter the shipment details."}

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
                    Sender Name
                  </label>

                  <Input
                    name="sender_name"
                    value={form.sender_name}
                    onChange={handleChange}
                    placeholder="Sender name"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Receiver Name
                  </label>

                  <Input
                    name="receiver_name"
                    value={form.receiver_name}
                    onChange={handleChange}
                    placeholder="Receiver name"
                    required
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Pickup Location
                  </label>

                  <Input
                    name="pickup_location"
                    value={form.pickup_location}
                    onChange={handleChange}
                    placeholder="Bengaluru"
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Delivery Location
                  </label>

                  <Input
                    name="delivery_location"
                    value={form.delivery_location}
                    onChange={handleChange}
                    placeholder="Chennai"
                    required
                  />

                </div>

              </div>


              <div className="form-field">

                <label>
                  Weight
                </label>

                <Input
                  name="weight"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.weight}
                  onChange={handleChange}
                  placeholder="1000"
                  required
                />

              </div>


              <div className="form-field">

                <label>
                  Vehicle
                  <span
                    style={{
                      marginLeft: "6px",
                      opacity: 0.6,
                      fontWeight: "normal",
                    }}
                  >
                    (Optional)
                  </span>
                </label>

                <select
                  name="vehicle_id"
                  value={form.vehicle_id}
                  onChange={handleChange}
                  className="form-select"
                >

                  <option value="">
                    No vehicle assigned
                  </option>

                  {availableVehicles.map((vehicle) => (

                    <option
                      key={vehicle.id}
                      value={vehicle.id}
                    >
                      {vehicle.registration_number}
                      {" — "}
                      {vehicle.vehicle_type}
                    </option>

                  ))}

                </select>

                <small>
                  A vehicle and driver can be assigned later.
                </small>

              </div>


              <div className="form-field">

                <label>
                  Assigned Driver
                </label>

                <Input
                  value={
                    selectedDriver
                      ? `${selectedDriver.name} — ${selectedDriver.status}`
                      : "Unassigned"
                  }
                  readOnly
                  disabled
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
                    : editingShipment
                      ? "Update Shipment"
                      : "Create Shipment"}

                </Button>

              </div>

            </form>

          </div>

        </div>

      )}


      {trackingShipment && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Shipment Tracking
                </h2>

                <p>
                  {trackingShipment.tracking_number}
                </p>

              </div>


              <button
                className="modal-close"
                onClick={closeTracking}
              >
                ×
              </button>

            </div>


            <div className="vehicle-form">

              <div className="tracking-grid">

                <div className="tracking-item">

                  <span>
                    Status
                  </span>

                  <Badge
                    variant={getStatusVariant(
                      trackingShipment.current_status
                    )}
                  >
                    {trackingShipment.current_status}
                  </Badge>

                </div>


                <div className="tracking-item">

                  <span>
                    Driver
                  </span>

                  <strong>
                    {trackingShipment.driver_name ||
                      "Unassigned"}
                  </strong>

                </div>


                <div className="tracking-item">

                  <span>
                    Vehicle
                  </span>

                  <strong>
                    {trackingShipment
                      .vehicle_registration_number ||
                      "Unassigned"}
                  </strong>

                </div>


                <div className="tracking-item">

                  <span>
                    Pickup
                  </span>

                  <strong>
                    {trackingShipment.pickup_location}
                  </strong>

                </div>


                <div className="tracking-item">

                  <span>
                    Destination
                  </span>

                  <strong>
                    {trackingShipment.destination}
                  </strong>

                </div>


                <div className="tracking-item">

                  <span>
                    Estimated Arrival
                  </span>

                  <strong>

                    {new Date(
                      trackingShipment.eta
                    ).toLocaleString(
                      "en-IN",
                      {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}

                  </strong>

                </div>

              </div>


              <div className="modal-actions">

                <Button onClick={closeTracking}>
                  Close
                </Button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>

  );

}


export default Shipments;