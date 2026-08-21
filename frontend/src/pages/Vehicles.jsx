import { useEffect, useState } from "react";
import {
    FaTrash,
    FaTruck,
    FaSearch,
    FaPlus
} from "react-icons/fa";

import Layout from "../components/Layout";

import {
    getVehicles,
    addVehicle,
    deleteVehicle
} from "../services/vehicleService";

import "../styles/vehicle.css";

function Vehicles() {

    const [vehicles, setVehicles] = useState([]);

    const [search, setSearch] = useState("");

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
        try {
            const data = await getVehicles();
            setVehicles(data);
        } catch (error) {
            console.log(error);
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

        if (!window.confirm("Delete this vehicle?"))
            return;

        await deleteVehicle(id);

        loadVehicles();
    };

    const filteredVehicles = vehicles.filter((vehicle) =>
        vehicle.vehicle_number.toLowerCase().includes(search.toLowerCase()) ||
        vehicle.vehicle_type.toLowerCase().includes(search.toLowerCase())
    );

    return (

        <Layout>

            <div className="vehicle-page">

                <div className="page-header">

                    <div>

                        <h1>
                            <FaTruck /> Vehicle Management
                        </h1>

                        <p>
                            Manage all fleet vehicles
                        </p>

                    </div>

                </div>

                <div className="search-box">

                    <FaSearch />

                    <input
                        placeholder="Search vehicle..."
                        value={search}
                        onChange={(e) =>
                            setSearch(e.target.value)
                        }
                    />

                </div>

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
                        type="number"
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
                        <option value="Available">Available</option>
                        <option value="Assigned">Assigned</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Maintenance">Maintenance</option>
                    </select>

                    <button type="submit">
                        <FaPlus />
                        Add Vehicle
                    </button>

                </form>

                <div className="table-container">

                    <table>

                        <thead>

                            <tr>

                                <th>ID</th>
                                <th>Vehicle</th>
                                <th>Type</th>
                                <th>Capacity</th>
                                <th>Status</th>
                                <th>Action</th>

                            </tr>

                        </thead>

                        <tbody>

                            {filteredVehicles.map((vehicle) => (

                                <tr key={vehicle.id}>

                                    <td>{vehicle.id}</td>

                                    <td>{vehicle.vehicle_number}</td>

                                    <td>{vehicle.vehicle_type}</td>

                                    <td>{vehicle.capacity}</td>

                                    <td>

                                        <span
                                            className={`status ${vehicle.status
                                                .toLowerCase()
                                                .replace(/\s+/g, "-")}`}
                                        >
                                            {vehicle.status}
                                        </span>

                                    </td>

                                    <td>

                                        <button
                                            className="delete-btn"
                                            onClick={() =>
                                                handleDelete(vehicle.id)
                                            }
                                        >
                                            <FaTrash />
                                        </button>

                                    </td>

                                </tr>

                            ))}

                        </tbody>

                    </table>

                </div>

            </div>

        </Layout>

    );

}

export default Vehicles;