import { useEffect, useState } from "react";
import Layout from "../components/Layout";

import {
    getVehicles,
    addVehicle,
    deleteVehicle
} from "../services/vehicleService";

import "../styles/vehicle.css";

function Vehicles() {

    const [vehicles, setVehicles] = useState([]);

    const [form, setForm] = useState({
        vehicle_number: "",
        vehicle_type: "",
        capacity: "",
        status: "Available"
    });

    useEffect(() => {
        loadVehicles();
    }, []);

    const loadVehicles = async () => {
        const data = await getVehicles();
        setVehicles(data);
    };

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        await addVehicle(form);

        setForm({
            vehicle_number: "",
            vehicle_type: "",
            capacity: "",
            status: "Available"
        });

        loadVehicles();
    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this vehicle?")) return;

        await deleteVehicle(id);

        loadVehicles();
    };

    return (

        <Layout>

            <div className="vehicle-page">

                <h2>Vehicle Management</h2>

                <form
                    className="vehicle-form"
                    onSubmit={handleSubmit}
                >

                    <input
                        name="vehicle_number"
                        placeholder="Vehicle Number"
                        value={form.vehicle_number}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="vehicle_type"
                        placeholder="Vehicle Type"
                        value={form.vehicle_type}
                        onChange={handleChange}
                        required
                    />

                    <input
                        name="capacity"
                        placeholder="Capacity"
                        value={form.capacity}
                        onChange={handleChange}
                        required
                    />

                    <select
                        name="status"
                        value={form.status}
                        onChange={handleChange}
                    >
                        <option>Available</option>
                        <option>On Trip</option>
                        <option>Maintenance</option>
                    </select>

                    <button type="submit">
                        Add Vehicle
                    </button>

                </form>

                <table>

                    <thead>

                        <tr>
                            <th>ID</th>
                            <th>Vehicle No</th>
                            <th>Type</th>
                            <th>Capacity</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>

                    </thead>

                    <tbody>

                        {vehicles.map(vehicle => (

                            <tr key={vehicle.id}>

                                <td>{vehicle.id}</td>
                                <td>{vehicle.vehicle_number}</td>
                                <td>{vehicle.vehicle_type}</td>
                                <td>{vehicle.capacity}</td>
                                <td>{vehicle.status}</td>

                                <td>

                                    <button
                                        className="delete-btn"
                                        onClick={() =>
                                            handleDelete(vehicle.id)
                                        }
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

export default Vehicles;