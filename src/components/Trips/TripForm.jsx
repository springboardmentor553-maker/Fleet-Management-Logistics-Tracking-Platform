import { useEffect, useState } from "react";
import api from "../../services/api";
import "./Trip.css";

function TripForm({

    selectedTrip,

    fetchTrips,

    setSelectedTrip

}) {

    const [drivers, setDrivers] = useState([]);

    const [vehicles, setVehicles] = useState([]);

    const [shipments, setShipments] = useState([]);

    const [errorMessage, setErrorMessage] = useState("");

    const [successMessage, setSuccessMessage] = useState("");

    const [formData, setFormData] = useState({

        shipment_id: "",

        driver_id: "",

        vehicle_id: "",

        pickup_location: "",

        destination: "",

        scheduled_start_time: "",

        scheduled_end_time: "",

        trip_status: "Scheduled"

    });

    useEffect(() => {

        loadDropdownData();

    }, []);

    useEffect(() => {

        if (selectedTrip) {

            setFormData({

                shipment_id: selectedTrip.shipment_id,

                driver_id: selectedTrip.driver_id,

                vehicle_id: selectedTrip.vehicle_id,

                pickup_location: selectedTrip.pickup_location,

                destination: selectedTrip.destination,

                scheduled_start_time: selectedTrip.scheduled_start_time,

                scheduled_end_time: selectedTrip.scheduled_end_time,

                trip_status: selectedTrip.trip_status

            });

        }

        else {

            resetForm();

        }

    }, [selectedTrip]);

    const loadDropdownData = async () => {

        try {

            const driverRes = await api.get("/drivers");

            const vehicleRes = await api.get("/vehicles");

            const shipmentRes = await api.get("/shipments");

            setDrivers(driverRes.data);

            setVehicles(vehicleRes.data);

            setShipments(shipmentRes.data);

        }

        catch (error) {

            console.log(error);

        }

    };

    const resetForm = () => {

        setFormData({

            shipment_id: "",

            driver_id: "",

            vehicle_id: "",

            pickup_location: "",

            destination: "",

            scheduled_start_time: "",

            scheduled_end_time: "",

            trip_status: "Scheduled"

        });

    };

    const handleChange = (e) => {

        setFormData({

            ...formData,

            [e.target.name]: e.target.value

        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setErrorMessage("");

        setSuccessMessage("");

        try {

            if (selectedTrip) {

                await api.put(

                    `/trips/${selectedTrip.id}`,

                    formData

                );

                setSuccessMessage("Trip updated successfully.");

            }

            else {

                await api.post(

                    "/trips",

                    formData

                );

                setSuccessMessage("Trip created successfully.");

            }

            fetchTrips();

            resetForm();

            setSelectedTrip(null);

        }

        catch (error) {

            if (

                error.response &&

                error.response.data.detail

            ) {

                setErrorMessage(

                    error.response.data.detail

                );

            }

            else {

                setErrorMessage(

                    "Something went wrong."

                );

            }

        }

    };

    return (

        <div className="trip-form-card">

            <h2>

                {

                    selectedTrip

                    ?

                    "Update Trip"

                    :

                    "Create Trip"

                }

            </h2>

            {

                errorMessage &&

                <div className="error-box">

                    {errorMessage}

                </div>

            }

            {

                successMessage &&

                <div className="success-box">

                    {successMessage}

                </div>

            }

            <form

                className="trip-form"

                onSubmit={handleSubmit}

            >                {/* Shipment */}

                <div className="form-group">

                    <label>Shipment</label>

                    <select
                        name="shipment_id"
                        value={formData.shipment_id}
                        onChange={handleChange}
                        required
                    >

                        <option value="">Select Shipment</option>

                        {

                            shipments.map((shipment) => (

                                <option
                                    key={shipment.id}
                                    value={shipment.id}
                                >

                                    {shipment.tracking_number}

                                </option>

                            ))

                        }

                    </select>

                </div>

                {/* Driver */}

                <div className="form-group">

                    <label>Driver</label>

                    <select
                        name="driver_id"
                        value={formData.driver_id}
                        onChange={handleChange}
                        required
                    >

                        <option value="">Select Driver</option>

                        {

                            drivers.map((driver) => (

                                <option
                                    key={driver.id}
                                    value={driver.id}
                                >

                                    {driver.name}

                                </option>

                            ))

                        }

                    </select>

                </div>

                {/* Vehicle */}

                <div className="form-group">

                    <label>Vehicle</label>

                    <select
                        name="vehicle_id"
                        value={formData.vehicle_id}
                        onChange={handleChange}
                        required
                    >

                        <option value="">Select Vehicle</option>

                        {

                            vehicles.map((vehicle) => (

                                <option
                                    key={vehicle.id}
                                    value={vehicle.id}
                                >

                                    {vehicle.vehicle_number}

                                </option>

                            ))

                        }

                    </select>

                </div>

                {/* Pickup */}

                <div className="form-group">

                    <label>Pickup Location</label>

                    <input
                        type="text"
                        name="pickup_location"
                        placeholder="Enter Pickup Location"
                        value={formData.pickup_location}
                        onChange={handleChange}
                        required
                    />

                </div>

                {/* Destination */}

                <div className="form-group">

                    <label>Destination</label>

                    <input
                        type="text"
                        name="destination"
                        placeholder="Enter Destination"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                    />

                </div>

                {/* Start Time */}

                <div className="form-group">

                    <label>Scheduled Start</label>

                    <input
                        type="datetime-local"
                        name="scheduled_start_time"
                        value={formData.scheduled_start_time}
                        onChange={handleChange}
                        required
                    />

                </div>

                {/* End Time */}

                <div className="form-group">

                    <label>Scheduled End</label>

                    <input
                        type="datetime-local"
                        name="scheduled_end_time"
                        value={formData.scheduled_end_time}
                        onChange={handleChange}
                        required
                    />

                </div>

                {/* Status */}

                <div className="form-group">

                    <label>Trip Status</label>

                    <select
                        name="trip_status"
                        value={formData.trip_status}
                        onChange={handleChange}
                    >

                        <option value="Scheduled">Scheduled</option>

                        <option value="In Progress">In Progress</option>

                        <option value="Completed">Completed</option>

                        <option value="Cancelled">Cancelled</option>

                    </select>

                </div>

                <div className="button-group">

                    <button
                        type="submit"
                        className="save-btn"
                    >

                        {

                            selectedTrip

                                ?

                                "Update Trip"

                                :

                                "Create Trip"

                        }

                    </button>

                </div>

            </form>

        </div>

    );

}

export default TripForm;