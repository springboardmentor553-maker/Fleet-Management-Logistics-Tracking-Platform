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
import LiveTracking from "../components/LiveTracking";


const TRIP_STATUSES = [
  "Scheduled",
  "In Progress",
  "Completed",
  "Cancelled",
];


const emptyForm = {
  shipment_id: "",
  pickup_location: "",
  delivery_location: "",
  scheduled_start_time: "",
  scheduled_end_time: "",
};


function Trips() {

  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [etaData, setEtaData] = useState(null);
  const [etaLoading, setEtaLoading] = useState(false);
  const [trackingTripId, setTrackingTripId] = useState(null);


  const fetchData = async () => {

    try {

      setLoading(true);
      setError("");

      const [
        tripsResponse,
        shipmentsResponse,
        driversResponse,
        vehiclesResponse,
      ] = await Promise.all([
        api.get("/trips/"),
        api.get("/shipments/"),
        api.get("/drivers/"),
        api.get("/vehicles/"),
      ]);

      setTrips(tripsResponse.data);
      setShipments(shipmentsResponse.data);
      setDrivers(driversResponse.data);
      setVehicles(vehiclesResponse.data);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to load trip information."
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


    if (name === "shipment_id" && value) {

      const shipment = shipments.find(
        (item) => item.id === Number(value)
      );

      if (shipment) {

        setForm((previous) => ({
          ...previous,
          shipment_id: value,
          pickup_location: shipment.pickup_location,
          delivery_location: shipment.delivery_location,
        }));

      }

    }

  };


  const openAddForm = () => {

    setEditingTrip(null);
    setForm(emptyForm);
    setShowForm(true);
    setError("");

  };


  const toDateTimeLocal = (value) => {

    if (!value) {
      return "";
    }

    const date = new Date(value);

    const pad = (number) =>
      String(number).padStart(2, "0");

    return (
      `${date.getFullYear()}-` +
      `${pad(date.getMonth() + 1)}-` +
      `${pad(date.getDate())}T` +
      `${pad(date.getHours())}:` +
      `${pad(date.getMinutes())}`
    );

  };


  const openEditForm = (trip) => {

    setEditingTrip(trip);

    setForm({
      shipment_id: String(trip.shipment_id),
      pickup_location: trip.pickup_location,
      delivery_location: trip.delivery_location,
      scheduled_start_time: toDateTimeLocal(
        trip.scheduled_start_time
      ),
      scheduled_end_time: toDateTimeLocal(
        trip.scheduled_end_time
      ),
    });

    setShowForm(true);
    setError("");

  };


  const closeForm = () => {

    if (!saving) {

      setShowForm(false);
      setEditingTrip(null);
      setForm(emptyForm);

    }

  };


  const handleSubmit = async (event) => {

    event.preventDefault();

    try {

      setSaving(true);
      setError("");

      const payload = {
        shipment_id: Number(form.shipment_id),
        pickup_location: form.pickup_location,
        delivery_location: form.delivery_location,
        scheduled_start_time: new Date(
          form.scheduled_start_time
        ).toISOString(),
        scheduled_end_time: new Date(
          form.scheduled_end_time
        ).toISOString(),
      };


      if (editingTrip) {

        await api.put(
          `/trips/${editingTrip.id}`,
          payload
        );

      } else {

        await api.post(
          "/trips/",
          payload
        );

      }


      closeForm();
      await fetchData();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to save trip."
      );

    } finally {

      setSaving(false);

    }

  };


  const updateStatus = async (trip, status) => {

    try {

      setError("");

      await api.put(
        `/trips/${trip.id}`,
        {
          trip_status: status,
        }
      );

      await fetchData();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to update trip status."
      );

    }

  };


  const handleDelete = async (trip) => {

    const confirmed = window.confirm(
      `Delete trip #${trip.id}?`
    );

    if (!confirmed) {
      return;
    }

    try {

      setError("");

      await api.delete(
        `/trips/${trip.id}`
      );

      await fetchData();

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to delete trip."
      );

    }

  };


  const getEta = async (trip) => {

    try {

      setEtaLoading(true);
      setError("");

      const response = await api.get(
        `/trips/${trip.id}/eta`
      );

      setEtaData(response.data);

    } catch (err) {

      console.error(err);

      setError(
        err.response?.data?.detail ||
        "Unable to calculate trip ETA."
      );

    } finally {

      setEtaLoading(false);

    }

  };


  const closeEta = () => {
    setEtaData(null);
  };


  const getStatusVariant = (status) => {

    if (status === "Completed") {
      return "default";
    }

    if (status === "Cancelled") {
      return "destructive";
    }

    if (status === "In Progress") {
      return "secondary";
    }

    return "outline";

  };


  const formatDate = (value) => {

    if (!value) {
      return "—";
    }

    return new Date(value).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

  };


  const getDriverName = (driverId) => {

    const driver = drivers.find(
      (item) => item.id === driverId
    );

    return driver
      ? driver.name
      : "Unassigned";

  };


  const getVehicleName = (vehicleId) => {

    const vehicle = vehicles.find(
      (item) => item.id === vehicleId
    );

    return vehicle
      ? vehicle.registration_number
      : "Unassigned";

  };


  /*
   * Only shipments that can currently be used
   * to create a new trip.
   *
   * Requirements:
   * - Shipment has a vehicle
   * - Vehicle is active
   * - Vehicle is Available
   * - Vehicle has a driver
   * - Driver is active
   * - Driver is Available
   * - Shipment does not already have an active trip
   */

  const availableShipments = shipments.filter(
    (shipment) => {

      const vehicle = vehicles.find(
        (item) =>
          item.id === shipment.vehicle_id
      );

      if (!vehicle) {
        return false;
      }

      if (!vehicle.is_active) {
        return false;
      }

      if (vehicle.current_status !== "Available") {
        return false;
      }

      if (vehicle.driver_id === null) {
        return false;
      }

      const driver = drivers.find(
        (item) =>
          item.id === vehicle.driver_id
      );

      if (!driver) {
        return false;
      }

      if (!driver.is_active) {
        return false;
      }

      if (driver.status !== "Available") {
        return false;
      }

      const alreadyHasActiveTrip = trips.some(
        (trip) =>
          trip.shipment_id === shipment.id &&
          [
            "Scheduled",
            "Started",
            "In Progress",
          ].includes(trip.trip_status)
      );

      if (alreadyHasActiveTrip) {
        return false;
      }

      return true;

    }
  );


  const selectedShipment = shipments.find(
    (shipment) =>
      shipment.id === Number(form.shipment_id)
  );


  const selectedVehicle = selectedShipment
    ? vehicles.find(
        (vehicle) =>
          vehicle.id === selectedShipment.vehicle_id
      )
    : null;


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
            Trips
          </h1>

          <p>
            Schedule and monitor fleet trips.
          </p>

        </div>


        <Button onClick={openAddForm}>
          + Create Trip
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
            Trips ({trips.length})
          </CardTitle>

        </CardHeader>


        <CardContent>

          {loading ? (

            <div className="empty-state">
              Loading trips...
            </div>

          ) : trips.length === 0 ? (

            <div className="empty-state">

              <div className="empty-icon">
                🛣️
              </div>

              <h3>
                No trips yet
              </h3>

              <p>
                Create a trip to start managing
                vehicle journeys.
              </p>

              <Button onClick={openAddForm}>
                Create Trip
              </Button>

            </div>

          ) : (

            <div className="table-wrapper">

              <table className="fleet-table">

                <thead>

                  <tr>
                    <th>Trip</th>
                    <th>Shipment</th>
                    <th>Driver</th>
                    <th>Vehicle</th>
                    <th>Route</th>
                    <th>Start</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>

                </thead>


                <tbody>

                  {trips.map((trip) => {

                    const shipment = shipments.find(
                      (item) =>
                        item.id === trip.shipment_id
                    );

                    return (

                      <tr key={trip.id}>

                        <td>
                          <strong>
                            #{trip.id}
                          </strong>
                        </td>


                        <td>
                          {shipment
                            ? shipment.tracking_number
                            : `#${trip.shipment_id}`}
                        </td>


                        <td>
                          {getDriverName(
                            trip.driver_id
                          )}
                        </td>


                        <td>
                          {getVehicleName(
                            trip.vehicle_id
                          )}
                        </td>


                        <td>
                          {trip.pickup_location}
                          {" → "}
                          {trip.delivery_location}
                        </td>


                        <td>
                          {formatDate(
                            trip.scheduled_start_time
                          )}
                        </td>


                        <td>

                          <select
                            value={trip.trip_status}
                            onChange={(event) =>
                              updateStatus(
                                trip,
                                event.target.value
                              )
                            }
                            className="status-select"
                          >

                            {TRIP_STATUSES.map(
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

                        </td>


                        <td>

                          <div className="table-actions">

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                getEta(trip)
                              }
                              disabled={etaLoading}
                            >
                              ETA
                            </Button>

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setTrackingTripId(trip.id)
                              }
                            >
                              Live Track
                            </Button>


                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                openEditForm(trip)
                              }
                            >
                              Edit
                            </Button>


                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() =>
                                handleDelete(trip)
                              }
                            >
                              Delete
                            </Button>

                          </div>

                        </td>

                      </tr>

                    );

                  })}

                </tbody>

              </table>

            </div>

          )}

        </CardContent>

      </Card>


      {/* Create / Edit Trip */}

      {showForm && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  {editingTrip
                    ? "Edit Trip"
                    : "Create Trip"}
                </h2>

                <p>
                  {editingTrip
                    ? "Update the trip schedule."
                    : "Select a shipment to create a trip."}
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
                  Shipment
                </label>

                <select
                  name="shipment_id"
                  value={form.shipment_id}
                  onChange={handleChange}
                  className="form-select"
                  required
                  disabled={Boolean(editingTrip)}
                >

                  <option value="">
                    Select an available shipment
                  </option>

                  {editingTrip ? (

                    selectedShipment && (
                      <option
                        value={selectedShipment.id}
                      >
                        {selectedShipment.tracking_number}
                        {" — "}
                        {selectedShipment.pickup_location}
                        {" → "}
                        {selectedShipment.delivery_location}
                      </option>
                    )

                  ) : (

                    availableShipments.map(
                      (shipment) => (

                        <option
                          key={shipment.id}
                          value={shipment.id}
                        >
                          {shipment.tracking_number}
                          {" — "}
                          {shipment.pickup_location}
                          {" → "}
                          {shipment.delivery_location}
                        </option>

                      )
                    )

                  )}

                </select>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Vehicle
                  </label>

                  <Input
                    value={
                      selectedVehicle
                        ? `${selectedVehicle.registration_number} — ${selectedVehicle.vehicle_type}`
                        : "Vehicle will be assigned automatically"
                    }
                    readOnly
                    disabled
                  />

                </div>


                <div className="form-field">

                  <label>
                    Driver
                  </label>

                  <Input
                    value={
                      selectedDriver
                        ? `${selectedDriver.name} — ${selectedDriver.status}`
                        : "Driver will be assigned automatically"
                    }
                    readOnly
                    disabled
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
                    readOnly={!editingTrip}
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
                    readOnly={!editingTrip}
                  />

                </div>

              </div>


              <div className="form-row">

                <div className="form-field">

                  <label>
                    Scheduled Start
                  </label>

                  <Input
                    name="scheduled_start_time"
                    type="datetime-local"
                    value={form.scheduled_start_time}
                    onChange={handleChange}
                    required
                  />

                </div>


                <div className="form-field">

                  <label>
                    Scheduled End
                  </label>

                  <Input
                    name="scheduled_end_time"
                    type="datetime-local"
                    value={form.scheduled_end_time}
                    onChange={handleChange}
                    required
                  />

                </div>

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
                    (
                      !editingTrip &&
                      availableShipments.length === 0
                    )
                  }
                >
                  {saving
                    ? "Saving..."
                    : editingTrip
                      ? "Update Trip"
                      : "Create Trip"}
                </Button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* Live Tracking Modal */}

      {trackingTripId && (
        <div className="modal-backdrop">
          <div className="vehicle-modal">
            <LiveTracking
              tripId={trackingTripId}
              onClose={() => setTrackingTripId(null)}
            />
          </div>
        </div>
      )}

      {/* ETA Modal */}

      {etaData && (

        <div className="modal-backdrop">

          <div className="vehicle-modal">

            <div className="modal-header">

              <div>

                <h2>
                  Trip ETA
                </h2>

                <p>
                  Trip #{etaData.trip_id}
                </p>

              </div>


              <button
                className="modal-close"
                onClick={closeEta}
              >
                ×
              </button>

            </div>


            <div className="vehicle-form">

              <div className="tracking-grid">

                <div className="tracking-item">

                  <span>
                    Distance
                  </span>

                  <strong>
                    {Number(
                      etaData.distance_km
                    ).toFixed(1)} km
                  </strong>

                </div>


                <div className="tracking-item">

                  <span>
                    Estimated Duration
                  </span>

                  <strong>
                    {Math.floor(
                      etaData.estimated_duration_minutes /
                      60
                    )}h{" "}
                    {etaData.estimated_duration_minutes %
                      60}m
                  </strong>

                </div>


                <div className="tracking-item">

                  <span>
                    Estimated Arrival
                  </span>

                  <strong>
                    {formatDate(
                      etaData.estimated_arrival_time
                    )}
                  </strong>

                </div>

              </div>


              <div className="modal-actions">

                <Button onClick={closeEta}>
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


export default Trips;