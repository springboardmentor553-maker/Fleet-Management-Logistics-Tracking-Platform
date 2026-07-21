import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    getTrips,
    addTrip,
    deleteTrip
} from "../services/tripService";

import { getDrivers } from "../services/driverService";
import { getVehicles } from "../services/vehicleService";
import { getShipments } from "../services/shipmentService";

import "../styles/trip.css";

function Trips() {

    const [trips, setTrips] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [shipments, setShipments] = useState([]);

    const [form, setForm] = useState({
        shipment_id: "",
        vehicle_id: "",
        driver_id: "",
        start_location: "",
        end_location: "",
        departure_time: "",
        expected_arrival: "",
        current_latitude: "",
        current_longitude: "",
        destination_latitude: "",
        destination_longitude: "",
        status: "Scheduled"
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const tripData = await getTrips();
            const driverData = await getDrivers();
            const vehicleData = await getVehicles();
            const shipmentData = await getShipments();

            setTrips(tripData);
            setDrivers(driverData);
            setVehicles(vehicleData);
            setShipments(shipmentData);

        } catch (error) {
            console.error(error);
        }
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            await addTrip(form);

            alert("Trip Created Successfully");

            setForm({
                shipment_id: "",
                vehicle_id: "",
                driver_id: "",
                start_location: "",
                end_location: "",
                departure_time: "",
                expected_arrival: "",
                current_latitude: "",
                current_longitude: "",
                destination_latitude: "",
                destination_longitude: "",
                status: "Scheduled"
            });

            loadData();

        } catch (error) {
            console.error(error);
            alert("Failed to create trip");
        }
    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this trip?"))
            return;

        try {

            await deleteTrip(id);

            loadData();

        } catch (error) {
            console.error(error);
        }
    };

    return (

        <Layout>

            <div className="trip-page">

                <h2>Trip Management</h2>

                <form
                    className="trip-form"
                    onSubmit={handleSubmit}
                >

                    <select
                        name="shipment_id"
                        value={form.shipment_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Shipment</option>

                        {shipments.map((shipment) => (

                            <option
                                key={shipment.id}
                                value={shipment.id}
                            >
                                {shipment.tracking_id}
                            </option>

                        ))}

                    </select>

                    <select
                        name="vehicle_id"
                        value={form.vehicle_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Vehicle</option>

                        {vehicles.map((vehicle) => (

                            <option
                                key={vehicle.id}
                                value={vehicle.id}
                            >
                                {vehicle.vehicle_number}
                            </option>

                        ))}

                    </select>

                    <select
                        name="driver_id"
                        value={form.driver_id}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Driver</option>

                        {drivers.map((driver) => (

                            <option
                                key={driver.id}
                                value={driver.id}
                            >
                                {driver.name}
                            </option>

                        ))}

                    </select>

                    <input
                        type="text"
                        name="start_location"
                        placeholder="Start Location"
                        value={form.start_location}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="end_location"
                        placeholder="Destination"
                        value={form.end_location}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="datetime-local"
                        name="departure_time"
                        value={form.departure_time}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="datetime-local"
                        name="expected_arrival"
                        value={form.expected_arrival}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="current_latitude"
                        placeholder="Current Latitude"
                        value={form.current_latitude}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="current_longitude"
                        placeholder="Current Longitude"
                        value={form.current_longitude}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="destination_latitude"
                        placeholder="Destination Latitude"
                        value={form.destination_latitude}
                        onChange={handleChange}
                        required
                    />

                    <input
                        type="text"
                        name="destination_longitude"
                        placeholder="Destination Longitude"
                        value={form.destination_longitude}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option>Scheduled</option>
                        <option>In Transit</option>
                        <option>Completed</option>
                        <option>Cancelled</option>
                    </select>

                    <button type="submit">
                        Create Trip
                    </button>

                </form>

                <table>

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Shipment</th>
                            <th>Vehicle</th>
                            <th>Driver</th>
                            <th>From</th>
                            <th>To</th>
                            <th>Status</th>
                            <th>Action</th>

                        </tr>

                    </thead>

                    <tbody>

                        {trips.map((trip) => (

                            <tr key={trip.id}>

                                <td>{trip.id}</td>
                                <td>{trip.shipment_id}</td>
                                <td>{trip.vehicle_id}</td>
                                <td>{trip.driver_id}</td>
                                <td>{trip.start_location}</td>
                                <td>{trip.end_location}</td>
                                <td>{trip.status}</td>

                                <td>

                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(trip.id)}
                                    >
                                        Delete
                                    </button>

                                </td>

                            </tr>

                        ))}

                    </tbody>

                </table>

            </div>

        </Layout>

    );
}

export default Trips;