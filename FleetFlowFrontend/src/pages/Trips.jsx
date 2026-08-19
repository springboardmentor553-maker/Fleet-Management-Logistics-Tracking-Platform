import React, { useEffect, useState } from "react";
import api from "../api/axios";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [shipments, setShipments] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [vehicles, setVehicles] = useState([]);

  const [formData, setFormData] = useState({
    shipment_id: "",
    driver_id: "",
    vehicle_id: "",
    pickup_location: "",
    destination: "",
    scheduled_start_time: "",
    scheduled_end_time: "",
    status: "Scheduled",
  });

  useEffect(() => {
    fetchTrips();
    fetchShipments();
    fetchDrivers();
  fetchVehicles();
  }, []);

  const fetchTrips = async () => {
    try {
      const response = await api.get("/trips");
      setTrips(response.data);
    } catch (error) {
      console.error("Error fetching trips:", error);
      alert("Failed to load trips.");
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const createTrip = async (e) => {
    e.preventDefault();

    try {
      await api.post("/trips", {
        shipment_id: Number(formData.shipment_id),
        driver_id: Number(formData.driver_id),
        vehicle_id: Number(formData.vehicle_id),
        pickup_location: formData.pickup_location,
        destination: formData.destination,
        scheduled_start_time: formData.scheduled_start_time,
        scheduled_end_time: formData.scheduled_end_time,
        status: formData.status,
      });

      alert("Trip created successfully.");

      setFormData({
        shipment_id: "",
        driver_id: "",
        vehicle_id: "",
        pickup_location: "",
        destination: "",
        scheduled_start_time: "",
        scheduled_end_time: "",
        status: "Scheduled",
      });

      fetchTrips();
    } catch (error) {
      console.error(error);
      alert("Failed to create trip.");
    }
  };

  const deleteTrip = async (id) => {
    if (!window.confirm("Delete this trip?")) return;

    try {
      await api.delete(`/trips/${id}`);
      fetchTrips();
    } catch (error) {
      console.error(error);
      alert("Failed to delete trip.");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Trip Management</h1>

      <form onSubmit={createTrip}>
        <input
          type="number"
          name="shipment_id"
          placeholder="Shipment ID"
          value={formData.shipment_id}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="number"
          name="driver_id"
          placeholder="Driver ID"
          value={formData.driver_id}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="number"
          name="vehicle_id"
          placeholder="Vehicle ID"
          value={formData.vehicle_id}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="text"
          name="pickup_location"
          placeholder="Pickup Location"
          value={formData.pickup_location}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <input
          type="text"
          name="destination"
          placeholder="Destination"
          value={formData.destination}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <label>Scheduled Start Time</label>

        <br />

        <input
          type="datetime-local"
          name="scheduled_start_time"
          value={formData.scheduled_start_time}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <label>Scheduled End Time</label>

        <br />

        <input
          type="datetime-local"
          name="scheduled_end_time"
          value={formData.scheduled_end_time}
          onChange={handleChange}
          required
        />

        <br />
        <br />

        <select
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
        </select>

        <br />
        <br />

        <button type="submit">
          Create Trip
        </button>
      </form>

      <hr />

      <h2>Trips</h2>

      <button onClick={fetchTrips}>
        Refresh
      </button>

      <br />
      <br />

      <table
        border="1"
        cellPadding="10"
        style={{
          borderCollapse: "collapse",
          width: "100%",
        }}
      >
        <thead>
          <tr>
            <th>ID</th>
            <th>Shipment</th>
            <th>Driver</th>
            <th>Vehicle</th>
            <th>Pickup</th>
            <th>Destination</th>
            <th>Status</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {trips.length === 0 ? (
            <tr>
              <td colSpan="10" align="center">
                No Trips Found
              </td>
            </tr>
          ) : (
            trips.map((trip) => (
              <tr key={trip.id}>
                <td>{trip.id}</td>
                <td>{trip.shipment_id}</td>
                <td>{trip.driver_id}</td>
                <td>{trip.vehicle_id}</td>
                <td>{trip.pickup_location}</td>
                <td>{trip.destination}</td>
                <td>{trip.status}</td>
                <td>{trip.scheduled_start_time}</td>
                <td>{trip.scheduled_end_time}</td>
                <td>
                  <button
                    onClick={() => deleteTrip(trip.id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Trips;