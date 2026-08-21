import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    FaRoute,
    FaSearch,
    FaPlus,
    FaTrash,
    FaMapMarkerAlt,
    FaSyncAlt
} from "react-icons/fa";

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

    const navigate = useNavigate();

    // ========================================================
    // STATE
    // ========================================================

    const [trips, setTrips] = useState([]);

    const [drivers, setDrivers] = useState([]);

    const [vehicles, setVehicles] = useState([]);

    const [shipments, setShipments] = useState([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");

    const [submitting, setSubmitting] = useState(false);

    const [form, setForm] = useState({

        shipment_id: "",

        vehicle_id: "",

        driver_id: "",

        start_location: "",

        end_location: "",

        departure_time: "",

        expected_arrival: "",

        status: "Created"

    });


    // ========================================================
    // LOAD DATA
    // ========================================================

    useEffect(() => {

        loadData();

    }, []);


    const loadData = async () => {

        setLoading(true);

        setError("");


        // ====================================================
        // LOAD TRIPS
        // ====================================================

        try {

            const tripData = await getTrips();

            console.log(
                "Trips API response:",
                tripData
            );

            const tripsArray =
                Array.isArray(tripData)
                    ? tripData
                    : tripData?.data ||
                      tripData?.trips ||
                      tripData?.items ||
                      [];

            setTrips(tripsArray);

        } catch (err) {

            console.error(
                "Error loading trips:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to load trips."
            );

        }


        // ====================================================
        // LOAD DRIVERS
        // ====================================================

        try {

            const driverData = await getDrivers();

            console.log(
                "Drivers API response:",
                driverData
            );

            const driversArray =
                Array.isArray(driverData)
                    ? driverData
                    : driverData?.data ||
                      driverData?.drivers ||
                      driverData?.items ||
                      [];

            setDrivers(driversArray);

        } catch (err) {

            console.error(
                "Error loading drivers:",
                err
            );

        }


        // ====================================================
        // LOAD VEHICLES
        // ====================================================

        try {

            const vehicleData = await getVehicles();

            console.log(
                "Vehicles API response:",
                vehicleData
            );

            const vehiclesArray =
                Array.isArray(vehicleData)
                    ? vehicleData
                    : vehicleData?.data ||
                      vehicleData?.vehicles ||
                      vehicleData?.items ||
                      [];

            setVehicles(vehiclesArray);

        } catch (err) {

            console.error(
                "Error loading vehicles:",
                err
            );

        }


        // ====================================================
        // LOAD SHIPMENTS
        // ====================================================

        try {

            const shipmentData = await getShipments();

            console.log(
                "Shipments API response:",
                shipmentData
            );

            const shipmentsArray =
                Array.isArray(shipmentData)
                    ? shipmentData
                    : shipmentData?.data ||
                      shipmentData?.shipments ||
                      shipmentData?.items ||
                      [];

            setShipments(shipmentsArray);

        } catch (err) {

            console.error(
                "Error loading shipments:",
                err
            );

        }


        setLoading(false);
    };


    // ========================================================
    // FORM CHANGE
    // ========================================================

    const handleChange = (e) => {

        const {
            name,
            value
        } = e.target;

        setForm(
            previousForm => ({

                ...previousForm,

                [name]: value

            })
        );

    };


    // ========================================================
    // RESET FORM
    // ========================================================

    const resetForm = () => {

        setForm({

            shipment_id: "",

            vehicle_id: "",

            driver_id: "",

            start_location: "",

            end_location: "",

            departure_time: "",

            expected_arrival: "",

            status: "Created"

        });

    };


    // ========================================================
    // CREATE TRIP
    // ========================================================

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");


        // ====================================================
        // VALIDATION
        // ====================================================

        if (!form.shipment_id) {

            setError(
                "Please select a shipment."
            );

            return;
        }


        if (!form.vehicle_id) {

            setError(
                "Please select a vehicle."
            );

            return;
        }


        if (!form.driver_id) {

            setError(
                "Please select a driver."
            );

            return;
        }


        if (!form.start_location.trim()) {

            setError(
                "Please enter the start location."
            );

            return;
        }


        if (!form.end_location.trim()) {

            setError(
                "Please enter the destination."
            );

            return;
        }


        if (!form.departure_time) {

            setError(
                "Please select the departure time."
            );

            return;
        }


        // ====================================================
        // PAYLOAD
        // ====================================================

        const tripPayload = {

            shipment_id:
                Number(form.shipment_id),

            vehicle_id:
                Number(form.vehicle_id),

            driver_id:
                Number(form.driver_id),

            start_location:
                form.start_location.trim(),

            end_location:
                form.end_location.trim(),

            departure_time:
                form.departure_time,

            expected_arrival:
                form.expected_arrival
                    ? form.expected_arrival
                    : null,

            status:
                form.status || "Scheduled"

        };


        console.log(
            "Creating trip:",
            tripPayload
        );


        setSubmitting(true);


        try {

            await addTrip(
                tripPayload
            );


            resetForm();


            await loadData();


            alert(
                "Trip created successfully."
            );

        } catch (err) {

            console.error(
                "Error creating trip:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to create trip."
            );

        } finally {

            setSubmitting(false);

        }

    };


    // ========================================================
    // DELETE TRIP
    // ========================================================

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this trip?"
            );


        if (!confirmed) {

            return;

        }


        try {

            setError("");

            await deleteTrip(id);

            await loadData();

        } catch (err) {

            console.error(
                "Error deleting trip:",
                err
            );

            setError(
                err?.response?.data?.detail ||
                "Unable to delete trip."
            );

        }

    };


    // ========================================================
    // FIND SHIPMENT
    // ========================================================

    const getShipment = (shipmentId) => {

        return shipments.find(
            shipment =>
                Number(shipment.id) ===
                Number(shipmentId)
        );

    };


    // ========================================================
    // FIND VEHICLE
    // ========================================================

    const getVehicle = (vehicleId) => {

        return vehicles.find(
            vehicle =>
                Number(vehicle.id) ===
                Number(vehicleId)
        );

    };


    // ========================================================
    // FIND DRIVER
    // ========================================================

    const getDriver = (driverId) => {

        return drivers.find(
            driver =>
                Number(driver.id) ===
                Number(driverId)
        );

    };


    // ========================================================
    // FORMAT DATE
    // ========================================================

    const formatDate = (dateValue) => {

        if (!dateValue) {

            return "-";

        }


        const date =
            new Date(dateValue);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {

            return dateValue;

        }


        return date.toLocaleString();

    };


    // ========================================================
    // STATUS CLASS
    // ========================================================

    const getStatusClass = (status) => {

        if (!status) {

            return "Created";

        }


        return status
            .replace(/\s+/g, "")
            .replace(/-/g, "");

    };


    // ========================================================
    // SEARCH
    // ========================================================

    const searchText =
        search
            .trim()
            .toLowerCase();


    const filteredTrips =
        trips.filter(trip => {

            if (!searchText) {

                return true;

            }


            const shipment =
                getShipment(
                    trip.shipment_id
                );


            const vehicle =
                getVehicle(
                    trip.vehicle_id
                );


            const driver =
                getDriver(
                    trip.driver_id
                );


            const searchableText = [

                trip.id,

                trip.shipment_id,

                shipment?.tracking_id,

                trip.vehicle_id,

                vehicle?.vehicle_number,

                trip.driver_id,

                driver?.name,

                trip.start_location,

                trip.end_location,

                trip.status

            ]
                .filter(
                    value =>
                        value !== null &&
                        value !== undefined
                )
                .join(" ")
                .toLowerCase();


            return searchableText.includes(
                searchText
            );

        });


    // ========================================================
    // RENDER
    // ========================================================

    return (

        <Layout>

            <div className="trip-page">

                {/* ==================================================
                    HEADER
                ================================================== */}

                <div className="page-header">

                    <div>

                        <h1>

                            <FaRoute />

                            Trip Management

                        </h1>

                        <p>
                            Manage logistics trips and live tracking
                        </p>

                    </div>


                    <button
                        type="button"
                        className="track-btn"
                        onClick={loadData}
                        disabled={loading}
                    >

                        <FaSyncAlt />

                        {loading
                            ? "Loading..."
                            : "Refresh"}

                    </button>

                </div>


                {/* ==================================================
                    ERROR
                ================================================== */}

                {error && (

                    <div
                        style={{
                            background: "#FEE2E2",
                            color: "#B91C1C",
                            padding: "14px 18px",
                            borderRadius: "10px",
                            fontWeight: "600",
                            marginBottom: "20px"
                        }}
                    >

                        {error}

                    </div>

                )}


                {/* ==================================================
                    SEARCH
                ================================================== */}

                <div className="search-box">

                    <FaSearch />

                    <input
                        type="text"
                        placeholder="Search trips, shipment, vehicle, driver, route..."
                        value={search}
                        onChange={
                            e =>
                                setSearch(
                                    e.target.value
                                )
                        }
                    />

                </div>


                {/* ==================================================
                    CREATE TRIP FORM
                ================================================== */}

                <form
                    className="trip-form"
                    onSubmit={handleSubmit}
                >

                    {/* SHIPMENT */}

                    <select
                        name="shipment_id"
                        value={form.shipment_id}
                        onChange={handleChange}
                        required
                    >

                        <option value="">
                            Select Shipment
                        </option>


                        {shipments.map(
                            shipment => (

                                <option
                                    key={shipment.id}
                                    value={shipment.id}
                                >

                                    {shipment.tracking_id ||
                                        `Shipment #${shipment.id}`}

                                </option>

                            )
                        )}

                    </select>


                    {/* VEHICLE */}

                    <select
                        name="vehicle_id"
                        value={form.vehicle_id}
                        onChange={handleChange}
                        required
                    >

                        <option value="">
                            Select Vehicle
                        </option>


                        {vehicles.map(
                            vehicle => (

                                <option
                                    key={vehicle.id}
                                    value={vehicle.id}
                                >

                                    {vehicle.vehicle_number ||
                                        `Vehicle #${vehicle.id}`}

                                </option>

                            )
                        )}

                    </select>


                    {/* DRIVER */}

                    <select
                        name="driver_id"
                        value={form.driver_id}
                        onChange={handleChange}
                        required
                    >

                        <option value="">
                            Select Driver
                        </option>


                        {drivers.map(
                            driver => (

                                <option
                                    key={driver.id}
                                    value={driver.id}
                                >

                                    {driver.name ||
                                        `Driver #${driver.id}`}

                                </option>

                            )
                        )}

                    </select>


                    {/* START */}

                    <input
                        type="text"
                        name="start_location"
                        placeholder="Start Location"
                        value={form.start_location}
                        onChange={handleChange}
                        required
                    />


                    {/* DESTINATION */}

                    <input
                        type="text"
                        name="end_location"
                        placeholder="Destination"
                        value={form.end_location}
                        onChange={handleChange}
                        required
                    />


                    {/* DEPARTURE */}

                    <input
                        type="datetime-local"
                        name="departure_time"
                        value={form.departure_time}
                        onChange={handleChange}
                        required
                    />


                    {/* EXPECTED ARRIVAL */}

                    <input
                        type="datetime-local"
                        name="expected_arrival"
                        value={form.expected_arrival}
                        onChange={handleChange}
                    />


                    {/* STATUS */}

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >

                        <option value="Created">
                            Created
                        </option>

                        <option value="Assigned">
                            Assigned
                        </option>

                        <option value="Picked Up">
                            Picked Up
                        </option>

                        <option value="In Transit">
                            In Transit
                        </option>

                        <option value="Delivered">
                            Delivered
                        </option>

                        <option value="Cancelled">
                            Cancelled
                        </option>

                    </select>


                    {/* CREATE */}

                    <button
                        type="submit"
                        disabled={submitting}
                    >

                        <FaPlus />

                        {submitting
                            ? "Creating..."
                            : "Create Trip"}

                    </button>

                </form>


                {/* ==================================================
                    COUNT
                ================================================== */}

                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "15px"
                    }}
                >

                    <strong>

                        {filteredTrips.length}

                        {" "}

                        trip
                        {filteredTrips.length !== 1
                            ? "s"
                            : ""}

                    </strong>


                    {search && (

                        <span>

                            Showing results for:

                            {" "}

                            <strong>
                                "{search}"
                            </strong>

                        </span>

                    )}

                </div>


                {/* ==================================================
                    TABLE
                ================================================== */}

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>ID</th>

                                <th>Shipment</th>

                                <th>Vehicle</th>

                                <th>Driver</th>

                                <th>Route</th>

                                <th>Departure</th>

                                <th>Arrival</th>

                                <th>Status</th>

                                <th>Tracking</th>

                                <th>Action</th>

                            </tr>

                        </thead>


                        <tbody>

                            {loading ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            padding: "40px",
                                            textAlign: "center"
                                        }}
                                    >

                                        Loading trips...

                                    </td>

                                </tr>

                            ) : filteredTrips.length === 0 ? (

                                <tr>

                                    <td
                                        colSpan="10"
                                        style={{
                                            padding: "40px",
                                            textAlign: "center"
                                        }}
                                    >

                                        {trips.length === 0
                                            ? "No trips found in the database."
                                            : "No trips match your search."}

                                    </td>

                                </tr>

                            ) : (

                                filteredTrips.map(
                                    trip => {

                                        const shipment =
                                            getShipment(
                                                trip.shipment_id
                                            );


                                        const vehicle =
                                            getVehicle(
                                                trip.vehicle_id
                                            );


                                        const driver =
                                            getDriver(
                                                trip.driver_id
                                            );


                                        return (

                                            <tr
                                                key={trip.id}
                                            >

                                                {/* ID */}

                                                <td>
                                                    {trip.id}
                                                </td>


                                                {/* SHIPMENT */}

                                                <td>

                                                    {shipment?.tracking_id ||
                                                        `Shipment #${trip.shipment_id}`}

                                                </td>


                                                {/* VEHICLE */}

                                                <td>

                                                    {vehicle?.vehicle_number ||
                                                        `Vehicle #${trip.vehicle_id}`}

                                                </td>


                                                {/* DRIVER */}

                                                <td>

                                                    {driver?.name ||
                                                        `Driver #${trip.driver_id}`}

                                                </td>


                                                {/* ROUTE */}

                                                <td>

                                                    <div className="route-box">

                                                        <span>
                                                            {trip.start_location ||
                                                                "-"}
                                                        </span>

                                                        <span className="arrow">
                                                            →
                                                        </span>

                                                        <span>
                                                            {trip.end_location ||
                                                                "-"}
                                                        </span>

                                                    </div>

                                                </td>


                                                {/* DEPARTURE */}

                                                <td>

                                                    {formatDate(
                                                        trip.departure_time
                                                    )}

                                                </td>


                                                {/* ARRIVAL */}

                                                <td>

                                                    {formatDate(
                                                        trip.expected_arrival
                                                    )}

                                                </td>


                                                {/* STATUS */}

                                                <td>

                                                    <span
                                                        className={`status ${getStatusClass(
                                                            trip.status
                                                        )}`}
                                                    >

                                                        {trip.status ||
                                                            "Created"}

                                                    </span>

                                                </td>


                                                {/* TRACKING */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="track-btn"
                                                        onClick={() =>
                                                            navigate(
                                                                `/tracking/${trip.id}`
                                                            )
                                                        }
                                                    >

                                                        <FaMapMarkerAlt />

                                                        Live

                                                    </button>

                                                </td>


                                                {/* DELETE */}

                                                <td>

                                                    <button
                                                        type="button"
                                                        className="delete-btn"
                                                        onClick={() =>
                                                            handleDelete(
                                                                trip.id
                                                            )
                                                        }
                                                    >

                                                        <FaTrash />

                                                    </button>

                                                </td>

                                            </tr>

                                        );

                                    }
                                )

                            )}

                        </tbody>

                    </table>

                </div>

            </div>

        </Layout>

    );

}


export default Trips;