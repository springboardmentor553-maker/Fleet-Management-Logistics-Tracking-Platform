import { useState, useEffect } from "react";
import api from "../../services/api";
import "./Vehicle.css";

function VehicleForm({ selectedVehicle, fetchVehicles }) {

    const [vehicleNumber, setVehicleNumber] = useState("");
    const [registrationNumber, setRegistrationNumber] = useState("");
    const [vehicleType, setVehicleType] = useState("");
    const [capacity, setCapacity] = useState("");
    const [fuelType, setFuelType] = useState("");
    const [status, setStatus] = useState("Available");
    const [driverId, setDriverId] = useState("");

    useEffect(() => {

        if (selectedVehicle) {

            setVehicleNumber(selectedVehicle.vehicle_number);
            setRegistrationNumber(selectedVehicle.registration_number);
            setVehicleType(selectedVehicle.vehicle_type);
            setCapacity(selectedVehicle.capacity);
            setFuelType(selectedVehicle.fuel_type);
            setStatus(selectedVehicle.status);
            setDriverId(selectedVehicle.driver_id);

        }

    }, [selectedVehicle]);

    const handleSubmit = async (e) => {

        e.preventDefault();

        const vehicleData = {

            vehicle_number: vehicleNumber,
            registration_number: registrationNumber,
            vehicle_type: vehicleType,
            capacity: Number(capacity),
            fuel_type: fuelType,
            status: status,
            driver_id: Number(driverId)

        };

        try {

            if (selectedVehicle) {

                await api.put(

                    `/vehicles/${selectedVehicle.id}`,

                    vehicleData

                );

                alert("Vehicle Updated Successfully");

            }

            else {

                await api.post(

                    "/vehicles",

                    vehicleData

                );

                alert("Vehicle Added Successfully");

            }

            setVehicleNumber("");
            setRegistrationNumber("");
            setVehicleType("");
            setCapacity("");
            setFuelType("");
            setStatus("Available");
            setDriverId("");

            fetchVehicles();

        }

        catch (error) {

            console.log(error);

            alert("Operation Failed");

        }

    };

    return (

        <div className="vehicle-form">

            <h2>

                {selectedVehicle ? "Edit Vehicle" : "Add Vehicle"}

            </h2>

            <form onSubmit={handleSubmit}>

                <input

                    type="text"

                    placeholder="Vehicle Number"

                    value={vehicleNumber}

                    onChange={(e) => setVehicleNumber(e.target.value)}

                    required

                />

                <input

                    type="text"

                    placeholder="Registration Number"

                    value={registrationNumber}

                    onChange={(e) => setRegistrationNumber(e.target.value)}

                    required

                />

                <input

                    type="text"

                    placeholder="Vehicle Type"

                    value={vehicleType}

                    onChange={(e) => setVehicleType(e.target.value)}

                    required

                />

                <input

                    type="number"

                    placeholder="Capacity"

                    value={capacity}

                    onChange={(e) => setCapacity(e.target.value)}

                    required

                />

                <input

                    type="text"

                    placeholder="Fuel Type"

                    value={fuelType}

                    onChange={(e) => setFuelType(e.target.value)}

                    required

                />

                <select

                    value={status}

                    onChange={(e) => setStatus(e.target.value)}

                >

                    <option>Available</option>

                    <option>In Use</option>

                    <option>Maintenance</option>

                </select>

                <input

                    type="number"

                    placeholder="Driver ID"

                    value={driverId}

                    onChange={(e) => setDriverId(e.target.value)}

                    required

                />

                <button type="submit">

                    {selectedVehicle ? "Update Vehicle" : "Add Vehicle"}

                </button>

            </form>

        </div>

    );

}

export default VehicleForm;